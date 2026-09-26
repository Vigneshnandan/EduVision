'use server'

import { createAdminServiceClient } from "@/lib/supabase-service"
import { logAdminAction } from "@/lib/admin-audit"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

export interface SchoolExportPayload {
    exported_at: string;
    export_reason: string;
    school: any;
    classes: any[];
    teachers: any[];
    attendance_records: any[];
    holidays: any[];
}

export async function exportSchoolDataAction(schoolId: string): Promise<SchoolExportPayload> {
    const supabase = createAdminServiceClient()

    // 1. Fetch School
    const { data: school } = await supabase
        .from('schools')
        .select('*')
        .eq('school_id', schoolId)
        .single()

    // 2. Fetch Classes
    const { data: classes } = await supabase
        .from('classes')
        .select('*')
        .eq('school_id', schoolId)

    // 3. Fetch Teachers
    const { data: teachers } = await supabase
        .from('teachers')
        .select('*')
        .eq('school_id', schoolId)

    // 4. Fetch Attendance Logs
    const { data: attendance } = await supabase
        .from('attendance')
        .select('*')
        .eq('school_id', schoolId)
        .order('date', { ascending: false })

    // 5. Fetch School Holidays
    const { data: holidays } = await supabase
        .from('school_holidays')
        .select('*')
        .eq('school_id', schoolId)

    await logAdminAction({
        action: 'school_data_exported',
        targetType: 'school',
        targetId: schoolId,
        details: {
            school_name: school?.school_name,
            records_count: attendance?.length || 0,
            classes_count: classes?.length || 0,
            teachers_count: teachers?.length || 0
        }
    })

    return {
        exported_at: new Date().toISOString(),
        export_reason: 'Data Subject Privacy Request / Institutional Export',
        school,
        classes: classes || [],
        teachers: teachers || [],
        attendance_records: attendance || [],
        holidays: holidays || []
    }
}

export async function purgeSchoolDataAction(
    schoolId: string,
    confirmCode: string,
    expectedCode: string
) {
    if (confirmCode.trim().toUpperCase() !== expectedCode.trim().toUpperCase()) {
        throw new Error(`Confirmation mismatch: Please enter exact school code "${expectedCode}" to confirm permanent purge.`)
    }

    const supabase = createAdminServiceClient()

    // 1. Delete Attendance Logs
    const { count: attendanceDeleted } = await supabase
        .from('attendance')
        .delete({ count: 'exact' })
        .eq('school_id', schoolId)

    // 2. Delete Classes
    await supabase
        .from('classes')
        .delete()
        .eq('school_id', schoolId)

    // 3. Delete School Holidays
    await supabase
        .from('school_holidays')
        .delete()
        .eq('school_id', schoolId)

    // 4. Update school status or remove
    await supabase
        .from('schools')
        .delete()
        .eq('school_id', schoolId)

    await logAdminAction({
        action: 'school_data_permanently_purged',
        targetType: 'school',
        targetId: schoolId,
        details: {
            school_code: expectedCode,
            attendance_rows_deleted: attendanceDeleted || 0,
            legal_basis: 'Data Subject Access Request / GDPR Right to Erasure / Tenant Offboarding'
        }
    })

    revalidatePath('/admin/schools')
    revalidatePath('/admin')
    revalidatePath('/admin/teachers')
    redirect('/admin/schools')
}
