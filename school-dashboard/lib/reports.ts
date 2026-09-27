import { createClient } from '@/lib/supabase-server'
import { getSessionSchoolId } from './students'
import { createAdminServiceClient, isServiceRoleConfigured } from '@/lib/supabase-service'
import { MonthlyTrend } from './types'

export interface AttendanceGridRow {
    studentId: string
    name: string
    className?: string
    attendance: Record<number, string>
    manualDays?: Record<number, boolean>
}

function getMonthRange(month: number, year: number) {
    const start = new Date(year, month, 1)
    const end = new Date(year, month + 1, 0)
    end.setHours(23, 59, 59, 999)
    return { startTs: start.getTime(), endTs: end.getTime(), daysInMonth: end.getDate() }
}

export async function getMonthlyAttendance(
    month: number, 
    year: number,
    selectedClass?: string
): Promise<{ rows: AttendanceGridRow[]; holidays: Record<number, string>; school: any }> {
    const supabase = await createClient()
    const schoolId = await getSessionSchoolId(supabase)
    if (!schoolId) return { rows: [], holidays: {}, school: null }

    let db = supabase;
    if (isServiceRoleConfigured()) {
        try {
            db = createAdminServiceClient();
        } catch {
            db = supabase;
        }
    }

    // Fetch school info for official register header
    const { data: school } = await db
        .from('schools')
        .select('*')
        .eq('school_id', schoolId)
        .maybeSingle()

    // Fetch holidays for the month
    const startMonthStr = `${year}-${String(month + 1).padStart(2, '0')}-01`
    const nextMonth = month === 11 ? 1 : month + 2
    const nextYear = month === 11 ? year + 1 : year
    const endMonthStr = `${nextYear}-${String(nextMonth).padStart(2, '0')}-01`

    const { data: holidayData } = await db
        .from('school_holidays')
        .select('holiday_date, label')
        .eq('school_id', schoolId)
        .gte('holiday_date', startMonthStr)
        .lt('holiday_date', endMonthStr)

    const holidays: Record<number, string> = {}
    holidayData?.forEach((h: any) => {
        const parts = h.holiday_date.split('-')
        const day = parseInt(parts[2], 10)
        holidays[day] = h.label
    })

    const { startTs, endTs, daysInMonth } = getMonthRange(month, year)

    // Mark Sundays as holidays by default if not already labeled
    for (let d = 1; d <= daysInMonth; d++) {
        const dt = new Date(year, month, d)
        if (dt.getDay() === 0 && !holidays[d]) {
            holidays[d] = 'Sunday'
        }
    }

    const rowMap: Record<string, AttendanceGridRow> = {}

    // Pre-populate enrolled students from student_details for this school
    const { data: studentsData } = await db
        .from('student_details')
        .select('student_id, student_name, class_name')
        .eq('school_id', schoolId)

    studentsData?.forEach((s: any) => {
        if (selectedClass && selectedClass !== 'All' && s.class_name !== selectedClass) return;
        const id = String(s.student_id);
        if (!rowMap[id]) {
            rowMap[id] = {
                studentId: id,
                name: s.student_name || 'Student',
                className: s.class_name || 'Unassigned',
                attendance: {},
                manualDays: {}
            };
        }
    });

    let query = db
        .from('attendance')
        .select('student_id, name, class_name, date, timestamp, is_present, is_manual')
        .eq('school_id', schoolId)
        .gte('timestamp', startTs)
        .lte('timestamp', endTs)

    if (selectedClass && selectedClass !== 'All') {
        query = query.eq('class_name', selectedClass)
    }

    const { data: logs, error } = await query

    if (error) {
        console.error('Error fetching monthly logs:', error)
    }

    const validLogs = (logs || []) as any[]

    validLogs.forEach(log => {
        const id = String(log.student_id)
        if (!rowMap[id]) {
            rowMap[id] = {
                studentId: id,
                name: log.name || 'Student',
                className: log.class_name || 'Unassigned',
                attendance: {},
                manualDays: {}
            }
        }

        const logTime = Number(log.date || log.timestamp)
        const dateObj = new Date(logTime)
        const day = dateObj.getDate()

        if (log.is_present) {
            rowMap[id].attendance[day] = 'P'
        } else {
            rowMap[id].attendance[day] = 'A'
        }
        if (log.is_manual) {
            rowMap[id].manualDays![day] = true
        }
    })

    // Populate holiday markers on empty days
    Object.values(rowMap).forEach(row => {
        Object.entries(holidays).forEach(([dayStr, label]) => {
            const day = Number(dayStr)
            if (!row.attendance[day]) {
                row.attendance[day] = 'H'
            }
        })
    })

    return { 
        rows: Object.values(rowMap).sort((a, b) => 
            (a.className || '').localeCompare(b.className || '') || 
            a.name.localeCompare(b.name)
        ),
        holidays,
        school
    }
}

export async function getMonthlyTrend(month: number, year: number): Promise<MonthlyTrend> {
    const supabase = await createClient()
    const schoolId = await getSessionSchoolId(supabase)
    if (!schoolId) {
        return { currentMonthOverallPct: 0, previousMonthOverallPct: 0, diffPct: 0, classComparisons: [] }
    }

    let db = supabase;
    if (isServiceRoleConfigured()) {
        try {
            db = createAdminServiceClient();
        } catch {
            db = supabase;
        }
    }

    // Current month range
    const currentRange = getMonthRange(month, year)

    // Previous month range
    const prevMonth = month === 0 ? 11 : month - 1
    const prevYear = month === 0 ? year - 1 : year
    const prevRange = getMonthRange(prevMonth, prevYear)

    // Fetch current month attendance
    const { data: currentLogs } = await db
        .from('attendance')
        .select('class_name, is_present')
        .eq('school_id', schoolId)
        .gte('timestamp', currentRange.startTs)
        .lte('timestamp', currentRange.endTs)

    // Fetch previous month attendance
    const { data: prevLogs } = await db
        .from('attendance')
        .select('class_name, is_present')
        .eq('school_id', schoolId)
        .gte('timestamp', prevRange.startTs)
        .lte('timestamp', prevRange.endTs)

    // Helper to calculate stats
    const calcStats = (logs: any[] | null) => {
        let total = 0
        let present = 0
        const classStats: Record<string, { total: number; present: number }> = {}

        logs?.forEach(log => {
            total++
            if (log.is_present) present++
            const cls = log.class_name || 'Unassigned'
            if (!classStats[cls]) classStats[cls] = { total: 0, present: 0 }
            classStats[cls].total++
            if (log.is_present) classStats[cls].present++
        })

        const overallPct = total > 0 ? (present / total) * 100 : 0
        return { total, present, overallPct, classStats }
    }

    const cur = calcStats(currentLogs)
    const prev = calcStats(prevLogs)

    const diffPct = Math.round((cur.overallPct - prev.overallPct) * 10) / 10

    // Compare per class
    const allClasses = new Set([...Object.keys(cur.classStats), ...Object.keys(prev.classStats)])
    const classComparisons = Array.from(allClasses).sort().map(className => {
        const curClass = cur.classStats[className] || { total: 0, present: 0 }
        const prevClass = prev.classStats[className] || { total: 0, present: 0 }

        const currentPct = curClass.total > 0 ? Math.round((curClass.present / curClass.total) * 100) : 0
        const previousPct = prevClass.total > 0 ? Math.round((prevClass.present / prevClass.total) * 100) : 0
        const classDiff = currentPct - previousPct

        return {
            className,
            currentPct,
            previousPct,
            diffPct: classDiff
        }
    })

    return {
        currentMonthOverallPct: Math.round(cur.overallPct * 10) / 10,
        previousMonthOverallPct: Math.round(prev.overallPct * 10) / 10,
        diffPct,
        classComparisons
    }
}
