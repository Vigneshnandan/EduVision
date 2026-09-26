'use server'

import { addSchoolHoliday, deleteSchoolHoliday } from '@/lib/calendar'
import { revalidatePath } from 'next/cache'

export async function addHolidayAction(formData: FormData) {
    const dateStr = formData.get('holidayDate') as string
    const label = formData.get('label') as string

    if (!dateStr || !label) {
        throw new Error('Date and Label are required')
    }

    await addSchoolHoliday(dateStr, label)
    revalidatePath('/calendar')
    revalidatePath('/reports')
}

export async function deleteHolidayAction(holidayId: string) {
    if (!holidayId) throw new Error('Holiday ID is required')
    await deleteSchoolHoliday(holidayId)
    revalidatePath('/calendar')
    revalidatePath('/reports')
}
