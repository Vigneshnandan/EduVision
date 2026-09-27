import { createClient } from "@/lib/supabase-server";
import { createAdminServiceClient, isServiceRoleConfigured } from "@/lib/supabase-service";
import { StudentProfile } from "./types";

export type { StudentProfile };

export async function getSessionSchoolId(supabase: any) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null
    
    // Check metadata first
    if (user.user_metadata?.school_id) {
        return String(user.user_metadata.school_id)
    }

    const loginId = user.user_metadata?.teacher_login_id || user.email
    if (!loginId) return null

    const { data } = await supabase
        .from('teachers')
        .select('school_id')
        .eq('teacher_login_id', loginId)
        .maybeSingle()

    return data?.school_id ? String(data.school_id) : null
}

export async function getAllStudents(): Promise<StudentProfile[]> {
    try {
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

        const studentMap: Record<string, StudentProfile> = {};

        // 1. Fetch registered students from student_details for this school
        const { data: details, error: detailError } = await db
            .from("student_details")
            .select("*")
            .eq("school_id", schoolId);

        if (detailError) {
            console.error("Error fetching student_details:", detailError);
        }

        (details || []).forEach((d: any) => {
            const id = String(d.student_id);
            studentMap[id] = {
                student_id: id,
                name: d.student_name || 'Student',
                class_name: d.class_name || 'Unassigned',
                roll_number: d.roll_number || '',
                guardian_name: d.guardian_name || '',
                contact_number: d.contact_number || '',
                address: d.address || '',
                blood_group: d.blood_group || '',
            };
        });

        // 2. Fetch students from attendance logs for this school
        const { data: attendanceLogs, error: logError } = await db
            .from("attendance")
            .select("student_id, name, class_name, roll_number")
            .eq('school_id', schoolId)
            .order("class_name", { ascending: true });

        if (logError) {
            console.error("Error fetching attendance logs for students:", logError);
        }

        (attendanceLogs || []).forEach((log: any) => {
            const logName = (log.name || '').trim();
            if (!logName) return;
            let id = String(log.student_id);
            if (studentMap[id] && studentMap[id].name.trim().toLowerCase() !== logName.toLowerCase() && studentMap[id].name !== 'Student') {
                id = `${log.student_id}_${logName.toLowerCase()}`;
            }
            if (!studentMap[id]) {
                studentMap[id] = {
                    student_id: String(log.student_id),
                    name: logName || 'Student',
                    class_name: log.class_name || 'Unassigned',
                    roll_number: log.roll_number || '',
                };
            } else {
                // If details had fallback name or class, fill in from attendance
                if (!studentMap[id].name || studentMap[id].name === 'Student') {
                    studentMap[id].name = logName || studentMap[id].name;
                }
                if (!studentMap[id].class_name || studentMap[id].class_name === 'Unassigned') {
                    studentMap[id].class_name = log.class_name || studentMap[id].class_name;
                }
                if (!studentMap[id].roll_number) {
                    studentMap[id].roll_number = log.roll_number || '';
                }
            }
        });

        return Object.values(studentMap).sort((a, b) => 
            (a.class_name || '').localeCompare(b.class_name || '') || 
            (a.name || '').localeCompare(b.name || '')
        );
    } catch (error) {
        console.error("Error fetching students:", error);
        return [];
    }
}

export async function updateStudentDetails(id: string, details: Partial<StudentProfile>) {
    const supabase = await createClient()
    const schoolId = await getSessionSchoolId(supabase)
    if (!schoolId) throw new Error("Not authenticated");

    let db = supabase;
    if (isServiceRoleConfigured()) {
        try {
            db = createAdminServiceClient();
        } catch {
            db = supabase;
        }
    }

    const { error } = await db
        .from('student_details')
        .upsert({
            student_id: id,
            school_id: schoolId,
            student_name: details.name,
            class_name: details.class_name,
            roll_number: details.roll_number,
            guardian_name: details.guardian_name,
            contact_number: details.contact_number,
            address: details.address,
            blood_group: details.blood_group,
            updated_at: new Date().toISOString()
        }, {
            onConflict: 'student_id,school_id'
        });

    if (error) throw error;
}

export async function getStudentAttendanceHistory(studentId: string): Promise<any[]> {
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

    const thirtyDaysAgo = Date.now() - (35 * 24 * 60 * 60 * 1000)

    let { data: logs, error } = await db
        .from('attendance')
        .select('date, timestamp, is_present, is_manual, marked_by, correction_reason')
        .eq('school_id', schoolId)
        .eq('student_id', studentId)
        .gte('timestamp', thirtyDaysAgo)
        .order('timestamp', { ascending: false })

    if (error && (error as any).code === '42703') {
        const fallback = await db
            .from('attendance')
            .select('date, timestamp, is_present, is_manual, marked_by')
            .eq('school_id', schoolId)
            .eq('student_id', studentId)
            .gte('timestamp', thirtyDaysAgo)
            .order('timestamp', { ascending: false })
        logs = fallback.data as any
        error = fallback.error as any
    }

    if (error) {
        console.error("Error fetching student history:", error)
        return []
    }

    return (logs || []).map((l: any) => {
        const ts = Number(l.timestamp || l.date || Date.now())
        return {
            date: ts,
            dateStr: new Date(ts).toISOString().split('T')[0],
            isPresent: !!l.is_present,
            isManual: !!l.is_manual,
            markedBy: l.marked_by || null,
            correctionReason: l.correction_reason || null
        }
    })
}
