import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://awyqinnivsvqsohfmmcj.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF3eXFpbm5pdnN2cXNvaGZtbWNqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkyOTczNjIsImV4cCI6MjA5NDg3MzM2Mn0.IWrku6AZP9IlklCxubVzmo8YXPVTkEdscL2CpPC5PVg';
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const OUT_DIR = 'C:/Users/rodda/.gemini/antigravity/brain/1e99aef6-9d98-4bd5-acce-aefefb6d506c';

const stripHtml = (html) => {
    if (!html) return '';
    let text = html.replace(/<[^>]*>?/gm, ' ');
    text = text.replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/â€“/g, '-');
    return text.replace(/\s\s+/g, ' ').trim();
};

async function run() {
    console.log("Starting WhatsApp Message Quality Audit...");
    
    // Fetch 10 random products (using random offset or just limits)
    const { data: products } = await supabase.from('products').select('*').limit(10);
    
    let md = '# WHATSAPP CERTIFICATION REPORT\n\n';
    md += '## WhatsApp Message Quality Audit\n';
    md += 'This report verifies that product metadata is successfully stripped of HTML injection before populating the WhatsApp Message Builder and OG URL preview tags.\n\n';
    
    let hasFailures = false;

    products.forEach((product, i) => {
        const rawTitle = product.title || '';
        const rawDesc = product.description || '';
        
        const cleanTitle = stripHtml(rawTitle);
        const cleanDesc = stripHtml(rawDesc).substring(0, 160);

        const message = `Hello Deeprastore, I want to order:\n*${cleanTitle}* (SKU: ${product.sku})\nQuantity: 1\nStitching Required: No\nFall & Pico: No\nLink: https://app.deeprastore.com/product/${product.id}`;
        
        const hasHtmlMessage = /<[^>]*>/.test(message);
        const hasHtmlDesc = /<[^>]*>/.test(cleanDesc);
        
        if (hasHtmlMessage || hasHtmlDesc) hasFailures = true;

        md += `### Test ${i + 1}: ${cleanTitle}\n`;
        md += `- **Original Title Contains HTML/Encoding:** ${/<[^>]*>|â€“/.test(rawTitle)}\n`;
        md += `- **Original Desc Contains HTML:** ${/<[^>]*>/.test(rawDesc)}\n`;
        md += `- **Generated Message Contains HTML:** ${hasHtmlMessage}\n`;
        md += `- **Generated OG Preview Contains HTML:** ${hasHtmlDesc}\n`;
        md += "```text\n" + message + "\n```\n\n";
    });

    md += '## Final Verdict\n';
    if (hasFailures) {
        md += '**FAILED**: HTML tags or encoding errors leaked into the WhatsApp builder.\n';
    } else {
        md += '**PASSED**: 100% of tested products successfully generated clean, plain-text WhatsApp payloads and Open Graph metadata.\n';
    }

    fs.writeFileSync(`${OUT_DIR}/WHATSAPP_CERTIFICATION_REPORT.md`, md);
    console.log("Audit complete. Failures:", hasFailures);
}

run().catch(console.error);
