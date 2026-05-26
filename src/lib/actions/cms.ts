"use server";

import { supabaseServer } from '../supabase-server';
import { verifyAdminAccess } from './auth';
import { z } from 'zod';
import { revalidatePath } from 'next/cache';

const PageSchema = z.object({
    id: z.string(),
    name: z.string(),
    slug: z.string(),
    type: z.enum(['homepage', 'collection', 'product', 'lookbook', 'campaign', 'festival', 'custom']),
    status: z.enum(['draft', 'published', 'scheduled', 'archived', 'sandbox']),
    sections: z.array(z.any()),
    seo_metadata: z.object({
        title: z.string().optional(),
        description: z.string().optional()
    }).optional(),
    isDeleted: z.boolean().optional(),
    approval_status: z.enum(['Draft', 'Pending Review', 'Approved', 'Rejected']).optional(),
    requested_by: z.string().optional(),
    approval_notes: z.string().optional(),
    rejection_feedback: z.string().optional()
}).passthrough();

const CMSConfigSchema = z.object({
    pages: z.array(PageSchema),
    globalSettings: z.record(z.string(), z.any()).optional(),
    currentPageId: z.string().optional()
}).passthrough();

// Rate limiting cache: mapping function name to the last execution timestamp
const rateLimits = new Map<string, number>();

export async function saveDraftCMSAction(config: any, lastUpdatedAt?: string) {
    // Phase 5: Basic rate limiting or debouncing for CMS save operations
    const now = Date.now();
    const lastSaved = rateLimits.get('saveDraftCMSAction') || 0;
    if (now - lastSaved < 1000) {
        throw new Error("Rate limit exceeded: Please wait before saving again.");
    }
    rateLimits.set('saveDraftCMSAction', now);

    // Both Staff and Manager can save drafts
    await verifyAdminAccess(['Manager', 'Staff'], 'Save CMS Draft');

    // Phase 2: Strict Zod schema validation
    const parsedConfig = CMSConfigSchema.parse(config);

    // Phase 2: Optimistic concurrency control
    if (lastUpdatedAt) {
        const { data: existing } = await supabaseServer
            .from('store_ui_settings')
            .select('updated_at')
            .eq('id', 2)
            .single();

        if (existing?.updated_at && new Date(existing.updated_at).getTime() !== new Date(lastUpdatedAt).getTime()) {
            throw new Error("Concurrency Conflict: The draft has been updated by another user. Please refresh and try again.");
        }
    }

    const { error } = await supabaseServer
        .from('store_ui_settings')
        .upsert({
            id: 2,
            config: parsedConfig,
            updated_at: new Date().toISOString()
        });

    if (error) throw new Error("Failed to save draft: " + error.message);
    return { success: true };
}

// Pillar 5 & 7: Pre-flight checks
function runPreFlightChecks(config: any) {
    const allowedDomains = ['images.unsplash.com', 'res.cloudinary.com', 'cdn.shopify.com', 'player.vimeo.com', 'awyqinnivsvqsohfmmcj.supabase.co'];
    
    for (const page of config.pages || []) {
        for (const section of page.sections || []) {
            // Check Media Governance (Pillar 7)
            const mediaUrl = section.settings?.image_url || section.settings?.media_url;
            if (mediaUrl) {
                try {
                    const url = new URL(mediaUrl);
                    if (!allowedDomains.includes(url.hostname)) {
                        throw new Error(`Media Governance Violation: Domain '${url.hostname}' is not approved for production use. Please use an approved CDN.`);
                    }
                } catch (e: any) {
                    if (e.message.includes('Media Governance Violation')) throw e;
                }
            }
            
            // Check SEO/Validation (Pillar 5)
            if (section.type === 'cinematic_hero' && !mediaUrl) {
                throw new Error(`Validation Error: Cinematic Hero on page '${page.name}' is missing a background media URL.`);
            }
        }
    }
}

// Pillar 8: Algorithmic Diff Generation
function generateDiffNotes(oldConfig: any, newConfig: any): string {
    if (!oldConfig) return "Initial CMS Configuration published.";
    const changes: string[] = [];
    
    const oldPages = oldConfig.pages || [];
    const newPages = newConfig.pages || [];
    
    if (oldPages.length !== newPages.length) {
        changes.push(oldPages.length < newPages.length ? 'Added new page(s)' : 'Removed page(s)');
    }
    
    newPages.forEach((page: any) => {
        const oldPage = oldPages.find((p: any) => p.id === page.id);
        if (oldPage) {
            if (JSON.stringify(oldPage.sections) !== JSON.stringify(page.sections)) {
                changes.push(`Updated sections on '${page.name}'`);
            }
            if (JSON.stringify(oldPage.seo_metadata) !== JSON.stringify(page.seo_metadata)) {
                changes.push(`Updated SEO metadata on '${page.name}'`);
            }
        }
    });
    
    return changes.length > 0 ? changes.join('; ') : "Minor visual or settings tweaks.";
}

export async function publishCMSAction(config: any) {
    // ONLY Managers can publish directly to live
    await verifyAdminAccess(['Manager'], 'Publish CMS Live');

    // Phase 2: Strict Zod schema validation
    const parsedConfig = CMSConfigSchema.parse(config);

    // Pillar 5 & 7: Run Pre-Flight Checks
    runPreFlightChecks(parsedConfig);

    // Phase 4: Transaction fallbacks and proper try/catch error boundaries
    try {
        // Pillar 8: AI Diff Generation
        const { data: liveData } = await supabaseServer.from('store_ui_settings').select('config').eq('id', 1).single();
        const autoNotes = generateDiffNotes(liveData?.config, parsedConfig);

        // Save to Live
        const { error: liveError } = await supabaseServer
            .from('store_ui_settings')
            .upsert({
                id: 1,
                config: parsedConfig,
                updated_at: new Date().toISOString()
            });
            
        if (liveError) throw new Error("Failed to publish live: " + liveError.message);

        // Save to Draft to keep them synced
        const { error: draftError } = await supabaseServer
            .from('store_ui_settings')
            .upsert({
                id: 2,
                config: parsedConfig,
                updated_at: new Date().toISOString()
            });
            
        if (draftError) throw new Error("Failed to sync draft after publish: " + draftError.message);

        // Phase 5: Insert an audit log into page_audit_logs
        await supabaseServer.from('page_audit_logs').insert({
            action: 'CMS Published Live'
        });

        // Pillar 2 & 8: Create Immutable Publish Snapshot with AI Notes
        await supabaseServer.from('cms_publish_snapshots').insert({
            config: parsedConfig,
            publish_notes: `Manual Publish. AI Summary: ${autoNotes}`
        });

        // Phase 3: Invalidate edge cache for immediate live site update
        revalidatePath('/', 'layout');

        return { success: true };
    } catch (error: any) {
        throw new Error("Publish transaction failed: " + error.message);
    }
}

export async function rollbackCMSAction(snapshotId?: string) {
    // ONLY Managers can perform a rollback
    await verifyAdminAccess(['Manager'], 'Rollback CMS Draft');

    try {
        let configToRestore;

        if (snapshotId) {
            // Rollback to a specific historical snapshot
            const { data, error } = await supabaseServer
                .from('cms_publish_snapshots')
                .select('config')
                .eq('id', snapshotId)
                .single();
                
            if (error || !data?.config) {
                throw new Error("Historical snapshot not found.");
            }
            configToRestore = data.config;
        } else {
            // Fetch Live config
            const { data, error } = await supabaseServer
                .from('store_ui_settings')
                .select('config')
                .eq('id', 1)
                .single();

            if (error || !data?.config) {
                throw new Error("No live configuration found to rollback to.");
            }
            configToRestore = data.config;
        }

        // Overwrite draft with the chosen config
        const { error: rollbackError } = await supabaseServer
            .from('store_ui_settings')
            .upsert({
                id: 2,
                config: configToRestore,
                updated_at: new Date().toISOString()
            });

        if (rollbackError) throw new Error("Failed to rollback draft: " + rollbackError.message);
        
        // Phase 5: Insert an audit log into page_audit_logs
        await supabaseServer.from('page_audit_logs').insert({
            action: snapshotId ? 'CMS Rolled Back to Historical Snapshot' : 'CMS Draft Rolled Back to Live'
        });

        // Pillar 2: Create Immutable Publish Snapshot for the Rollback
        await supabaseServer.from('cms_publish_snapshots').insert({
            config: configToRestore,
            publish_notes: snapshotId ? `Rolled back to snapshot ${snapshotId}` : 'Rolled back to previous Live state',
            rollback_source_metadata: snapshotId ? { source_snapshot_id: snapshotId } : { source: 'live' }
        });

        return { success: true, config: configToRestore };
    } catch (error: any) {
        throw new Error("Rollback failed: " + error.message);
    }
}

export async function requestPublishApprovalCMSAction(config: any, notes: string, submitterEmail: string) {
    // Staff and Managers can request approval
    await verifyAdminAccess(['Manager', 'Staff'], 'Request CMS Publish Approval');

    const parsedConfig = CMSConfigSchema.parse(config);

    try {
        const { error } = await supabaseServer
            .from('store_ui_settings')
            .upsert({
                id: 2, // save to draft
                config: parsedConfig,
                updated_at: new Date().toISOString()
            });

        if (error) throw new Error("Failed to submit publish request: " + error.message);

        await supabaseServer.from('page_audit_logs').insert({
            action: 'CMS Publish Requested',
            publish_notes: notes
        });

        return { success: true };
    } catch (error: any) {
        throw new Error("Approval request failed: " + error.message);
    }
}

export async function approveAndPublishCMSAction(config: any, notes: string) {
    // ONLY Managers can approve
    await verifyAdminAccess(['Manager'], 'Approve and Publish CMS');

    const parsedConfig = CMSConfigSchema.parse(config);

    // Pillar 5 & 7: Run Pre-Flight Checks
    runPreFlightChecks(parsedConfig);

    try {
        // Pillar 8: AI Diff Generation
        const { data: liveData } = await supabaseServer.from('store_ui_settings').select('config').eq('id', 1).single();
        const autoNotes = generateDiffNotes(liveData?.config, parsedConfig);
        
        // Publish to Live
        const { error: liveError } = await supabaseServer
            .from('store_ui_settings')
            .upsert({
                id: 1,
                config: parsedConfig,
                updated_at: new Date().toISOString()
            });
        if (liveError) throw liveError;

        // Sync to Draft
        const { error: draftError } = await supabaseServer
            .from('store_ui_settings')
            .upsert({
                id: 2,
                config: parsedConfig,
                updated_at: new Date().toISOString()
            });
        if (draftError) throw draftError;

        await supabaseServer.from('page_audit_logs').insert({
            action: 'CMS Publish Approved',
            publish_notes: notes
        });

        // Pillar 2 & 8: Create Immutable Publish Snapshot
        const finalNotes = notes ? `${notes} (AI Summary: ${autoNotes})` : `AI Summary: ${autoNotes}`;
        await supabaseServer.from('cms_publish_snapshots').insert({
            config: parsedConfig,
            publish_notes: finalNotes
        });

        revalidatePath('/', 'layout');

        return { success: true };
    } catch (error: any) {
        throw new Error("Approval and publish failed: " + error.message);
    }
}

export async function rejectPublishRequestCMSAction(config: any, feedback: string) {
    // ONLY Managers can reject
    await verifyAdminAccess(['Manager'], 'Reject CMS Publish');

    if (!feedback || feedback.trim() === '') {
        throw new Error("Rejection feedback is mandatory for audit clarity.");
    }

    const parsedConfig = CMSConfigSchema.parse(config);

    try {
        const { error } = await supabaseServer
            .from('store_ui_settings')
            .upsert({
                id: 2,
                config: parsedConfig,
                updated_at: new Date().toISOString()
            });

        if (error) throw new Error("Failed to reject request: " + error.message);

        await supabaseServer.from('page_audit_logs').insert({
            action: 'CMS Publish Rejected',
            publish_notes: feedback
        });

        return { success: true };
    } catch (error: any) {
        throw new Error("Rejection failed: " + error.message);
    }
}
