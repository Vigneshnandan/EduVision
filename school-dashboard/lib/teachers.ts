import { createClient } from "@/lib/supabase-server";
import { getSessionSchoolId } from "@/lib/students";
import { TeacherRecord } from "./types";

export async function checkIsSchoolAdmin(): Promise<boolean> {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;
    
    // Check user_metadata role
    if (user.user_metadata?.role === 'school_admin') return true;

    // Check teacher record role
    const schoolId = await getSessionSchoolId(supabase);
    if (!schoolId) return false;

    const loginId = user.user_metadata?.teacher_login_id || user.email;
    const { data } = await supabase
        .from('teachers')
        .select('role')
        .eq('school_id', schoolId)
        .eq('teacher_login_id', loginId)
        .maybeSingle();

    return data?.role === 'school_admin';
}

export async function getSchoolTeachers(): Promise<{ teachers: TeacherRecord[]; isSchoolAdmin: boolean }> {
    const supabase = await createClient();
    const schoolId = await getSessionSchoolId(supabase);
    if (!schoolId) return { teachers: [], isSchoolAdmin: false };

    const isSchoolAdmin = await checkIsSchoolAdmin();

    const { data, error } = await supabase
        .from('teachers')
        .select('*')
        .eq('school_id', schoolId)
        .order('created_at', { ascending: false });

    if (error) {
        console.error("Error fetching teachers:", error);
        return { teachers: [], isSchoolAdmin };
    }

    const mapped: TeacherRecord[] = (data || []).map((t: any) => ({
        teacher_id: t.teacher_id || t.id,
        school_id: t.school_id,
        teacher_name: t.teacher_name || t.name || 'Staff Member',
        teacher_login_id: t.teacher_login_id || t.email || '',
        role: t.role || 'teacher',
        is_active: t.is_active ?? true,
        created_at: t.created_at
    }));

    return { teachers: mapped, isSchoolAdmin };
}

export async function toggleTeacherStatus(teacherId: string, currentStatus: boolean) {
    const isAdmin = await checkIsSchoolAdmin();
    if (!isAdmin) {
        throw new Error("Unauthorized: Only a school administrator can manage teacher accounts.");
    }

    const supabase = await createClient();
    const schoolId = await getSessionSchoolId(supabase);
    if (!schoolId) throw new Error("Not authenticated");

    const { error } = await supabase
        .from('teachers')
        .update({ is_active: !currentStatus })
        .or(`teacher_id.eq.${teacherId},id.eq.${teacherId}`)
        .eq('school_id', schoolId);

    if (error) throw error;
}

export async function updateTeacherRole(teacherId: string, newRole: 'teacher' | 'school_admin') {
    const isAdmin = await checkIsSchoolAdmin();
    if (!isAdmin) {
        throw new Error("Unauthorized: Only a school administrator can modify roles.");
    }

    const supabase = await createClient();
    const schoolId = await getSessionSchoolId(supabase);
    if (!schoolId) throw new Error("Not authenticated");

    const { error } = await supabase
        .from('teachers')
        .update({ role: newRole })
        .or(`teacher_id.eq.${teacherId},id.eq.${teacherId}`)
        .eq('school_id', schoolId);

    if (error) throw error;
}

export async function createTeacherRecord(name: string, loginId: string, role: 'teacher' | 'school_admin' = 'teacher') {
    const isAdmin = await checkIsSchoolAdmin();
    if (!isAdmin) {
        throw new Error("Unauthorized: Only a school administrator can add teachers.");
    }

    const supabase = await createClient();
    const schoolId = await getSessionSchoolId(supabase);
    if (!schoolId) throw new Error("Not authenticated");

    const { error } = await supabase
        .from('teachers')
        .insert({
            school_id: schoolId,
            teacher_name: name.trim(),
            teacher_login_id: loginId.trim().toLowerCase(),
            role: role,
            is_active: true
        });

    if (error) throw error;
}
