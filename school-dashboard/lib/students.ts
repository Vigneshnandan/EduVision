import { createClient } from "@/lib/supabase-server";
import { StudentProfile } from "./types";

export type { StudentProfile };

export async function getSessionSchoolId(supabase: any) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null
    
    // Check metadata first
    if (user.user_metadata?.school_id) {
        return user.user_metadata.school_id
    }

    const loginId = user.user_metadata?.teacher_login_id || user.email
    if (!loginId) return null

    const { data } = await supabase
        .from('teachers')
        .select('school_id')
        .eq('teacher_login_id', loginId)
        .maybeSingle()

    return data?.school_id
}

export async function getAllStudents(): Promise<StudentProfile[]> {
    try {
        const supabase = await createClient()
        const schoolId = await getSessionSchoolId(supabase)
        if (!schoolId) return []

        const { data: attendanceLogs, error: logError } = await supabase
            .from("attendance")
            .select("student_id, name, class_name")
            .eq('school_id', schoolId)
            .order("class_name", { ascending: true });

        if (logError) throw logError;

        const studentMap: Record<string, StudentProfile> = {};
        attendanceLogs?.forEach((log) => {
            if (!studentMap[log.student_id]) {
                studentMap[log.student_id] = {
                    student_id: log.student_id,
                    name: log.name,
                    class_name: log.class_name,
                };
            }
        });

        // For student_details, assume we should also filter by school_id if available,
        // but typically student details is 1-1 with student_id. Let's just fetch for those students.
        // Actually the prompt says "filter by school_id to getAllStudents(), getClassAnalytics(), getAtRiskStudents(), getMonthlyAttendance()"
        const { data: details, error: detailError } = await supabase
            .from("student_details")
            .select("*");

        if (details) {
            details.forEach((d) => {
                if (studentMap[d.student_id]) {
                    studentMap[d.student_id] = {
                        ...studentMap[d.student_id],
                        roll_number: d.roll_number,
                        guardian_name: d.guardian_name,
                        contact_number: d.contact_number,
                        address: d.address,
                        blood_group: d.blood_group,
                    };
                }
            });
        }

        return Object.values(studentMap).sort((a, b) => a.class_name.localeCompare(b.class_name) || a.name.localeCompare(b.name));
    } catch (error) {
        console.error("Error fetching students:", error);
        return [];
    }
}

export async function updateStudentDetails(id: string, details: Partial<StudentProfile>) {
    const supabase = await createClient()
    const { error } = await supabase
        .from('student_details')
        .upsert({
            student_id: id,
            roll_number: details.roll_number,
            guardian_name: details.guardian_name,
            contact_number: details.contact_number,
            address: details.address,
            blood_group: details.blood_group,
            updated_at: new Date()
        })

    if (error) throw error;
}

export async function getStudentAttendanceHistory(studentId: string): Promise<any[]> {
    const supabase = await createClient()
    const schoolId = await getSessionSchoolId(supabase)
    if (!schoolId) return []

    const thirtyDaysAgo = Date.now() - (35 * 24 * 60 * 60 * 1000)

    const { data: logs, error } = await supabase
        .from('attendance')
        .select('date, timestamp, is_present, is_manual, marked_by, correction_reason')
        .eq('school_id', schoolId)
        .eq('student_id', studentId)
        .gte('date', thirtyDaysAgo)
        .order('date', { ascending: false })

    if (error) {
        console.error("Error fetching student history:", error)
        return []
    }

    return (logs || []).map((l: any) => {
        const ts = Number(l.date || l.timestamp)
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
