import { createClient } from "@/lib/supabase-server";
import { getSessionSchoolId } from "@/lib/students";
import { createAdminServiceClient, isServiceRoleConfigured } from "@/lib/supabase-service";
import { TeacherRecord } from "./types";

export async function checkIsSchoolAdmin(): Promise<boolean> {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;
    
    // Check server-controlled app_metadata (cannot be modified by client)
    if (user.app_metadata?.role === 'school_admin' || user.app_metadata?.role === 'platform_admin') return true;

    // Verify teacher record role in database
    const schoolId = await getSessionSchoolId(supabase);
    if (!schoolId) return false;

    const loginId = user.user_metadata?.teacher_login_id || user.email;
    const { data } = await supabase
        .from('teachers')
        .select('role, is_active')
        .eq('school_id', schoolId)
        .or(`auth_user_id.eq.${user.id},teacher_login_id.eq.${loginId}`)
        .maybeSingle();

    return data?.role === 'school_admin' && data?.is_active !== false;
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
        teacher_id: String(t.teacher_id || t.id),
        school_id: String(t.school_id),
        teacher_name: t.teacher_name || t.name || 'Staff Member',
        teacher_login_id: t.teacher_login_id || t.email || '',
        role: t.role || 'teacher',
        is_active: t.is_active ?? true,
        auth_user_id: t.auth_user_id || null,
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

export async function createTeacherRecord(
    name: string, 
    loginId: string, 
    password?: string, 
    role: 'teacher' | 'school_admin' = 'teacher'
) {
    const isAdmin = await checkIsSchoolAdmin();
    if (!isAdmin) {
        throw new Error("Unauthorized: Only a school administrator can add teachers.");
    }

    const supabase = await createClient();
    const schoolId = await getSessionSchoolId(supabase);
    if (!schoolId) throw new Error("Not authenticated");

    // Fetch school name for mobile app metadata
    const { data: school } = await supabase
        .from('schools')
        .select('school_name, school_code')
        .eq('school_id', schoolId)
        .maybeSingle();

    const rawLoginId = loginId.trim().toLowerCase();
    const normalizedEmail = rawLoginId.includes('@') ? rawLoginId : `${rawLoginId}@eduvision.school`;

    let authUserId: string | null = null;

    // If password provided and service role key is present, provision in Supabase Auth
    if (password && isServiceRoleConfigured()) {
        try {
            const adminClient = createAdminServiceClient();
            const { data: usersData } = await adminClient.auth.admin.listUsers();
            const existingUser = usersData?.users?.find(u => u.email?.toLowerCase() === normalizedEmail);

            if (existingUser) {
                authUserId = existingUser.id;
                await adminClient.auth.admin.updateUserById(existingUser.id, {
                    password: password,
                    user_metadata: {
                        teacher_name: name.trim(),
                        teacher_login_id: rawLoginId,
                        school_id: String(schoolId),
                        school_name: school?.school_name || '',
                        school_code: school?.school_code || '',
                        role: role
                    },
                    app_metadata: {
                        role: role
                    }
                });
            } else {
                const { data: newAuth, error: authError } = await adminClient.auth.admin.createUser({
                    email: normalizedEmail,
                    password: password,
                    email_confirm: true,
                    user_metadata: {
                        teacher_name: name.trim(),
                        teacher_login_id: rawLoginId,
                        school_id: String(schoolId),
                        school_name: school?.school_name || '',
                        school_code: school?.school_code || '',
                        role: role
                    },
                    app_metadata: {
                        role: role
                    }
                });

                if (authError) {
                    console.error("Warning: Error creating auth user for teacher:", authError);
                } else if (newAuth?.user) {
                    authUserId = newAuth.user.id;
                }
            }
        } catch (authErr) {
            console.error("Admin user provisioning error:", authErr);
        }
    }

    const { data: inserted, error } = await supabase
        .from('teachers')
        .insert({
            school_id: schoolId,
            teacher_name: name.trim(),
            teacher_login_id: rawLoginId,
            role: role,
            auth_user_id: authUserId,
            is_active: true
        })
        .select()
        .single();

    if (error) throw error;
    return {
        ...inserted,
        auth_created: Boolean(authUserId)
    };
}

export async function setTeacherPassword(teacherId: string, teacherLoginId: string, newPassword: string) {
    const isAdmin = await checkIsSchoolAdmin();
    if (!isAdmin) {
        throw new Error("Unauthorized: Only a school administrator can manage faculty credentials.");
    }
    if (!newPassword || newPassword.length < 6) {
        throw new Error("Password must be at least 6 characters.");
    }

    const supabase = await createClient();
    const schoolId = await getSessionSchoolId(supabase);
    if (!schoolId) throw new Error("Not authenticated");

    const { data: school } = await supabase
        .from('schools')
        .select('school_name, school_code')
        .eq('school_id', schoolId)
        .maybeSingle();

    const { data: teacher } = await supabase
        .from('teachers')
        .select('*')
        .eq('school_id', schoolId)
        .or(`teacher_id.eq.${teacherId},id.eq.${teacherId}`)
        .maybeSingle();

    if (!teacher) throw new Error("Teacher record not found.");

    const rawLoginId = (teacherLoginId || teacher.teacher_login_id).trim().toLowerCase();
    const normalizedEmail = rawLoginId.includes('@') ? rawLoginId : `${rawLoginId}@eduvision.school`;

    const adminClient = createAdminServiceClient();
    let authUserId = teacher.auth_user_id;

    if (!authUserId) {
        const { data: usersData } = await adminClient.auth.admin.listUsers();
        const matched = usersData?.users?.find(u => u.email?.toLowerCase() === normalizedEmail);
        if (matched) authUserId = matched.id;
    }

    if (authUserId) {
        const { error } = await adminClient.auth.admin.updateUserById(authUserId, {
            password: newPassword,
            user_metadata: {
                teacher_name: teacher.teacher_name,
                teacher_login_id: rawLoginId,
                school_id: String(schoolId),
                school_name: school?.school_name || '',
                school_code: school?.school_code || '',
                role: teacher.role
            },
            app_metadata: {
                role: teacher.role
            }
        });
        if (error) throw error;
    } else {
        const { data: newAuth, error: createError } = await adminClient.auth.admin.createUser({
            email: normalizedEmail,
            password: newPassword,
            email_confirm: true,
            user_metadata: {
                teacher_name: teacher.teacher_name,
                teacher_login_id: rawLoginId,
                school_id: String(schoolId),
                school_name: school?.school_name || '',
                school_code: school?.school_code || '',
                role: teacher.role
            },
            app_metadata: {
                role: teacher.role
            }
        });
        if (createError) throw createError;
        if (newAuth?.user) {
            authUserId = newAuth.user.id;
        }
    }

    // Update teacher record with auth_user_id
    const { error: updateError } = await supabase
        .from('teachers')
        .update({ auth_user_id: authUserId })
        .eq('school_id', schoolId)
        .or(`teacher_id.eq.${teacherId},id.eq.${teacherId}`);

    if (updateError) throw updateError;
}
