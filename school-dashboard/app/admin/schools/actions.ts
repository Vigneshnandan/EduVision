'use server'

import { registerSchoolRecord, updateSchoolRecord, updateSchoolStatusRecord } from '@/lib/admin-schools'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function createSchoolAction(formData: FormData) {
    const schoolName = formData.get('school_name') as string
    const schoolCode = formData.get('school_code') as string
    const address = formData.get('address') as string
    const contactEmail = formData.get('contact_email') as string
    const contactPhone = formData.get('contact_phone') as string
    const status = (formData.get('status') as any) || 'trial'

    if (!schoolName) throw new Error('School name is required')

    const newSchool = await registerSchoolRecord({
        school_name: schoolName,
        school_code: schoolCode,
        address,
        contact_email: contactEmail,
        contact_phone: contactPhone,
        status
    })

    revalidatePath('/admin/schools')
    redirect(`/admin/schools/${newSchool.school_id}`)
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

    revalidatePath(`/admin/schools/${schoolId}`)
    revalidatePath('/admin/schools')
}

export async function changeSchoolStatusAction(schoolId: string, newStatus: 'trial' | 'active' | 'suspended') {
    await updateSchoolStatusRecord(schoolId, newStatus)
    revalidatePath(`/admin/schools/${schoolId}`)
    revalidatePath('/admin/schools')
}
