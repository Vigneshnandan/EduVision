import { createClient } from "@/lib/supabase-server";
import { getSessionSchoolId } from "@/lib/students";
import { createAdminServiceClient, isServiceRoleConfigured } from "@/lib/supabase-service";
import { format } from "date-fns";
import { ClassBatch, AttendanceLog } from "@/components/RecentActivityTable";

export interface DashboardData {
    school: {
        school_id: string;
        school_name: string;
        school_code?: string;
        status?: string;
    };
    stats: {
        totalClasses: number;
        totalStudents: number;
        totalPresent: number;
        attendanceRate: number;
    };
    classPerformance: Array<{
        className: string;
        percentage: number;
        presentCount: number;
        totalCount: number;
    }>;
    weeklyTrends: Array<{
        date: string;
        percentage: number;
        total: number;
    }>;
    batches: ClassBatch[];
    lastSync: string;
}

export async function getDashboardData(): Promise<DashboardData | null> {
    const supabase = await createClient();
    const schoolId = await getSessionSchoolId(supabase);
    if (!schoolId) return null;

    let db = supabase;
    if (isServiceRoleConfigured()) {
        try {
            db = createAdminServiceClient();
        } catch {
            db = supabase;
        }
    }

    // 1. Fetch School Profile
    const { data: schoolData } = await db
        .from('schools')
        .select('school_id, school_name, school_code, status')
        .eq('school_id', schoolId)
        .maybeSingle();

    const school = {
        school_id: String(schoolId),
        school_name: schoolData?.school_name || `School #${schoolId}`,
        school_code: schoolData?.school_code || '',
        status: schoolData?.status || 'active'
    };

    // 2. Fetch Classes for this School
    const { data: classesData } = await db
        .from('classes')
        .select('class_id, class_name')
        .eq('school_id', schoolId);

    const configuredClasses = (classesData || []).map((c: any) => c.class_name);

    // 3. Fetch Enrolled Students for this School
    const { data: studentDetails } = await db
        .from('student_details')
        .select('student_id, class_name')
        .eq('school_id', schoolId);

    const enrolledStudentIds = new Set<string>();
    studentDetails?.forEach((s: any) => {
        if (s.student_id) enrolledStudentIds.add(String(s.student_id));
    });

    // 4. Fetch Attendance Logs from the last 7 days strictly for THIS school
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayEpoch = today.getTime();

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(today.getDate() - 6);
    sevenDaysAgo.setHours(0, 0, 0, 0);
    const sevenDaysAgoEpoch = sevenDaysAgo.getTime();

    const { data: logsData, error: logsError } = await db
        .from('attendance')
        .select('*')
        .eq('school_id', schoolId)
        .gte('timestamp', sevenDaysAgoEpoch)
        .order('timestamp', { ascending: false });

    if (logsError) {
        console.error("Error fetching school attendance logs:", logsError.message);
    }

    const allLogs: AttendanceLog[] = (logsData || []).map((row: any) => {
        if (row.student_id) enrolledStudentIds.add(String(row.student_id));
        return {
            id: row.id,
            student_id: String(row.student_id),
            name: row.name || 'Student',
            class_name: row.class_name || 'Unassigned',
            is_present: Boolean(row.is_present),
            timestamp: Number(row.timestamp || row.date || Date.now()),
            is_manual: Boolean(row.is_manual),
            marked_by: row.marked_by || undefined
        };
    });

    // Separate Today's logs for KPI and Activity Table
    const todaysLogs = allLogs.filter(log => log.timestamp >= todayEpoch);

    // Distinct present students today
    const presentStudentIds = new Set<string>();
    todaysLogs.forEach(log => {
        if (log.is_present) {
            presentStudentIds.add(log.student_id);
        }
    });

    const totalPresent = presentStudentIds.size;
    const totalEnrolled = enrolledStudentIds.size;
    const attendanceRate = totalEnrolled > 0
        ? Math.round((totalPresent / totalEnrolled) * 1000) / 10
        : (todaysLogs.length > 0 ? Math.round((todaysLogs.filter(l => l.is_present).length / todaysLogs.length) * 1000) / 10 : 0);

    // 5. Class Activity Feed & Performance (Today)
    const groups: Record<string, AttendanceLog[]> = {};
    todaysLogs.forEach((log) => {
        const className = log.class_name || 'Unassigned';
        if (!groups[className]) {
            groups[className] = [];
        }
        groups[className].push(log);
    });

    const batchList: ClassBatch[] = Object.keys(groups).map((className) => {
        const classLogs = groups[className];
        classLogs.sort((a, b) => b.timestamp - a.timestamp);

        const classTotal = classLogs.length;
        const classPresent = classLogs.filter((l) => l.is_present).length;
        const latestTime = classLogs[0]?.timestamp 
            ? new Date(classLogs[0].timestamp).toISOString() 
            : new Date().toISOString();

        return {
            className,
            lastSync: latestTime,
            totalStudents: classTotal,
            presentCount: classPresent,
            students: classLogs,
        };
    });

    batchList.sort((a, b) => new Date(b.lastSync).getTime() - new Date(a.lastSync).getTime());

    // Prepare Class Performance Chart data
    // Include configured classes even if no attendance recorded yet
    const classSet = new Set<string>([...configuredClasses, ...Object.keys(groups)]);
    const classPerformance = Array.from(classSet).sort().map(className => {
        const batch = groups[className];
        if (!batch || batch.length === 0) {
            return {
                className,
                percentage: 0,
                presentCount: 0,
                totalCount: 0
            };
        }
        const total = batch.length;
        const present = batch.filter(l => l.is_present).length;
        return {
            className,
            percentage: total > 0 ? Math.round((present / total) * 100) : 0,
            presentCount: present,
            totalCount: total
        };
    });

    // 6. Weekly Trend (Last 7 Days) strictly for this school
    const daysMap: Record<string, { total: number; present: number }> = {};
    for (let i = 0; i < 7; i++) {
        const d = new Date();
        d.setDate(today.getDate() - i);
        const dateStr = format(d, 'yyyy-MM-dd');
        daysMap[dateStr] = { total: 0, present: 0 };
    }

    allLogs.forEach(log => {
        const logDate = new Date(log.timestamp);
        const dateStr = format(logDate, 'yyyy-MM-dd');
        if (daysMap[dateStr]) {
            daysMap[dateStr].total += 1;
            if (log.is_present) daysMap[dateStr].present += 1;
        }
    });

    const weeklyTrends = Object.keys(daysMap).sort().map(date => {
        const dayStats = daysMap[date];
        return {
            date,
            percentage: dayStats.total > 0 ? Math.round((dayStats.present / dayStats.total) * 100) : 0,
            total: dayStats.total
        };
    });

    const totalClasses = Math.max(configuredClasses.length, Object.keys(groups).length);

    return {
        school,
        stats: {
            totalClasses,
            totalStudents: totalEnrolled,
            totalPresent,
            attendanceRate
        },
        classPerformance,
        weeklyTrends,
        batches: batchList,
        lastSync: format(new Date(), "h:mm a")
    };
}
