'use server'

import { createClass, updateClass, deleteClass } from '@/lib/classes'
import { revalidatePath } from 'next/cache'

export async function addClassAction(formData: FormData) {
    const className = formData.get('className') as string
    const teacherId = formData.get('teacherId') as string
    if (!className) throw new Error('Class name is required')

    await createClass(className, teacherId || null)
    revalidatePath('/classes')
}

export async function updateClassAction(classId: string, className: string, teacherId?: string | null) {
    if (!classId || !className) throw new Error('Class ID and name are required')
    await updateClass(classId, className, teacherId || null)
    revalidatePath('/classes')
}

export async function deleteClassAction(classId: string) {
    if (!classId) throw new Error('Class ID is required')
    await deleteClass(classId)
    revalidatePath('/classes')
}
