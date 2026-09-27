'use server'

import { toggleTeacherStatus, updateTeacherRole, createTeacherRecord, setTeacherPassword, deleteTeacherRecord, checkIsSchoolAdmin } from '@/lib/teachers'
import { revalidatePath } from 'next/cache'

export async function toggleStatusAction(teacherId: string, currentStatus: boolean) {
    try {
        const isAdmin = await checkIsSchoolAdmin()
        if (!isAdmin) {
            return { error: 'Unauthorized: Only a school administrator can manage teacher accounts.' }
        }
        await toggleTeacherStatus(teacherId, currentStatus)
        revalidatePath('/school/teachers')
        revalidatePath('/classes')
        return { success: true }
    } catch (err: any) {
        return { error: err.message || 'Failed to update status' }
    }
}

export async function changeRoleAction(teacherId: string, newRole: 'teacher' | 'school_admin') {
    try {
        const isAdmin = await checkIsSchoolAdmin()
        if (!isAdmin) {
            return { error: 'Unauthorized: Only a school administrator can modify roles.' }
        }
        await updateTeacherRole(teacherId, newRole)
        revalidatePath('/school/teachers')
        return { success: true }
    } catch (err: any) {
        return { error: err.message || 'Failed to change role' }
    }
}

export async function addTeacherAction(formData: FormData) {
    try {
        const isAdmin = await checkIsSchoolAdmin()
        if (!isAdmin) {
            return { error: 'Unauthorized: Only a school administrator can add teachers.' }
        }

        const name = formData.get('name') as string
        const loginId = formData.get('loginId') as string
        const password = (formData.get('password') as string) || undefined
        const role = (formData.get('role') as 'teacher' | 'school_admin') || 'teacher'

        if (!name || !loginId) {
            return { error: 'Name and Login ID are required' }
        }

        if (password && password.length < 6) {
            return { error: 'Password must be at least 6 characters.' }
        }

        const result = await createTeacherRecord(name, loginId, password, role)
        revalidatePath('/school/teachers')
        revalidatePath('/classes')
        return { success: true, teacher: result }
    } catch (err: any) {
        console.error("Error in addTeacherAction:", err)
        return { error: err.message || 'Failed to add teacher' }
    }
}

export async function setTeacherPasswordAction(teacherId: string, teacherLoginId: string, newPassword: string) {
    try {
        const isAdmin = await checkIsSchoolAdmin()
        if (!isAdmin) {
            return { error: 'Unauthorized: Only a school administrator can modify faculty passwords.' }
        }
        if (!newPassword || newPassword.length < 6) {
            return { error: 'Password must be at least 6 characters.' }
        }

        await setTeacherPassword(teacherId, teacherLoginId, newPassword)
        revalidatePath('/school/teachers')
        return { success: true }
    } catch (err: any) {
        console.error("Error in setTeacherPasswordAction:", err)
        return { error: err.message || 'Failed to set password' }
    }
}

export async function deleteTeacherAction(teacherId: string) {
    try {
        const isAdmin = await checkIsSchoolAdmin()
        if (!isAdmin) {
            return { error: 'Unauthorized: Only a school administrator can remove faculty records.' }
        }
        await deleteTeacherRecord(teacherId)
        revalidatePath('/school/teachers')
        revalidatePath('/classes')
        return { success: true }
    } catch (err: any) {
        return { error: err.message || 'Failed to remove faculty record' }
    }
}
