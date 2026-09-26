import { createClient } from "@/lib/supabase-server"

export interface PlatformTeacherItem {
    teacher_id: string;
    school_id: string;
    school_name: string;
    teacher_name: string;
    teacher_login_id: string;
    role: 'teacher' | 'school_admin';
    is_active: boolean;
    created_at: string;
}

export async function getAllPlatformTeachers(): Promise<{
    teachers: PlatformTeacherItem[];
    schools: { school_id: string; school_name: string }[];
}> {
    const supabase = await createClient()

    // 1. Fetch schools for name resolution and filter dropdown
    const { data: schoolsData } = await supabase
        .from('schools')
        .select('school_id, school_name')
        .order('school_name', { ascending: true })

    const schools = (schoolsData || []).map((s: any) => ({
        school_id: String(s.school_id),
        school_name: s.school_name
    }))

    const schoolMap: Record<string, string> = {}
    schools.forEach(s => {
        schoolMap[s.school_id] = s.school_name
    })

    // 2. Fetch all teachers across every school
    const { data: teachersData, error } = await supabase
        .from('teachers')
        .select('*')
        .order('created_at', { ascending: false })

    if (error) {
        console.error("Error fetching platform teachers:", error)
        return { teachers: [], schools }
    }

    const teachers: PlatformTeacherItem[] = (teachersData || []).map((t: any) => {
        const sid = String(t.school_id || '')
        return {
            teacher_id: String(t.teacher_id || t.id),
            school_id: sid,
            school_name: schoolMap[sid] || 'Unassigned School',
            teacher_name: t.teacher_name || t.name || 'Staff Member',
            teacher_login_id: t.teacher_login_id || t.email || '',
            role: t.role || 'teacher',
            is_active: t.is_active ?? true,
            created_at: t.created_at || new Date().toISOString()
        }
    })

    return { teachers, schools }
}

export async function togglePlatformTeacherStatus(teacherId: string, currentStatus: boolean) {
    const supabase = await createClient()

    const { error } = await supabase
        .from('teachers')
        .update({ is_active: !currentStatus })
        .or(`teacher_id.eq.${teacherId},id.eq.${teacherId}`)

    if (error) throw error
}
