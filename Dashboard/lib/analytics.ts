
import { supabase } from '@/lib/supabase'

export interface ClassAnalytics {
    className: string
    presentCount: number
    totalCount: number
    percentage: number
    manualCount?: number
}

export async function getClassAnalytics(): Promise<ClassAnalytics[]> {
    // 1. Fetch relevant attendance data
    // needed: class_name, student_id, is_present, date
    // We fetch a wide range or just process logic.
    // For "Total Students" per class, we need unique student_ids grouped by class.
    // For "Present" per class, we need records for TODAY where is_present is true.

    const { data: logs, error } = await supabase
        .from('attendance')
        .select('student_id, class_name, is_present, date, is_manual')

    if (error) {
        console.error('Error fetching attendance table:', JSON.stringify(error, null, 2))
        return []
    }

    // Define "Today" boundaries (Local time or UTC? assuming local for dashboard context)
    const now = new Date()
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()
    const endOfDay = startOfDay + 86400000

    // Process data in memory (efficient enough for <10k records)
    const classStats: Record<string, { totalStudents: Set<string>; presentToday: number }> = {}

    logs?.forEach((log: any) => {
        const className = log.class_name || 'Unassigned'
        if (!classStats[className]) {
            classStats[className] = { totalStudents: new Set(), presentToday: 0 }
        }

        // 1. Build distinct student roster per class (based on historical logs)
        classStats[className].totalStudents.add(log.student_id)

        // 2. Check if this log is for TODAY and PRESENT
        // The 'date' column is int8 (ms timestamp)
        if (log.date >= startOfDay && log.date < endOfDay && log.is_present) {
            // We might have duplicates if a student scans multiple times today.
            // Ideally we count unique students present today, but for now specific log count or unique?
            // Let's assume one success log = present. We should verify uniqueness if needed.
            // For this loop, let's just count instances. To be safer, we could use a Set for present too.
            // Let's simple counter for now, but strictly we should use a Set for 'presentToday' too if multiple scans allowed.
        }
    })

    // Re-iterate to count unique present students today
    // A safer approach:
    const finalStats: Record<string, { total: number; present: number }> = {}

    // Initialize
    logs?.forEach((log: any) => {
        const className = log.class_name || 'Unassigned'
        if (!finalStats[className]) finalStats[className] = { total: 0, present: 0 }
    })

    // Calculate Totals (Unique IDs per class)
    const uniqueStudentsPerClass: Record<string, Set<string>> = {}
    logs?.forEach((log: any) => {
        const className = log.class_name || 'Unassigned'
        if (!uniqueStudentsPerClass[className]) uniqueStudentsPerClass[className] = new Set()
        uniqueStudentsPerClass[className].add(log.student_id)
    })

    // Calculate Present Today (Unique IDs present today)
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

    // Merge
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

export interface AtRiskStudent {
    studentId: string
    name: string
    className: string
    attendancePct: number
    status: 'Critical' | 'Warning' | 'Good'
}

export async function getAtRiskStudents(): Promise<AtRiskStudent[]> {
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    const thirtyDaysAgoMs = thirtyDaysAgo.getTime()

    // Fetch all logs for the last 30 days
    const { data: logs, error } = await supabase
        .from('attendance')
        .select('student_id, name, class_name, is_present, date')
        .gte('date', thirtyDaysAgoMs)

    if (error) {
        console.error('Error fetching risk analytics:', JSON.stringify(error, null, 2))
        return []
    }

    if (!logs || logs.length === 0) return []

    // 1. Calculate Total Working Days (Unique dates in the system)
    // We use a Set of date strings (or rounded timestamps) to count unique days
    const uniqueDates = new Set<string>()
    logs.forEach(log => {
        // Assuming log.date is ms timestamp at midnight or similar. 
        // To be safe, convert to date string YYYY-MM-DD
        const dateStr = new Date(log.date).toDateString()
        uniqueDates.add(dateStr)
    })
    const totalSchoolDays = uniqueDates.size

    if (totalSchoolDays === 0) return []

    // 2. Calculate Present Days per Student
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

    // 3. Filter and Format
    const atRiskList: AtRiskStudent[] = []

    Object.entries(studentStats).forEach(([id, stats]) => {
        // Correction logic: Cap presentDays at totalSchoolDays in case of multiple checks
        const effectivePresent = Math.min(stats.presentDays, totalSchoolDays)
        const pct = (effectivePresent / totalSchoolDays) * 100

        if (pct < 75) {
            atRiskList.push({
                studentId: id,
                name: stats.name,
                className: stats.className,
                attendancePct: Math.round(pct),
                status: pct < 60 ? 'Critical' : 'Warning'
            })
        }
    })

    return atRiskList.sort((a, b) => a.attendancePct - b.attendancePct)
}
