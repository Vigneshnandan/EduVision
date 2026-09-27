'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase-server'
import { createAdminClient } from '@/lib/supabase-admin'

export async function login(formData: FormData) {
  const supabase = await createClient()
  const supabaseAdmin = createAdminClient()

  const email = (formData.get('email') as string || '').trim()
  const password = formData.get('password') as string

  if (!email || !password) {
    redirect('/login?error=Email and password are required')
  }

  const { data: authData, error } = await supabase.auth.signInWithPassword({
    email,
    password
  })

  if (error || !authData.user) {
    redirect(`/login?error=${encodeURIComponent(error?.message || 'Could not authenticate user')}`)
  }

  // 1. Check database platform_admins table
  let isPlatformAdmin = false
  try {
    const { data: adminData } = await supabaseAdmin
      .from('platform_admins')
      .select('admin_id')
      .eq('auth_user_id', authData.user.id)
      .maybeSingle()

    if (adminData) {
      isPlatformAdmin = true
    }
  } catch (err) {
    console.warn("Could not query platform_admins:", err)
  }

  if (!isPlatformAdmin) {
    // Not authorized as platform admin
    await supabase.auth.signOut()
    redirect('/login?error=Not authorized as platform admin')
  }

  revalidatePath('/', 'layout')
  redirect('/admin')
}
