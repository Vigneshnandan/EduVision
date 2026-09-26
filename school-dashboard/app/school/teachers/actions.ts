'use server'

import { toggleTeacherStatus, updateTeacherRole, createTeacherRecord } from '@/lib/teachers'
import { revalidatePath } from 'next/cache'

export async function toggleStatusAction(teacherId: string, currentStatus: boolean) {
    await toggleTeacherStatus(teacherId, currentStatus)
    revalidatePath('/school/teachers')
    revalidatePath('/classes')
}

export async function changeRoleAction(teacherId: string, newRole: 'teacher' | 'school_admin') {
    await updateTeacherRole(teacherId, newRole)
    revalidatePath('/school/teachers')
}

export async function addTeacherAction(formData: FormData) {
    const name = formData.get('name') as string
    const loginId = formData.get('loginId') as string
    const role = (formData.get('role') as 'teacher' | 'school_admin') || 'teacher'

    if (!name || !loginId) {
        throw new Error('Name and Login ID are required')
    }

    await createTeacherRecord(name, loginId, role)
    revalidatePath('/school/teachers')
    revalidatePath('/classes')
}
