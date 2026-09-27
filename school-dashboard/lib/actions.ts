'use server'

import { createClient } from '@/lib/supabase-server'
import { getClassAnalytics } from '@/lib/analytics'
import { calculateMDMStats, MDMStats } from '@/lib/mdm-utils'
import { getSessionSchoolId } from './students'

function getTodayTimestamp() {
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    return date.getTime();
}

export interface MDMData extends MDMStats {
    isSaved: boolean;
    reportDate?: number;
}

export async function fetchMDMStats(): Promise<MDMData> {
    const supabase = await createClient()
    const schoolId = await getSessionSchoolId(supabase)
    if (!schoolId) throw new Error('No school id found')

    const todayTs = getTodayTimestamp();

    const { data: existingReport, error } = await supabase
        .from('mdm_daily_registers')
        .select('*')
        .eq('school_id', schoolId)
        .eq('report_date', todayTs)
        .single()

    if (existingReport) {
        return {
            primary: {
                label: 'Primary (1-5)',
                enrolled: 0,
                present: 0,
                served: existingReport.primary_count,
                grainEntitlementKg: 0
            },
            upperPrimary: {
                label: 'Upper Primary (6-8)',
                enrolled: 0,
                present: 0,
                served: existingReport.upper_primary_count,
                grainEntitlementKg: 0
            },
            totalRiceKg: Number(existingReport.rice_used_kg),
            totalDalKg: 0,
            isSaved: true,
            reportDate: existingReport.report_date
        }
    }

    const classAnalytics = await getClassAnalytics()
    const stats = calculateMDMStats(classAnalytics)
    return { ...stats, isSaved: false }
}

export async function saveMDMReport(stats: MDMStats) {
    const supabase = await createClient()
    const schoolId = await getSessionSchoolId(supabase)
    if (!schoolId) throw new Error('No school id found')

    const todayTs = getTodayTimestamp();

    const { error } = await supabase
        .from('mdm_daily_registers')
        .upsert({
            school_id: schoolId,
            report_date: todayTs,
            primary_count: stats.primary.served,
            upper_primary_count: stats.upperPrimary.served,
            rice_used_kg: stats.totalRiceKg,
            wheat_used_kg: 0
        }, { onConflict: 'report_date, school_id' })

    if (error) {
        console.error("Error saving MDM Report", error)
        throw error
    }
}

export async function logStudentIntervention(studentId: string, action: string) {
    const supabase = await createClient()
    const { error } = await supabase
        .from('student_intervention_logs')
        .insert({
            student_id: Number(studentId),
            risk_reason: 'Attendance < threshold',
            action_taken: action
        })

    if (error) {
        console.error("Error logging intervention", error)
        throw error
    }
}

export async function fetchAtRiskAlertAction() {
    const { getAtRiskStudents } = await import('@/lib/analytics')
    return await getAtRiskStudents()
}
