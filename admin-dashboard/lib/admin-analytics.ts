import { createAdminServiceClient } from "@/lib/supabase-service"

export interface AdminDashboardStats {
    totalSchools: number;
    activeSchools: number;
    trialSchools: number;
    suspendedSchools: number;
    schoolsByStatus: {
        active: number;
        trial: number;
        suspended: number;
    };
    totalStudents: number;
    totalTeachers: number;
    attendanceEventsThisWeek: number;
    statewideAttendanceRate: number;
    schoolRankings: {
        schoolId: string;
        schoolName: string;
        schoolCode: string;
        status: string;
        studentCount: number;
        attendanceRate: number;
        lastActive: string | null;
    }[];
    recentSyncFeed: {
        id: string;
        schoolName: string;
        className: string;
        teacherName: string;
        timestamp: string;
        count: number;
    }[];
}

export async function getAdminDashboardStats(): Promise<AdminDashboardStats> {
    const supabase = createAdminServiceClient()

    // 1. Fetch all schools
    const { data: schools } = await supabase
        .from('schools')
        .select('*')
        .order('school_name', { ascending: true })

    const schoolList = schools || []
    const totalSchools = schoolList.length
    const activeSchools = schoolList.filter((s: any) => s.status === 'active').length
    const trialSchools = schoolList.filter((s: any) => s.status === 'trial').length
    const suspendedSchools = schoolList.filter((s: any) => s.status === 'suspended').length

    const schoolMap: Record<string, any> = {}
    schoolList.forEach((s: any) => {
        schoolMap[String(s.school_id)] = s
    })

    // 2. Fetch all teachers
    const { data: teachers } = await supabase
        .from('teachers')
        .select('school_id, teacher_name')

    const totalTeachers = teachers?.length || 0

    // 3. Fetch attendance logs for state metrics (last 7 days)
    const sevenDaysAgo = Date.now() - (7 * 24 * 60 * 60 * 1000)
    const { data: attendance } = await supabase
        .from('attendance')
        .select('school_id, student_id, class_name, is_present, date, timestamp, marked_by')
        .gte('date', sevenDaysAgo)
        .order('date', { ascending: false })

    const logs = attendance || []
    const studentSet = new Set<string>()
    let presentCount = 0
    let totalCount = 0

    const schoolStudentSet: Record<string, Set<string>> = {}
    const schoolPresentCount: Record<string, number> = {}
    const schoolTotalCount: Record<string, number> = {}
    const schoolLastActive: Record<string, number> = {}

    logs.forEach((log: any) => {
        const sid = String(log.school_id || '')
        studentSet.add(String(log.student_id))
        totalCount++
        if (log.is_present) presentCount++

        if (sid) {
            if (!schoolStudentSet[sid]) schoolStudentSet[sid] = new Set()
            schoolStudentSet[sid].add(String(log.student_id))

            schoolTotalCount[sid] = (schoolTotalCount[sid] || 0) + 1
            if (log.is_present) {
                schoolPresentCount[sid] = (schoolPresentCount[sid] || 0) + 1
            }

            const ts = Number(log.date || log.timestamp || 0)
            if (ts > (schoolLastActive[sid] || 0)) {
                schoolLastActive[sid] = ts
            }
        }
    })

    // Fetch total distinct students platform-wide across all recorded attendance
    const { data: allStudentRows } = await supabase
        .from('attendance')
        .select('student_id')
        .limit(2000)

    const allPlatformStudents = new Set<string>()
    allStudentRows?.forEach((r: any) => {
        if (r.student_id) allPlatformStudents.add(String(r.student_id))
    })

    const finalTotalStudents = allPlatformStudents.size > 0 ? allPlatformStudents.size : studentSet.size

    const statewideAttendanceRate = totalCount > 0 ? Math.round((presentCount / totalCount) * 100) : 0

    // Build School Performance Rankings
    const schoolRankings = schoolList.map((s: any) => {
        const sid = String(s.school_id)
        const sTotal = schoolTotalCount[sid] || 0
        const sPresent = schoolPresentCount[sid] || 0
        const rate = sTotal > 0 ? Math.round((sPresent / sTotal) * 100) : 0
        const lastTs = schoolLastActive[sid]

        return {
            schoolId: sid,
            schoolName: s.school_name,
            schoolCode: s.school_code,
            status: s.status || 'trial',
            studentCount: schoolStudentSet[sid]?.size || 0,
            attendanceRate: rate,
            lastActive: lastTs ? new Date(lastTs).toLocaleDateString() : null
        }
    }).sort((a, b) => b.attendanceRate - a.attendanceRate)

    // Recent Sync Feed (grouped by school & class batches)
    const feedGroups: Record<string, any> = {}
    logs.slice(0, 30).forEach((l: any) => {
        const sid = String(l.school_id || '')
        const key = `${sid}-${l.class_name}-${new Date(l.date || l.timestamp).toDateString()}`
        if (!feedGroups[key]) {
            feedGroups[key] = {
                id: key,
                schoolName: schoolMap[sid]?.school_name || 'District School',
                className: l.class_name || 'General',
                teacherName: l.marked_by || 'Staff Member',
                timestamp: new Date(l.date || l.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                count: 0
            }
        }
        feedGroups[key].count++
    })

    const recentSyncFeed = Object.values(feedGroups).slice(0, 8)

    return {
        totalSchools,
        activeSchools,
        trialSchools,
        suspendedSchools,
        schoolsByStatus: {
            active: activeSchools,
            trial: trialSchools,
            suspended: suspendedSchools
        },
        totalStudents: finalTotalStudents,
        totalTeachers,
        attendanceEventsThisWeek: totalCount,
        statewideAttendanceRate,
        schoolRankings,
        recentSyncFeed
    }
}
