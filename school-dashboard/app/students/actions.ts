'use server'

import { getAllStudents, updateStudentDetails, getStudentAttendanceHistory } from '@/lib/students'
import { StudentProfile, StudentDayLog } from '@/lib/types'
import { revalidatePath } from 'next/cache'

export async function fetchStudents(): Promise<StudentProfile[]> {
    return await getAllStudents()
}

export async function saveStudentDetails(id: string, details: Partial<StudentProfile>) {
    await updateStudentDetails(id, details)
    revalidatePath('/students')
}

export async function fetchStudentHistory(studentId: string): Promise<StudentDayLog[]> {
    return await getStudentAttendanceHistory(studentId)
}
