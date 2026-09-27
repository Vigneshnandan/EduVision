import { createClient } from '@/lib/supabase-server'
import { getSessionSchoolId } from './students'
import { createAdminServiceClient, isServiceRoleConfigured } from '@/lib/supabase-service'
import { ClassAnalytics, AtRiskStudent } from './types'

export type { ClassAnalytics, AtRiskStudent }

export async function getClassAnalytics(): Promise<ClassAnalytics[]> {
    const supabase = await createClient()
    const schoolId = await getSessionSchoolId(supabase)
    if (!schoolId) return []

    let db = supabase;
    if (isServiceRoleConfigured()) {
        try {
            db = createAdminServiceClient();
        } catch {
            db = supabase;
        }
    }

    // 1. Fetch configured classes for this school
    const { data: classesData } = await db
        .from('classes')
        .select('class_name')
        .eq('school_id', schoolId)

    const classNames = new Set<string>((classesData || []).map((c: any) => c.class_name))

    // 2. Fetch enrolled students per class from student_details
    const { data: studentsData } = await db
        .from('student_details')
        .select('student_id, class_name')
        .eq('school_id', schoolId)

    const uniqueStudentsPerClass: Record<string, Set<string>> = {}
    classNames.forEach(name => {
        uniqueStudentsPerClass[name] = new Set()
    })

    studentsData?.forEach((s: any) => {
        const cls = s.class_name || 'Unassigned'
        if (!uniqueStudentsPerClass[cls]) uniqueStudentsPerClass[cls] = new Set()
        if (s.student_id) uniqueStudentsPerClass[cls].add(String(s.student_id))
    })

    // 3. Fetch attendance logs for this school
    const { data: logs, error } = await db
        .from('attendance')
        .select('student_id, class_name, is_present, date, timestamp, is_manual')
        .eq('school_id', schoolId)

    if (error) {
        console.error('Error fetching attendance table:', JSON.stringify(error, null, 2))
    }

    const now = new Date()
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()
    const endOfDay = startOfDay + 86400000

    logs?.forEach((log: any) => {
        const className = log.class_name || 'Unassigned'
        if (!uniqueStudentsPerClass[className]) uniqueStudentsPerClass[className] = new Set()
        if (log.student_id) uniqueStudentsPerClass[className].add(String(log.student_id))
    })

    const presentStudentsPerClass: Record<string, Set<string>> = {}
    const manualStudentsPerClass: Record<string, Set<string>> = {}

    logs?.forEach((log: any) => {
        const logTime = Number(log.timestamp || log.date)
        const isToday = (log.date >= startOfDay && log.date < endOfDay) || 
                        (logTime >= startOfDay && logTime < endOfDay)

        if (isToday) {
            const className = log.class_name || 'Unassigned'
            const sId = String(log.student_id)
            if (log.is_present) {
                if (!presentStudentsPerClass[className]) presentStudentsPerClass[className] = new Set()
                presentStudentsPerClass[className].add(sId)
            }
            if (log.is_manual) {
                if (!manualStudentsPerClass[className]) manualStudentsPerClass[className] = new Set()
                manualStudentsPerClass[className].add(sId)
            }
        }
    })

    return Object.keys(uniqueStudentsPerClass).map(className => {
        const total = uniqueStudentsPerClass[className].size
        const present = presentStudentsPerClass[className]?.size || 0
        const manual = manualStudentsPerClass[className]?.size || 0
        return {
            className,
            totalCount: total,
            presentCount: present,
            percentage: total > 0 ? Math.round((present / total) * 100) : 0,
            manualCount: manual
        }
    }).sort((a, b) => a.className.localeCompare(b.className))
}

export async function getAtRiskStudents(): Promise<AtRiskStudent[]> {
    const supabase = await createClient()
    const schoolId = await getSessionSchoolId(supabase)
    if (!schoolId) return []

    let db = supabase;
    if (isServiceRoleConfigured()) {
        try {
            db = createAdminServiceClient();
        } catch {
            db = supabase;
        }
    }

    // Fetch school's threshold
    const { data: schoolData } = await db
        .from('schools')
        .select('at_risk_threshold_pct')
        .eq('school_id', schoolId)
        .maybeSingle()
    const threshold = schoolData?.at_risk_threshold_pct ?? 75

    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    const thirtyDaysAgoMs = thirtyDaysAgo.getTime()

    const { data: logs, error } = await db
        .from('attendance')
        .select('student_id, name, class_name, is_present, date, timestamp')
        .eq('school_id', schoolId)
        .gte('timestamp', thirtyDaysAgoMs)

    if (error) {
        console.error('Error fetching risk analytics:', JSON.stringify(error, null, 2))
        return []
    }

    if (!logs || logs.length === 0) return []

    const uniqueDates = new Set<string>()
    logs.forEach(log => {
        const ts = Number(log.date || log.timestamp)
        const dateStr = new Date(ts).toDateString()
        uniqueDates.add(dateStr)
    })
    const totalSchoolDays = uniqueDates.size

    if (totalSchoolDays === 0) return []

    const studentStats: Record<string, { name: string; className: string; presentDays: number }> = {}

    logs.forEach(log => {
        const sId = String(log.student_id)
        if (!studentStats[sId]) {
            studentStats[sId] = {
                name: log.name || 'Student',
                className: log.class_name || 'Unassigned',
                presentDays: 0
            }
        }

        if (log.is_present) {
            studentStats[sId].presentDays += 1
        }
    })

    const atRiskList: AtRiskStudent[] = []

    Object.entries(studentStats).forEach(([id, stats]) => {
        const effectivePresent = Math.min(stats.presentDays, totalSchoolDays)
        const pct = (effectivePresent / totalSchoolDays) * 100

        if (pct < threshold) {
            atRiskList.push({
                studentId: id,
                name: stats.name,
                className: stats.className,
                attendancePct: Math.round(pct),
                status: pct < (threshold - 15) ? 'Critical' : 'Warning'
            })
        }
    })

    return atRiskList.sort((a, b) => a.attendancePct - b.attendancePct)
}
