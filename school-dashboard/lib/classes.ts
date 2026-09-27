import { createClient } from "@/lib/supabase-server";
import { getSessionSchoolId } from "@/lib/students";
import { createAdminServiceClient, isServiceRoleConfigured } from "@/lib/supabase-service";
import { ClassRecord } from "./types";

export async function getClassesWithDetails(): Promise<{ classes: ClassRecord[]; teachers: { teacher_id: string; teacher_name: string }[] }> {
    const supabase = await createClient();
    const schoolId = await getSessionSchoolId(supabase);
    if (!schoolId) return { classes: [], teachers: [] };

    let db = supabase;
    if (isServiceRoleConfigured()) {
        try {
            db = createAdminServiceClient();
        } catch {
            db = supabase;
        }
    }

    // Fetch teachers for dropdowns - note public.teachers primary key is 'id'
    const { data: teachersData, error: teachersError } = await db
        .from('teachers')
        .select('*')
        .eq('school_id', schoolId)
        .order('teacher_name', { ascending: true });

    if (teachersError) {
        console.error("Error fetching teachers in getClassesWithDetails:", teachersError.message);
    }

    // Build teacher map for name resolution
    const teacherMap: Record<string, string> = {};
    (teachersData || []).forEach((t: any) => {
        const id = String(t.id ?? t.teacher_id ?? '');
        const name = t.teacher_name || t.name || 'Staff Member';
        if (id) {
            teacherMap[id] = name;
        }
    });

    const teachers = (teachersData || [])
        .filter((t: any) => t.is_active !== false)
        .map((t: any) => ({
            teacher_id: String(t.id ?? t.teacher_id ?? ''),
            teacher_name: t.teacher_name || t.name || 'Staff Member'
        }));

    // Count students per class from attendance/student_details
    const { data: attendanceData } = await db
        .from('attendance')
        .select('student_id, class_name')
        .eq('school_id', schoolId);

    const studentCountMap: Record<string, Set<string>> = {};
    const discoveredClasses = new Set<string>();

    attendanceData?.forEach((row: any) => {
        if (row.class_name) {
            discoveredClasses.add(row.class_name);
            if (!studentCountMap[row.class_name]) {
                studentCountMap[row.class_name] = new Set();
            }
            studentCountMap[row.class_name].add(row.student_id);
        }
    });

    // Try fetching from classes table
    const { data: classesData, error } = await db
        .from('classes')
        .select('class_id, school_id, class_name, class_teacher_id, created_at')
        .eq('school_id', schoolId)
        .order('class_name', { ascending: true });

    if (error) {
        console.warn("Classes table not found or query error, falling back to discovered classes:", error.message);
        // Fallback to discovered classes from attendance
        const fallbackClasses: ClassRecord[] = Array.from(discoveredClasses).sort().map(className => ({
            class_id: className,
            school_id: schoolId,
            class_name: className,
            class_teacher_id: null,
            teacher_name: null,
            student_count: studentCountMap[className]?.size || 0,
        }));
        return { classes: fallbackClasses, teachers };
    }

    // Auto-seed discovered classes into classes table if table is currently empty
    if ((!classesData || classesData.length === 0) && discoveredClasses.size > 0) {
        const seedPayload = Array.from(discoveredClasses).map(className => ({
            school_id: schoolId,
            class_name: className
        }));
        await db.from('classes').insert(seedPayload);
        
        // Re-fetch after seeding
        const { data: reseeded } = await db
            .from('classes')
            .select('class_id, school_id, class_name, class_teacher_id, created_at')
            .eq('school_id', schoolId)
            .order('class_name', { ascending: true });

        const mapped: ClassRecord[] = (reseeded || []).map((c: any) => ({
            class_id: String(c.class_id),
            school_id: String(c.school_id),
            class_name: c.class_name,
            class_teacher_id: c.class_teacher_id ? String(c.class_teacher_id) : null,
            teacher_name: c.class_teacher_id ? (teacherMap[String(c.class_teacher_id)] || 'Assigned') : null,
            student_count: studentCountMap[c.class_name]?.size || 0,
            created_at: c.created_at
        }));
        return { classes: mapped, teachers };
    }

    const mappedClasses: ClassRecord[] = (classesData || []).map((c: any) => ({
        class_id: String(c.class_id),
        school_id: String(c.school_id),
        class_name: c.class_name,
        class_teacher_id: c.class_teacher_id ? String(c.class_teacher_id) : null,
        teacher_name: c.class_teacher_id ? (teacherMap[String(c.class_teacher_id)] || 'Assigned') : null,
        student_count: studentCountMap[c.class_name]?.size || 0,
        created_at: c.created_at
    }));

    return { classes: mappedClasses, teachers };
}

export async function createClass(className: string, teacherId?: string | null) {
    const supabase = await createClient();
    const schoolId = await getSessionSchoolId(supabase);
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
        .from('classes')
        .insert({
            school_id: schoolId,
            class_name: className.trim(),
            class_teacher_id: teacherId || null
        });

    if (error) throw error;
}

export async function updateClass(classId: string, className: string, teacherId?: string | null) {
    const supabase = await createClient();
    const schoolId = await getSessionSchoolId(supabase);
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
        .from('classes')
        .update({
            class_name: className.trim(),
            class_teacher_id: teacherId || null
        })
        .eq('class_id', classId)
        .eq('school_id', schoolId);

    if (error) throw error;
}

export async function deleteClass(classId: string) {
    const supabase = await createClient();
    const schoolId = await getSessionSchoolId(supabase);
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
        .from('classes')
        .delete()
        .eq('class_id', classId)
        .eq('school_id', schoolId);

    if (error) throw error;
}
