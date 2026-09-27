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

    return {
        ...school,
        plan_tier: school.plan_tier || 'free',
        plan_renews_at: school.plan_renews_at || null,
        teacher_count: teacherCount || 0,
        class_count: classCount || 0,
        student_count: studentIds.size,
        last_activity: maxDate ? new Date(maxDate).toLocaleDateString() : null
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

    try {
        const { data, error } = await supabase
            .from('schools')
            .insert(payload)
            .select()
            .single()

        if (error) throw error
        return data
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
            return data
        }
        throw insertErr
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
