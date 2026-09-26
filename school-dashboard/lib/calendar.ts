import { createClient } from "@/lib/supabase-server";
import { getSessionSchoolId } from "@/lib/students";
import { SchoolHoliday } from "./types";

export async function getSchoolHolidays(year?: number, month?: number): Promise<SchoolHoliday[]> {
    const supabase = await createClient();
    const schoolId = await getSessionSchoolId(supabase);
    if (!schoolId) return [];

    let query = supabase
        .from('school_holidays')
        .select('*')
        .eq('school_id', schoolId)
        .order('holiday_date', { ascending: true });

    if (year && month) {
        const startStr = `${year}-${String(month).padStart(2, '0')}-01`;
        const nextMonth = month === 12 ? 1 : month + 1;
        const nextYear = month === 12 ? year + 1 : year;
        const endStr = `${nextYear}-${String(nextMonth).padStart(2, '0')}-01`;
        query = query.gte('holiday_date', startStr).lt('holiday_date', endStr);
    }

    const { data, error } = await query;
    if (error) {
        console.warn("school_holidays table not found or error:", error.message);
        return [];
    }

    return (data || []).map((h: any) => ({
        holiday_id: h.holiday_id,
        school_id: h.school_id,
        holiday_date: h.holiday_date,
        label: h.label,
        created_at: h.created_at
    }));
}

export async function addSchoolHoliday(dateStr: string, label: string) {
    const supabase = await createClient();
    const schoolId = await getSessionSchoolId(supabase);
    if (!schoolId) throw new Error("Not authenticated");

    const { error } = await supabase
        .from('school_holidays')
        .insert({
            school_id: schoolId,
            holiday_date: dateStr,
            label: label.trim()
        });

    if (error) throw error;
}

export async function deleteSchoolHoliday(holidayId: string) {
    const supabase = await createClient();
    const schoolId = await getSessionSchoolId(supabase);
    if (!schoolId) throw new Error("Not authenticated");

    const { error } = await supabase
        .from('school_holidays')
        .delete()
        .eq('holiday_id', holidayId)
        .eq('school_id', schoolId);

    if (error) throw error;
}
