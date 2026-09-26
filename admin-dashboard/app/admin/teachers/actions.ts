'use server'

import { togglePlatformTeacherStatus } from '@/lib/admin-teachers'
import { logAdminAction } from '@/lib/admin-audit'
import { revalidatePath } from 'next/cache'

export async function togglePlatformTeacherAction(teacherId: string, currentStatus: boolean) {
    await togglePlatformTeacherStatus(teacherId, currentStatus)

    await logAdminAction({
        action: currentStatus ? 'teacher_deactivated' : 'teacher_activated',
        targetType: 'teacher',
        targetId: teacherId,
        details: {
            previous_status: currentStatus,
            new_status: !currentStatus
        }
    })

    revalidatePath('/admin/teachers')
    revalidatePath('/admin')
}
