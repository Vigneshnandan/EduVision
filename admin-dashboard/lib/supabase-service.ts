import { createClient } from '@supabase/supabase-js'

/**
 * Platform Admin Service-Role Client
 * Bypasses RLS to query across all tenant schools, aggregate platform-wide stats,
 * and manage access without requiring teacher session credentials.
 * 
 * FAILS LOUDLY if SUPABASE_SERVICE_ROLE_KEY is unset to prevent silent downgrade
 * to the anon key and silent failure of audit logging.
 */
export function createAdminServiceClient() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl) {
        throw new Error("[AdminServiceClient] NEXT_PUBLIC_SUPABASE_URL environment variable is missing.")
    }

    if (!serviceKey) {
        const errorMsg =
            "[AdminServiceClient] CRITICAL CONFIGURATION ERROR: SUPABASE_SERVICE_ROLE_KEY is missing. " +
            "Platform admin operations and audit logging require the service-role key and will not silently downgrade to the anon key. " +
            "Please configure SUPABASE_SERVICE_ROLE_KEY in your environment (.env.local)."
        console.error(errorMsg)
        throw new Error(errorMsg)
    }

    return createClient(supabaseUrl, serviceKey, {
        auth: {
            persistSession: false,
            autoRefreshToken: false,
        }
    })
}

export function isServiceRoleConfigured(): boolean {
    return Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY)
}
