
import { getMonthlyAttendance } from '@/lib/reports'
import { MonthlyRegisterTable } from '@/components/MonthlyRegisterTable'
import { Button } from '@/components/ui/button'
import { ChevronLeft } from 'lucide-react'
import Link from 'next/link'
import { redirect } from 'next/navigation'

export const revalidate = 0;

interface ReportsPageProps {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export default async function ReportsPage(props: ReportsPageProps) {
    const searchParams = await props.searchParams;
    // Default to current month if not specified
    const now = new Date()
    const currentMonth = now.getMonth()
    const currentYear = now.getFullYear()

    // Parse params (safely)
    const monthParam = typeof searchParams.month === 'string' ? parseInt(searchParams.month) : currentMonth
    const yearParam = typeof searchParams.year === 'string' ? parseInt(searchParams.year) : currentYear

    const month = isNaN(monthParam) ? currentMonth : monthParam
    const year = isNaN(yearParam) ? currentYear : yearParam

    // Fetch Data
    const attendanceGrid = await getMonthlyAttendance(month, year)


    const daysInMonth = new Date(year, month + 1, 0).getDate()

    // Navigation Links
    const prevMonth = month === 0 ? 11 : month - 1
    const prevYear = month === 0 ? year - 1 : year
    const nextMonth = month === 11 ? 0 : month + 1
    const nextYear = month === 11 ? year + 1 : year

    const monthNames = ["January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
    ];

    // Generate Summary Stats
    const totalStudents = attendanceGrid.length
    const totalDays = attendanceGrid.length * daysInMonth
    let totalPresent = 0
    attendanceGrid.forEach(row => {
        Object.values(row.attendance).forEach(status => {
            if (status === 'P') totalPresent++
        })
    })
    const avgAttendance = totalDays > 0 ? Math.round((totalPresent / totalDays) * 100) : 0
    const workingDays = daysInMonth // Simplified, ideally check logs for active days

    return (
        <div className="p-8 space-y-8 bg-slate-50 min-h-screen font-sans">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-6">
                <div className="flex items-center gap-4">
                    <Link href="/">
                        <Button variant="outline" size="icon" className="h-10 w-10 border-slate-300">
                            <ChevronLeft className="h-5 w-5 text-slate-600" />
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 font-serif">Reports Center</h1>
                        <p className="text-sm text-slate-500 font-medium tracking-wide uppercase mt-1">
                            Official Academic Records • {monthNames[month]} {year}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2 bg-white p-1.5 rounded-lg border border-slate-200 shadow-sm">
                    <Link href={`/reports?month=${prevMonth}&year=${prevYear}`}>
                        <Button variant="ghost" size="sm" className="text-slate-600 hover:text-blue-600">Previous</Button>
                    </Link>
                    <div className="font-bold min-w-[160px] text-center text-slate-800 text-lg font-serif border-x border-slate-100 px-4">
                        {monthNames[month]} {year}
                    </div>
                    <Link href={`/reports?month=${nextMonth}&year=${nextYear}`}>
                        <Button variant="ghost" size="sm" className="text-slate-600 hover:text-blue-600">Next</Button>
                    </Link>
                </div>
            </div>

            {/* Quick Stats Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-sm font-medium text-slate-500 uppercase tracking-wider">Total Students</p>
                        <p className="text-3xl font-bold text-slate-900 mt-1">{totalStudents}</p>
                    </div>
                    <div className="h-12 w-12 bg-blue-50 rounded-full flex items-center justify-center text-blue-600 font-bold">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-users"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-sm font-medium text-slate-500 uppercase tracking-wider">Avg. Attendance</p>
                        <p className="text-3xl font-bold text-slate-900 mt-1">{avgAttendance}%</p>
                    </div>
                    <div className="h-12 w-12 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-600 font-bold">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-percent"><line x1="19" y1="5" x2="5" y2="19" /><circle cx="6.5" cy="6.5" r="2.5" /><circle cx="17.5" cy="17.5" r="2.5" /></svg>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-sm font-medium text-slate-500 uppercase tracking-wider">Working Days</p>
                        <p className="text-3xl font-bold text-slate-900 mt-1">{workingDays}</p>
                    </div>
                    <div className="h-12 w-12 bg-indigo-50 rounded-full flex items-center justify-center text-indigo-600 font-bold">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-calendar-days"><rect width="18" height="18" x="3" y="4" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /><path d="M8 14h.01" /><path d="M12 14h.01" /><path d="M16 14h.01" /><path d="M8 18h.01" /><path d="M12 18h.01" /><path d="M16 18h.01" /></svg>
                    </div>
                </div>
            </div>

            <MonthlyRegisterTable
                data={attendanceGrid}
                month={month}
                year={year}
                daysInMonth={daysInMonth}
            />
        </div>
    )
}
