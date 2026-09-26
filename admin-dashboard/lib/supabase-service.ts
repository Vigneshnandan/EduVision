import { createClient } from '@supabase/supabase-js'

/**
 * Platform Admin Service-Role Client
 * Bypasses RLS to query across all tenant schools, aggregate platform-wide stats,
 * and manage access without requiring teacher session credentials.
 */
export function createAdminServiceClient() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

    return createClient(supabaseUrl, serviceKey, {
        auth: {
            persistSession: false,
            autoRefreshToken: false,
        }
    })
}
