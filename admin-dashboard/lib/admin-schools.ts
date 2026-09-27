import { createAdminServiceClient } from "@/lib/supabase-service"

export interface SchoolDirectoryItem {
    school_id: string;
    school_name: string;
    school_code: string;
    status: 'trial' | 'active' | 'suspended';
    plan_tier: 'free' | 'paid';
    plan_renews_at?: string | null;
    address?: string | null;
    contact_email?: string | null;
    contact_phone?: string | null;
    teacher_count: number;
    student_count: number;
    last_activity?: string | null;
    onboarded_at?: string | null;
}

export function generateSchoolCode(schoolName: string): string {
    const clean = schoolName.replace(/[^a-zA-Z0-9]/g, '').toUpperCase().slice(0, 4)
    const prefix = clean.length >= 2 ? clean : 'SCH'
    const randomDigits = Math.floor(1000 + Math.random() * 9000)
    return `${prefix}-${randomDigits}`
}

export async function getAllSchoolsDirectory(): Promise<SchoolDirectoryItem[]> {
    const supabase = createAdminServiceClient()

    const { data: schools, error: schoolErr } = await supabase
        .from('schools')
        .select('*')
        .order('school_name', { ascending: true })

    if (schoolErr || !schools) {
        console.error("Error fetching schools directory:", schoolErr)
        return []
    }

    const { data: teachers } = await supabase
        .from('teachers')
        .select('school_id')

    const teacherCountMap: Record<string, number> = {}
    teachers?.forEach((t: any) => {
        if (t.school_id) {
            const sid = String(t.school_id)
            teacherCountMap[sid] = (teacherCountMap[sid] || 0) + 1
        }
    })

    const { data: attendance } = await supabase
        .from('attendance')
        .select('school_id, student_id, date, timestamp')

    const studentSetMap: Record<string, Set<string>> = {}
    const lastActivityMap: Record<string, number> = {}

    attendance?.forEach((a: any) => {
        if (a.school_id) {
            const sid = String(a.school_id)
            if (!studentSetMap[sid]) studentSetMap[sid] = new Set()
            studentSetMap[sid].add(String(a.student_id))

            const ts = Number(a.date || a.timestamp || 0)
            if (ts > (lastActivityMap[sid] || 0)) {
                lastActivityMap[sid] = ts
            }
        }
    })

    return schools.map((s: any) => {
        const sid = String(s.school_id)
        const lastTs = lastActivityMap[sid]
        return {
            school_id: sid,
            school_name: s.school_name || 'Unnamed School',
            school_code: s.school_code || 'N/A',
            status: (s.status as any) || 'trial',
            plan_tier: (s.plan_tier as any) || 'free',
            plan_renews_at: s.plan_renews_at || null,
            address: s.address || null,
            contact_email: s.contact_email || null,
            contact_phone: s.contact_phone || null,
            teacher_count: teacherCountMap[sid] || 0,
            student_count: studentSetMap[sid]?.size || 0,
            last_activity: lastTs ? new Date(lastTs).toLocaleDateString() : null,
            onboarded_at: s.onboarded_at || s.created_at || null
        }
    })
}

export async function getSchoolDetail(schoolId: string) {
    const supabase = createAdminServiceClient()

    const { data: school, error } = await supabase
        .from('schools')
        .select('*')
        .eq('school_id', schoolId)
        .maybeSingle()

    if (error || !school) return null

    const { count: teacherCount } = await supabase
        .from('teachers')
        .select('*', { count: 'exact', head: true })
        .eq('school_id', schoolId)

    const { count: classCount } = await supabase
        .from('classes')
        .select('*', { count: 'exact', head: true })
        .eq('school_id', schoolId)

    const { data: attendanceLogs } = await supabase
        .from('attendance')
        .select('student_id, date, timestamp')
        .eq('school_id', schoolId)

    const studentIds = new Set<string>()
    let maxDate = 0
    attendanceLogs?.forEach((a: any) => {
        studentIds.add(String(a.student_id))
        const d = Number(a.date || a.timestamp || 0)
        if (d > maxDate) maxDate = d
    })

    const { data: adminTeacher } = await supabase
        .from('teachers')
        .select('teacher_name, teacher_login_id, auth_user_id, role, is_active')
        .eq('school_id', schoolId)
        .eq('role', 'school_admin')
        .order('created_at', { ascending: true })
        .limit(1)
        .maybeSingle()

    return {
        ...school,
        plan_tier: school.plan_tier || 'free',
        plan_renews_at: school.plan_renews_at || null,
        teacher_count: teacherCount || 0,
        class_count: classCount || 0,
        student_count: studentIds.size,
        last_activity: maxDate ? new Date(maxDate).toLocaleDateString() : null,
        admin_teacher: adminTeacher || null
    }
}

export async function registerSchoolRecord(formData: {
    school_name: string;
    school_code?: string;
    address?: string;
    contact_email?: string;
    contact_phone?: string;
    status?: 'trial' | 'active' | 'suspended';
    plan_tier?: 'free' | 'paid';
    plan_renews_at?: string;
    admin_name?: string;
    admin_email?: string;
    admin_password?: string;
}) {
    const supabase = createAdminServiceClient()

    let code = formData.school_code?.trim()
    if (!code) {
        code = generateSchoolCode(formData.school_name)
    }

    const payload: any = {
        school_name: formData.school_name.trim(),
        school_code: code,
        address: formData.address?.trim() || null,
        contact_email: formData.contact_email?.trim() || null,
        contact_phone: formData.contact_phone?.trim() || null,
        status: formData.status || 'trial'
    }

    if (formData.plan_tier) payload.plan_tier = formData.plan_tier
    if (formData.plan_renews_at) payload.plan_renews_at = formData.plan_renews_at

    let newSchool: any
    try {
        const { data, error } = await supabase
            .from('schools')
            .insert(payload)
            .select()
            .single()

        if (error) throw error
        newSchool = data
    } catch (insertErr: any) {
        // If column plan_tier does not exist in db yet, retry without commercial columns
        if (insertErr.code === '42703' || insertErr.message?.includes('plan_tier')) {
            delete payload.plan_tier
            delete payload.plan_renews_at
            const { data, error } = await supabase
                .from('schools')
                .insert(payload)
                .select()
                .single()
            if (error) throw error
            newSchool = data
        } else {
            throw insertErr
        }
    }

    // Provision Initial School Administrator Account in Supabase Auth & teachers table
    if (formData.admin_email && formData.admin_password && newSchool) {
        try {
            const rawEmail = formData.admin_email.trim().toLowerCase()
            const normalizedEmail = rawEmail.includes('@') ? rawEmail : `${rawEmail}@eduvision.school`
            const adminName = (formData.admin_name || `${newSchool.school_name} Administrator`).trim()

            let authUserId: string | null = null

            // Check if user already exists in auth.users
            const { data: usersData } = await supabase.auth.admin.listUsers()
            const existingUser = usersData?.users?.find(u => u.email?.toLowerCase() === normalizedEmail)

            if (existingUser) {
                authUserId = existingUser.id
                await supabase.auth.admin.updateUserById(existingUser.id, {
                    password: formData.admin_password,
                    user_metadata: {
                        teacher_name: adminName,
                        teacher_login_id: rawEmail,
                        school_id: String(newSchool.school_id),
                        school_code: newSchool.school_code,
                        school_name: newSchool.school_name,
                        role: 'school_admin'
                    },
                    app_metadata: {
                        role: 'school_admin'
                    }
                })
            } else {
                const { data: newAuth, error: authError } = await supabase.auth.admin.createUser({
                    email: normalizedEmail,
                    password: formData.admin_password,
                    email_confirm: true,
                    user_metadata: {
                        teacher_name: adminName,
                        teacher_login_id: rawEmail,
                        school_id: String(newSchool.school_id),
                        school_code: newSchool.school_code,
                        school_name: newSchool.school_name,
                        role: 'school_admin'
                    },
                    app_metadata: {
                        role: 'school_admin'
                    }
                })

                if (authError) {
                    console.error("Warning: Error creating school admin auth user:", authError)
                } else if (newAuth?.user) {
                    authUserId = newAuth.user.id
                }
            }

            // Upsert / Insert into public.teachers
            const { error: teacherError } = await supabase
                .from('teachers')
                .insert({
                    school_id: newSchool.school_id,
                    teacher_name: adminName,
                    teacher_login_id: rawEmail,
                    role: 'school_admin',
                    auth_user_id: authUserId,
                    is_active: true
                })

            if (teacherError) {
                console.error("Warning: Could not create teacher record for school admin:", teacherError)
            }
        } catch (err) {
            console.error("Error setting up initial school admin:", err)
        }
    }

    return newSchool
}

export async function resetSchoolAdminPassword(schoolId: string, loginId: string, newPassword: string) {
    const supabase = createAdminServiceClient()
    const rawEmail = loginId.trim().toLowerCase()
    const normalizedEmail = rawEmail.includes('@') ? rawEmail : `${rawEmail}@eduvision.school`

    // Check teacher record
    const { data: teacher } = await supabase
        .from('teachers')
        .select('*')
        .eq('school_id', schoolId)
        .eq('teacher_login_id', rawEmail)
        .maybeSingle()

    let authUserId = teacher?.auth_user_id

    if (!authUserId) {
        const { data: usersData } = await supabase.auth.admin.listUsers()
        const matched = usersData?.users?.find(u => u.email?.toLowerCase() === normalizedEmail)
        if (matched) authUserId = matched.id
    }

    if (authUserId) {
        const { error } = await supabase.auth.admin.updateUserById(authUserId, {
            password: newPassword
        })
        if (error) throw error
    } else {
        const { data: newAuth, error } = await supabase.auth.admin.createUser({
            email: normalizedEmail,
            password: newPassword,
            email_confirm: true,
            user_metadata: {
                teacher_name: teacher?.teacher_name || 'School Administrator',
                teacher_login_id: rawEmail,
                school_id: String(schoolId),
                role: teacher?.role || 'school_admin'
            },
            app_metadata: {
                role: teacher?.role || 'school_admin'
            }
        })
        if (error) throw error
        if (newAuth?.user) {
            await supabase
                .from('teachers')
                .update({ auth_user_id: newAuth.user.id })
                .eq('school_id', schoolId)
                .eq('teacher_login_id', rawEmail)
        }
    }
}

export async function updateSchoolRecord(schoolId: string, formData: {
    school_name: string;
    school_code: string;
    address?: string;
    contact_email?: string;
    contact_phone?: string;
    at_risk_threshold_pct?: number;
}) {
    const supabase = createAdminServiceClient()

    const { error } = await supabase
        .from('schools')
        .update({
            school_name: formData.school_name.trim(),
            school_code: formData.school_code.trim(),
            address: formData.address?.trim() || null,
            contact_email: formData.contact_email?.trim() || null,
            contact_phone: formData.contact_phone?.trim() || null,
            at_risk_threshold_pct: formData.at_risk_threshold_pct ?? 75
        })
        .eq('school_id', schoolId)

    if (error) throw error
}

export async function updateSchoolStatusRecord(schoolId: string, status: 'trial' | 'active' | 'suspended') {
    const supabase = createAdminServiceClient()

    const { error } = await supabase
        .from('schools')
        .update({ status })
        .eq('school_id', schoolId)

    if (error) throw error
}

export async function updateSchoolSubscriptionRecord(
    schoolId: string,
    planTier: 'free' | 'paid',
    planRenewsAt: string | null
) {
    const supabase = createAdminServiceClient()

    try {
        const { error } = await supabase
            .from('schools')
            .update({
                plan_tier: planTier,
                plan_renews_at: planRenewsAt || null
            })
            .eq('school_id', schoolId)

        if (error) throw error
    } catch (err: any) {
        console.warn("Notice: could not update plan_tier/plan_renews_at in DB:", err.message)
        throw err
    }
}
