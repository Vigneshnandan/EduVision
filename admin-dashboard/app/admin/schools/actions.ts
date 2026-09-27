'use server'

import { registerSchoolRecord, updateSchoolRecord, updateSchoolStatusRecord, updateSchoolSubscriptionRecord, resetSchoolAdminPassword } from '@/lib/admin-schools'
import { logAdminAction } from '@/lib/admin-audit'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function createSchoolAction(formData: FormData) {
    const schoolName = formData.get('school_name') as string
    const schoolCode = formData.get('school_code') as string
    const address = formData.get('address') as string
    const contactEmail = formData.get('contact_email') as string
    const contactPhone = formData.get('contact_phone') as string
    const status = (formData.get('status') as any) || 'trial'
    const planTier = (formData.get('plan_tier') as any) || 'free'
    const planRenewsAt = (formData.get('plan_renews_at') as string) || undefined

    const adminName = formData.get('admin_name') as string
    const adminEmail = formData.get('admin_email') as string
    const adminPassword = formData.get('admin_password') as string

    if (!schoolName) throw new Error('School name is required')

    const newSchool = await registerSchoolRecord({
        school_name: schoolName,
        school_code: schoolCode,
        address,
        contact_email: contactEmail,
        contact_phone: contactPhone,
        status,
        plan_tier: planTier,
        plan_renews_at: planRenewsAt,
        admin_name: adminName,
        admin_email: adminEmail,
        admin_password: adminPassword
    })

    await logAdminAction({
        action: 'school_created',
        targetType: 'school',
        targetId: String(newSchool.school_id),
        details: {
            school_name: schoolName,
            school_code: newSchool.school_code,
            status,
            plan_tier: planTier,
            admin_email: adminEmail || null
        }
    })

    revalidatePath('/admin/schools')
    const redirectUrl = adminEmail && adminPassword 
        ? `/admin/schools/${newSchool.school_id}?created=1&admin_email=${encodeURIComponent(adminEmail)}&admin_pass=${encodeURIComponent(adminPassword)}`
        : `/admin/schools/${newSchool.school_id}?created=1`
    redirect(redirectUrl)
}

export async function resetSchoolAdminPasswordAction(schoolId: string, loginId: string, newPassword: string) {
    if (!newPassword || newPassword.length < 6) {
        throw new Error('Password must be at least 6 characters long.')
    }
    await resetSchoolAdminPassword(schoolId, loginId, newPassword)

    await logAdminAction({
        action: 'school_admin_password_reset',
        targetType: 'school',
        targetId: schoolId,
        details: { login_id: loginId }
    })

    revalidatePath(`/admin/schools/${schoolId}`)
}

export async function editSchoolAction(schoolId: string, formData: FormData) {
    const schoolName = formData.get('school_name') as string
    const schoolCode = formData.get('school_code') as string
    const address = formData.get('address') as string
    const contactEmail = formData.get('contact_email') as string
    const contactPhone = formData.get('contact_phone') as string
    const threshold = Number(formData.get('threshold')) || 75

    if (!schoolName || !schoolCode) throw new Error('School name and code are required')

    await updateSchoolRecord(schoolId, {
        school_name: schoolName,
        school_code: schoolCode,
        address,
        contact_email: contactEmail,
        contact_phone: contactPhone,
        at_risk_threshold_pct: threshold
    })

    await logAdminAction({
        action: 'school_updated',
        targetType: 'school',
        targetId: schoolId,
        details: {
            school_name: schoolName,
            school_code: schoolCode,
            at_risk_threshold_pct: threshold
        }
    })

    revalidatePath(`/admin/schools/${schoolId}`)
    revalidatePath('/admin/schools')
}

export async function changeSchoolStatusAction(schoolId: string, newStatus: 'trial' | 'active' | 'suspended') {
    await updateSchoolStatusRecord(schoolId, newStatus)

    await logAdminAction({
        action: 'school_status_changed',
        targetType: 'school',
        targetId: schoolId,
        details: { new_status: newStatus }
    })

    revalidatePath(`/admin/schools/${schoolId}`)
    revalidatePath('/admin/schools')
    revalidatePath('/admin')
    revalidatePath('/admin/drill-down')
}

export async function updateSchoolSubscriptionAction(
    schoolId: string,
    planTier: 'free' | 'paid',
    planRenewsAt: string | null
) {
    await updateSchoolSubscriptionRecord(schoolId, planTier, planRenewsAt)

    await logAdminAction({
        action: 'subscription_updated',
        targetType: 'school',
        targetId: schoolId,
        details: {
            plan_tier: planTier,
            plan_renews_at: planRenewsAt
        }
    })

    revalidatePath(`/admin/schools/${schoolId}`)
    revalidatePath('/admin/schools')
    revalidatePath('/admin')
    revalidatePath('/admin/drill-down')
}
