import { z } from 'zod';

const envSchema = z.object({
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
    
    // Supabase Core
    NEXT_PUBLIC_SUPABASE_URL: z.string().url("Must be a valid Supabase URL"),
    NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1, "Missing Supabase Anon Key"),
    
    // Server-Side Only Secrets
    SUPABASE_SERVICE_ROLE_KEY: z.string().min(1, "Missing Supabase Service Role Key"),
    
    // Optional Webhooks & Integrations
    CRON_SECRET: z.string().optional(),
    WHATSAPP_VERIFY_TOKEN: z.string().optional(),
    WHATSAPP_ACCESS_TOKEN: z.string().optional(),
    WHATSAPP_PHONE_NUMBER_ID: z.string().optional(),
    LOGISTICS_WEBHOOK_SECRET: z.string().optional(),
    ADMIN_GATEKEY: z.string().optional(),
    OPENAI_API_KEY: z.string().optional(),
});

// For strict production validation
const prodEnvSchema = envSchema.extend({
    SUPABASE_SERVICE_ROLE_KEY: z.string().min(10, "Service Role Key must be valid"),
    ADMIN_GATEKEY: z.string().min(8, "Admin Gatekey must be robust in production"),
    CRON_SECRET: z.string().optional(),
    // In a fully ready production app, we might strictly require WHATSAPP and LOGISTICS secrets too.
});

function validateEnv() {
    const isProd = process.env.NODE_ENV === 'production';
    const schema = isProd ? prodEnvSchema : envSchema;

    const parsed = schema.safeParse(process.env);

    if (!parsed.success) {
        console.error("❌ Invalid environment variables:", parsed.error.format());
        throw new Error("Invalid environment variables. Application cannot boot.");
    }

    // Explicit check to ensure Service Role Key is NEVER exposed to the frontend prefix.
    // If someone accidentally does NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY in .env, fail loudly.
    if (process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY) {
        console.error("🚨 CRITICAL SECURITY ERROR 🚨");
        console.error("You have exposed the Service Role Key to the frontend bundle via NEXT_PUBLIC_ prefix.");
        throw new Error("Security Violation: Service Role Key exposed to frontend.");
    }

    return parsed.data;
}

export const env = validateEnv();
