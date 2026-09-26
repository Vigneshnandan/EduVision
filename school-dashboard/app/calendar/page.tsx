import { getSchoolHolidays } from '@/lib/calendar'
import { CalendarClient } from './CalendarClient'

export default async function CalendarPage() {
    const holidays = await getSchoolHolidays()

    return (
        <div className="p-8 space-y-8 bg-slate-50 min-h-screen">
            <div>
                <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Academic Calendar & Holidays</h1>
                <p className="text-slate-500 mt-1">Manage school terms, holidays, and official non-instructional dates.</p>
            </div>

            <CalendarClient initialHolidays={holidays} />
        </div>
    )
}
