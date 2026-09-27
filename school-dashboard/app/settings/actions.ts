'use server'

import { createClient } from '@/lib/supabase-server'
import { getSessionSchoolId } from '@/lib/students'
import { revalidatePath } from 'next/cache'

export async function updateSchoolSettings(formData: FormData) {
    const supabase = await createClient()
    const schoolId = await getSessionSchoolId(supabase)
    if (!schoolId) throw new Error('Not authenticated')

    const name = formData.get('name') as string
    const code = formData.get('code') as string
    const address = formData.get('address') as string
    const threshold = Number(formData.get('threshold'))

    const { error } = await supabase
        .from('schools')
        .update({
            school_name: name,
            school_code: code,
            address,
            at_risk_threshold_pct: threshold
        })
        .eq('school_id', schoolId)

    if (error) {
        console.error("Failed to update school settings:", error)
        throw error
    }

    revalidatePath('/settings')
    return { success: true }
}

export async function forceSync() {
    // In a real application, this would trigger a background sync job.
    // For now, we simulate success.
    await new Promise(resolve => setTimeout(resolve, 1000));
    revalidatePath('/settings')
    return { success: true }
}
