import { getMonthlyAttendance, getMonthlyTrend } from '@/lib/reports'
import { MonthlyRegisterTable } from '@/components/MonthlyRegisterTable'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { ChevronLeft, TrendingUp, TrendingDown, Users, Percent, CalendarDays } from 'lucide-react'
import Link from 'next/link'

export const revalidate = 0;

interface ReportsPageProps {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export default async function ReportsPage(props: ReportsPageProps) {
    const searchParams = await props.searchParams;
    const now = new Date()
    const currentMonth = now.getMonth()
    const currentYear = now.getFullYear()

    const monthParam = typeof searchParams.month === 'string' ? parseInt(searchParams.month) : currentMonth
    const yearParam = typeof searchParams.year === 'string' ? parseInt(searchParams.year) : currentYear
    const selectedClass = typeof searchParams.class === 'string' ? searchParams.class : 'All'

    const month = isNaN(monthParam) ? currentMonth : monthParam
    const year = isNaN(yearParam) ? currentYear : yearParam

    // Fetch Data
    const [{ rows: attendanceGrid, holidays, school }, trendData] = await Promise.all([
        getMonthlyAttendance(month, year, selectedClass),
        getMonthlyTrend(month, year)
    ])

    const daysInMonth = new Date(year, month + 1, 0).getDate()

    // Navigation Links
    const prevMonth = month === 0 ? 11 : month - 1
    const prevYear = month === 0 ? year - 1 : year
    const nextMonth = month === 11 ? 0 : month + 1
    const nextYear = month === 11 ? year + 1 : year

    const monthNames = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
    ];

    // Stats
    const totalStudents = attendanceGrid.length
    const holidayCount = Object.keys(holidays).length
    const workingDays = Math.max(0, daysInMonth - holidayCount)

    return (
        <div className="p-8 space-y-8 bg-slate-50 min-h-screen font-sans">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-6 print:hidden">
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
                    <Link href={`/reports?month=${prevMonth}&year=${prevYear}&class=${selectedClass}`}>
                        <Button variant="ghost" size="sm" className="text-slate-600 hover:text-blue-600">Previous</Button>
                    </Link>
                    <div className="font-bold min-w-[160px] text-center text-slate-800 text-lg font-serif border-x border-slate-100 px-4">
                        {monthNames[month]} {year}
                    </div>
                    <Link href={`/reports?month=${nextMonth}&year=${nextYear}&class=${selectedClass}`}>
                        <Button variant="ghost" size="sm" className="text-slate-600 hover:text-blue-600">Next</Button>
                    </Link>
                </div>
            </div>

            {/* Quick Stats & Month-over-Month Trend Row */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 print:hidden">
                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Students</p>
                        <p className="text-2xl font-bold text-slate-900 mt-1">{totalStudents}</p>
                    </div>
                    <div className="h-10 w-10 bg-blue-50 rounded-full flex items-center justify-center text-blue-600">
                        <Users className="h-5 w-5" />
                    </div>
                </div>

                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">This Month Avg</p>
                        <div className="flex items-baseline gap-2 mt-1">
                            <p className="text-2xl font-bold text-slate-900">{trendData.currentMonthOverallPct}%</p>
                            {trendData.diffPct >= 0 ? (
                                <span className="inline-flex items-center text-xs font-semibold text-emerald-600">
                                    <TrendingUp className="h-3 w-3 mr-0.5" /> +{trendData.diffPct}%
                                </span>
                            ) : (
                                <span className="inline-flex items-center text-xs font-semibold text-red-600">
                                    <TrendingDown className="h-3 w-3 mr-0.5" /> {trendData.diffPct}%
                                </span>
                            )}
                        </div>
                    </div>
                    <div className="h-10 w-10 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-600">
                        <Percent className="h-5 w-5" />
                    </div>
                </div>

                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Last Month Avg</p>
                        <p className="text-2xl font-bold text-slate-900 mt-1">{trendData.previousMonthOverallPct}%</p>
                    </div>
                    <div className="h-10 w-10 bg-slate-50 rounded-full flex items-center justify-center text-slate-600">
                        <Percent className="h-5 w-5" />
                    </div>
                </div>

                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Working Days</p>
                        <p className="text-2xl font-bold text-slate-900 mt-1">{workingDays} <span className="text-xs text-slate-400 font-normal">({holidayCount} off)</span></p>
                    </div>
                    <div className="h-10 w-10 bg-indigo-50 rounded-full flex items-center justify-center text-indigo-600">
                        <CalendarDays className="h-5 w-5" />
                    </div>
                </div>
            </div>

            {/* Per-Class Monthly Comparison Card */}
            {trendData.classComparisons.length > 0 && (
                <Card className="shadow-sm border-slate-200 print:hidden">
                    <CardHeader className="py-4 border-b bg-slate-50/50">
                        <CardTitle className="text-base font-bold text-slate-800">
                            Class-by-Class Month-over-Month Comparison
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-4">
                        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                            {trendData.classComparisons.map((c) => (
                                <div key={c.className} className="p-3 rounded-lg border border-slate-200 bg-white">
                                    <p className="font-semibold text-slate-800 text-sm truncate">{c.className}</p>
                                    <div className="flex items-baseline justify-between mt-2">
                                        <span className="text-lg font-bold text-slate-900">{c.currentPct}%</span>
                                        {c.diffPct >= 0 ? (
                                            <span className="text-xs font-medium text-emerald-600 flex items-center">
                                                +{c.diffPct}%
                                            </span>
                                        ) : (
                                            <span className="text-xs font-medium text-red-600 flex items-center">
                                                {c.diffPct}%
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-[10px] text-slate-400 mt-1">Prev: {c.previousPct}%</p>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Official Monthly Register Table & Print Support */}
            <MonthlyRegisterTable
                data={attendanceGrid}
                month={month}
                year={year}
                daysInMonth={daysInMonth}
                school={school}
                monthName={monthNames[month]}
            />
        </div>
    )
}
