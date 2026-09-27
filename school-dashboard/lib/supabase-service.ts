import { createClient } from '@supabase/supabase-js'

/**
 * School Dashboard Service-Role Client
 * Used exclusively by server actions for administrative operations, such as
 * creating auth user accounts and resetting passwords for teachers.
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
            "Provisioning user credentials requires the service-role key. " +
            "Please configure SUPABASE_SERVICE_ROLE_KEY in school-dashboard/.env.local."
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
