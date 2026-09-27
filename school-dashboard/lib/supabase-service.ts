import { createClient } from '@supabase/supabase-js'

/**
 * School Dashboard Service-Role Client
 * Used by server actions when SUPABASE_SERVICE_ROLE_KEY is present
 * for elevated administrative operations.
 */
export function createAdminServiceClient() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl) {
        throw new Error("[AdminServiceClient] NEXT_PUBLIC_SUPABASE_URL environment variable is missing.")
    }

    if (!serviceKey) {
        const errorMsg =
            "SUPABASE_SERVICE_ROLE_KEY is missing in environment variables. " +
            "Please configure SUPABASE_SERVICE_ROLE_KEY in your Vercel Project Settings > Environment Variables."
        console.warn(errorMsg)
        throw new Error(errorMsg)
    }

    return createClient(supabaseUrl, serviceKey, {
        auth: {
            persistSession: false,
            autoRefreshToken: false,
        }
    })
}

/**
 * Standalone Anon Auth Client
 * Used as fallback to register auth accounts (signUp) directly against Supabase Auth
 * using NEXT_PUBLIC_SUPABASE_ANON_KEY without modifying server session cookies.
 */
export function createAnonAuthClient() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl || !anonKey) {
        throw new Error("Supabase URL or Anon key is missing in environment.")
    }

    return createClient(supabaseUrl, anonKey, {
        auth: {
            persistSession: false,
            autoRefreshToken: false,
        }
    })
}

export function isServiceRoleConfigured(): boolean {
    return Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY && process.env.SUPABASE_SERVICE_ROLE_KEY.trim())
}
