import { createAdminServiceClient } from "@/lib/supabase-service"
import { ClassAnalytics } from "@/lib/analytics"
import { AttendanceGridRow } from "@/lib/reports"

export interface SchoolDrilldownSummary {
    school: {
        school_id: string;
        school_name: string;
        school_code: string;
        status: string;
        plan_tier?: string;
        plan_renews_at?: string | null;
        contact_email?: string | null;
        contact_phone?: string | null;
        onboarded_at?: string | null;
    } | null;
    classes: string[];
    classAnalytics: ClassAnalytics[];
    monthlyRegister: AttendanceGridRow[];
    holidays: Record<number, string>;
    totalStudents: number;
    attendanceRate: number;
    daysInMonth: number;
}

function getMonthRange(month: number, year: number) {
    const start = new Date(year, month, 1)
    const end = new Date(year, month + 1, 0)
    end.setHours(23, 59, 59, 999)
    return { startTs: start.getTime(), endTs: end.getTime(), daysInMonth: end.getDate() }
}

export async function getAllSchoolsForDrilldown(): Promise<
    Array<{ school_id: string; school_name: string; school_code: string; status: string; plan_tier?: string }>
> {
    const supabase = createAdminServiceClient()
    const { data: schools, error } = await supabase
        .from('schools')
        .select('school_id, school_name, school_code, status, plan_tier')
        .order('school_name', { ascending: true })

    if (error || !schools) return []

    return schools.map((s: any) => ({
        school_id: String(s.school_id),
        school_name: s.school_name,
        school_code: s.school_code,
        status: s.status || 'trial',
        plan_tier: s.plan_tier || 'free'
    }))
}

export async function getSchoolDrilldownDetails(
    schoolId: string,
    month: number,
    year: number,
    selectedClass: string = "All"
): Promise<SchoolDrilldownSummary> {
    const supabase = createAdminServiceClient()

    // 1. Fetch School Entity
    const { data: schoolData } = await supabase
        .from('schools')
        .select('*')
        .eq('school_id', schoolId)
        .maybeSingle()

    const school = schoolData
        ? {
              school_id: String(schoolData.school_id),
              school_name: schoolData.school_name,
              school_code: schoolData.school_code,
              status: schoolData.status || 'trial',
              plan_tier: schoolData.plan_tier || 'free',
              plan_renews_at: schoolData.plan_renews_at || null,
              contact_email: schoolData.contact_email,
              contact_phone: schoolData.contact_phone,
              onboarded_at: schoolData.onboarded_at
          }
        : null

    // 2. Fetch distinct classes for this school
    const { data: classesRows } = await supabase
        .from('classes')
        .select('class_name')
        .eq('school_id', schoolId)

    const classSet = new Set<string>()
    classesRows?.forEach((c: any) => {
        if (c.class_name) classSet.add(c.class_name)
    })

    // Also pull any classes seen in attendance
    const { data: attendanceClasses } = await supabase
        .from('attendance')
        .select('class_name')
        .eq('school_id', schoolId)
        .limit(1000)

    attendanceClasses?.forEach((a: any) => {
        if (a.class_name) classSet.add(a.class_name)
    })

    const classes = Array.from(classSet).sort()

    // 3. Compute Class-wise breakdown for this school (last 30 days)
    const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000)
    const { data: recentLogs } = await supabase
        .from('attendance')
        .select('student_id, class_name, is_present, is_manual, date')
        .eq('school_id', schoolId)
        .gte('date', thirtyDaysAgo)

    const classStatsMap: Record<
        string,
        { studentIds: Set<string>; presentCount: number; totalCount: number; manualCount: number }
    > = {}

    const schoolStudentSet = new Set<string>()
    let schoolPresentTotal = 0
    let schoolTotalRecords = 0

    recentLogs?.forEach((log: any) => {
        const cName = log.class_name || 'General'
        schoolStudentSet.add(String(log.student_id))
        schoolTotalRecords++
        if (log.is_present) schoolPresentTotal++

        if (!classStatsMap[cName]) {
            classStatsMap[cName] = {
                studentIds: new Set(),
                presentCount: 0,
                totalCount: 0,
                manualCount: 0
            }
        }

        classStatsMap[cName].studentIds.add(String(log.student_id))
        classStatsMap[cName].totalCount++
        if (log.is_present) classStatsMap[cName].presentCount++
        if (log.is_manual) classStatsMap[cName].manualCount++
    })

    const classAnalytics: ClassAnalytics[] = Object.entries(classStatsMap).map(([className, st]) => {
        const pct = st.totalCount > 0 ? Math.round((st.presentCount / st.totalCount) * 100) : 0
        return {
            className,
            presentCount: st.presentCount,
            totalCount: st.totalCount,
            percentage: pct,
            manualCount: st.manualCount
        }
    }).sort((a, b) => b.totalCount - a.totalCount)

    const attendanceRate = schoolTotalRecords > 0
        ? Math.round((schoolPresentTotal / schoolTotalRecords) * 100)
        : 0

    // 4. Fetch Monthly Register Data for Form 9A
    const { startTs, endTs, daysInMonth } = getMonthRange(month, year)

    // Holidays
    const startMonthStr = `${year}-${String(month + 1).padStart(2, '0')}-01`
    const nextMonth = month === 11 ? 1 : month + 2
    const nextYear = month === 11 ? year + 1 : year
    const endMonthStr = `${nextYear}-${String(nextMonth).padStart(2, '0')}-01`

    const { data: holidayData } = await supabase
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

    // Mark Sundays by default
    for (let d = 1; d <= daysInMonth; d++) {
        const dt = new Date(year, month, d)
        if (dt.getDay() === 0 && !holidays[d]) {
            holidays[d] = 'Sunday'
        }
    }

    let registerQuery = supabase
        .from('attendance')
        .select('student_id, name, class_name, date, is_present, is_manual')
        .eq('school_id', schoolId)
        .gte('date', startTs)
        .lte('date', endTs)

    if (selectedClass && selectedClass !== 'All') {
        registerQuery = registerQuery.eq('class_name', selectedClass)
    }

    const { data: monthlyLogs } = await registerQuery

    const rowMap: Record<string, AttendanceGridRow> = {}
    monthlyLogs?.forEach((log: any) => {
        const id = String(log.student_id)
        if (!rowMap[id]) {
            rowMap[id] = {
                studentId: id,
                name: log.name || `Student ${id.slice(0, 6)}`,
                className: log.class_name || 'Unassigned',
                attendance: {},
                manualDays: {}
            }
        }

        const dateObj = new Date(log.date)
        const day = dateObj.getDate()

        rowMap[id].attendance[day] = log.is_present ? 'P' : 'A'
        if (log.is_manual) {
            rowMap[id].manualDays![day] = true
        }
    })

    // Assign holiday symbols to missing days
    Object.values(rowMap).forEach(row => {
        Object.entries(holidays).forEach(([dayStr, label]) => {
            const day = Number(dayStr)
            if (!row.attendance[day]) {
                row.attendance[day] = 'H'
            }
        })
    })

    const monthlyRegister = Object.values(rowMap).sort(
        (a, b) => (a.className || '').localeCompare(b.className || '') || a.name.localeCompare(b.name)
    )

    return {
        school,
        classes,
        classAnalytics,
        monthlyRegister,
        holidays,
        totalStudents: schoolStudentSet.size,
        attendanceRate,
        daysInMonth
    }
}
