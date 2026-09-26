import { createClient } from '@/lib/supabase-server'
import { getSessionSchoolId } from './students'
import { ClassAnalytics, AtRiskStudent } from './types'

export type { ClassAnalytics, AtRiskStudent }

export async function getClassAnalytics(): Promise<ClassAnalytics[]> {
    const supabase = await createClient()
    const schoolId = await getSessionSchoolId(supabase)
    if (!schoolId) return []

    const { data: logs, error } = await supabase
        .from('attendance')
        .select('student_id, class_name, is_present, date, is_manual')
        .eq('school_id', schoolId)

    if (error) {
        console.error('Error fetching attendance table:', JSON.stringify(error, null, 2))
        return []
    }

    const now = new Date()
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()
    const endOfDay = startOfDay + 86400000

    const uniqueStudentsPerClass: Record<string, Set<string>> = {}
    logs?.forEach((log: any) => {
        const className = log.class_name || 'Unassigned'
        if (!uniqueStudentsPerClass[className]) uniqueStudentsPerClass[className] = new Set()
        uniqueStudentsPerClass[className].add(log.student_id)
    })

    const presentStudentsPerClass: Record<string, Set<string>> = {}
    const manualStudentsPerClass: Record<string, Set<string>> = {}
    logs?.forEach((log: any) => {
        if (log.date >= startOfDay && log.date < endOfDay) {
            const className = log.class_name || 'Unassigned'
            if (log.is_present) {
                if (!presentStudentsPerClass[className]) presentStudentsPerClass[className] = new Set()
                presentStudentsPerClass[className].add(log.student_id)
            }
            if (log.is_manual) {
                if (!manualStudentsPerClass[className]) manualStudentsPerClass[className] = new Set()
                manualStudentsPerClass[className].add(log.student_id)
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
            percentage: total > 0 ? (present / total) * 100 : 0,
            manualCount: manual
        }
    }).sort((a, b) => a.className.localeCompare(b.className))
}


export async function getAtRiskStudents(): Promise<AtRiskStudent[]> {
    const supabase = await createClient()
    const schoolId = await getSessionSchoolId(supabase)
    if (!schoolId) return []

    // Fetch school's threshold
    const { data: schoolData } = await supabase.from('schools').select('at_risk_threshold_pct').eq('school_id', schoolId).maybeSingle()
    const threshold = schoolData?.at_risk_threshold_pct ?? 75

    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    const thirtyDaysAgoMs = thirtyDaysAgo.getTime()

    const { data: logs, error } = await supabase
        .from('attendance')
        .select('student_id, name, class_name, is_present, date')
        .eq('school_id', schoolId)
        .gte('date', thirtyDaysAgoMs)

    if (error) {
        console.error('Error fetching risk analytics:', JSON.stringify(error, null, 2))
        return []
    }

    if (!logs || logs.length === 0) return []

    const uniqueDates = new Set<string>()
    logs.forEach(log => {
        const dateStr = new Date(log.date).toDateString()
        uniqueDates.add(dateStr)
    })
    const totalSchoolDays = uniqueDates.size

    if (totalSchoolDays === 0) return []

    const studentStats: Record<string, { name: string; className: string; presentDays: number }> = {}

    logs.forEach(log => {
        if (!studentStats[log.student_id]) {
            studentStats[log.student_id] = {
                name: log.name || 'Unknown',
                className: log.class_name || 'Unassigned',
                presentDays: 0
            }
        }

        if (log.is_present) {
            studentStats[log.student_id].presentDays += 1
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
