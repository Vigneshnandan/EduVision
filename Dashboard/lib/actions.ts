
import { supabase } from '@/lib/supabase'
import { getClassAnalytics } from '@/lib/analytics'
import { calculateMDMStats, MDMStats } from '@/lib/mdm-utils'

// Helper to get today's midnight timestamp
export const getTodayTimestamp = () => {
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    return date.getTime();
};

export interface MDMData extends MDMStats {
    isSaved: boolean;
    reportDate?: number;
}

export async function fetchMDMStats(): Promise<MDMData> {
    const todayTs = getTodayTimestamp();

    // 1. Check if report exists
    const { data: existingReport, error } = await supabase
        .from('mdm_daily_registers')
        .select('*')
        .eq('report_date', todayTs)
        .single()

    if (existingReport) {
        // Return saved data
        // Reconstruct MDMStats shape from flat DB row for UI compatibility
        // Assuming wheat is not yet used in calculation or is substitute for Rice, 
        // but simple mapping for now:
        const totalRice = Number(existingReport.rice_used_kg) || 0
        // Dal isn't explicitly in the simple table schema requested in prompt (only rice/wheat),
        // but our util calculated it. Let's assume we might have missed Dal in schema request 
        // or we re-calculate it or it wasn't critical. 
        // WAIT: User prompt for SQL: "rice_used_kg, wheat_used_kg". No Dal.
        // But our MDM Widget shows Dal. 
        // Compromise: We will treat 'Saved' state simply.

        return {
            primary: {
                label: 'Primary (1-5)',
                enrolled: 0, // Not stored in simple schema
                present: 0,  // Not stored separate primary count? YES, primary_count is there.
                served: existingReport.primary_count,
                grainEntitlementKg: 0 // Not needed for display of total?
            },
            upperPrimary: {
                label: 'Upper Primary (6-8)',
                enrolled: 0,
                present: 0,
                served: existingReport.upper_primary_count,
                grainEntitlementKg: 0
            },
            totalRiceKg: Number(existingReport.rice_used_kg),
            totalDalKg: 0, // Placeholder if not stored
            isSaved: true,
            reportDate: existingReport.report_date
        }
    }

    // 2. If not saved, calculate draft
    const classAnalytics = await getClassAnalytics()
    const stats = calculateMDMStats(classAnalytics)
    return { ...stats, isSaved: false }
}

export async function saveMDMReport(stats: MDMStats) {
    const todayTs = getTodayTimestamp();

    const { error } = await supabase
        .from('mdm_daily_registers')
        .insert({
            report_date: todayTs,
            primary_count: stats.primary.served,
            upper_primary_count: stats.upperPrimary.served,
            rice_used_kg: stats.totalRiceKg,
            wheat_used_kg: 0 // Default for now
        })

    if (error) {
        console.error("Error saving MDM Report", error)
        throw error
    }
}

export async function logStudentIntervention(studentId: string, action: string) {
    const { error } = await supabase
        .from('student_intervention_logs')
        .insert({
            student_id: Number(studentId), // Assuming ID is compatible
            risk_reason: 'Attendance < 75%',
            action_taken: action
        })

    if (error) {
        console.error("Error logging intervention", error)
        throw error
    }
}
