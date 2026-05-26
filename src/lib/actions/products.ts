"use server";

import { revalidatePath } from 'next/cache';
import { supabaseServer } from '../supabase-server';
import { ProductInsertSchema, ProductUpdateSchema, ProductStockUpdateSchema, DeleteItemsSchema } from '../validations';
import { logAuditAction } from '../audit';
import { verifyAdminAccess } from './auth';
import { PERMISSIONS } from '../auth';
import { captureOperationalError } from '../monitor';
import { z } from 'zod';

export async function upsertProductAction(data: z.infer<typeof ProductInsertSchema> & { id?: string }) {
    try {
        await verifyAdminAccess(PERMISSIONS.CAN_EDIT_PRICE, 'upsertProduct');
        if (data.id) {
            // Update
            const parsed = ProductUpdateSchema.safeParse(data);
            if (!parsed.success) return { success: false, error: parsed.error.issues[0].message };
            
            const { data: oldData } = await supabaseServer.from('products').select('*').eq('id', data.id).single();

            const { error } = await supabaseServer.from('products').update(parsed.data).eq('id', data.id);
            if (error) throw error;

            await logAuditAction({
                tableName: 'products',
                recordId: data.id,
                action: 'UPDATE',
                oldData,
                newData: parsed.data
            });
        } else {
            // Insert
            const parsed = ProductInsertSchema.safeParse(data);
            if (!parsed.success) return { success: false, error: parsed.error.issues[0].message };

            const { data: insertedData, error } = await supabaseServer.from('products').insert([parsed.data]).select('id').single();
            if (error) throw error;

            await logAuditAction({
                tableName: 'products',
                recordId: insertedData.id,
                action: 'INSERT',
                newData: parsed.data
            });
        }

        revalidatePath('/admin/products');
        return { success: true };
    } catch (err: any) {
        const safeMessage = captureOperationalError(err, {
            classification: 'INFRASTRUCTURE_FAILURE',
            actionName: 'upsertProductAction',
            metadata: { data }
        });
        return { success: false, error: safeMessage };
    }
}

export async function updateStockAction(id: string, stock_quantity: number) {
    const parsed = ProductStockUpdateSchema.safeParse({ id, stock_quantity });
    if (!parsed.success) return { success: false, error: parsed.error.issues[0].message };

    try {
        await verifyAdminAccess(PERMISSIONS.CAN_EDIT_INVENTORY, 'updateProductStock');
        const { data: oldData } = await supabaseServer.from('products').select('stock_quantity').eq('id', id).single();
        const { error } = await supabaseServer.from('products').update({ stock_quantity }).eq('id', id);
        if (error) throw error;

        await logAuditAction({
            tableName: 'products',
            recordId: id,
            action: 'UPDATE',
            oldData,
            newData: { stock_quantity }
        });

        revalidatePath('/admin/products');
        return { success: true };
    } catch (err: any) {
        const safeMessage = captureOperationalError(err, {
            classification: 'INFRASTRUCTURE_FAILURE',
            actionName: 'updateStockAction',
            recordId: id,
            metadata: { stock_quantity }
        });
        return { success: false, error: safeMessage };
    }
}

export async function processProductChunkAction(chunk: any[], chunkIndex: number) {
    try {
        await verifyAdminAccess(PERMISSIONS.CAN_BULK_IMPORT, 'bulkImportProducts');
        const validProducts = [];
        const failedRows = [];
        let skippedDuplicates = 0;

        for (const row of chunk) {
            const parsed = ProductInsertSchema.safeParse(row);
            if (!parsed.success) {
                failedRows.push({ sku: row.sku || 'UNKNOWN', error: parsed.error.issues[0].message });
                continue;
            }
            validProducts.push(parsed.data);
        }

        if (validProducts.length > 0) {
            const skus = validProducts.map(p => p.sku);
            const { data: existing } = await supabaseServer.from('products').select('sku').in('sku', skus);
            const existingSkus = new Set((existing || []).map(p => p.sku));

            const toInsert = validProducts.filter(p => !existingSkus.has(p.sku));
            skippedDuplicates = validProducts.length - toInsert.length;

            if (toInsert.length > 0) {
                const { error } = await supabaseServer.from('products').insert(toInsert);
                if (error) throw error;
            }
        }

        const successCount = validProducts.length - skippedDuplicates;

        await logAuditAction({
            tableName: 'products',
            recordId: `bulk-chunk-${chunkIndex}`,
            action: 'INSERT',
            newData: { 
                chunkSize: chunk.length,
                successCount,
                failedCount: failedRows.length,
                skippedDuplicates,
                note: 'Bulk CSV Chunk Import'
            }
        });

        return { 
            success: true, 
            successCount, 
            failedRows,
            skippedDuplicates
        };
    } catch (err: any) {
        const safeMessage = captureOperationalError(err, {
            classification: 'INFRASTRUCTURE_FAILURE',
            actionName: 'processProductChunkAction',
            metadata: { chunkIndex, chunkLength: chunk?.length }
        });
        return { success: false, error: safeMessage };
    }
}
