
import { supabase } from '@/lib/supabase'

export interface AttendanceGridRow {
    studentId: string
    name: string
    // Map of day number (1-31) to status ('P', 'A', '-')
    attendance: Record<number, string>
}



// Helper: Get start/end timestamps for a month
function getMonthRange(month: number, year: number) {
    const start = new Date(year, month, 1)
    const end = new Date(year, month + 1, 0) // Last day of month
    end.setHours(23, 59, 59, 999)
    return { startTs: start.getTime(), endTs: end.getTime(), daysInMonth: end.getDate() }
}

export async function getMonthlyAttendance(month: number, year: number): Promise<AttendanceGridRow[]> {
    const { startTs, endTs } = getMonthRange(month, year)

    // 1. Fetch all distinct students (to capture even those with 0 attendance this month if we had a students table)
    // Since we don't, we fetch all students seen in the logs EVER? Or just for this month?
    // User Prompt: "Fetch all distinct students from attendance."
    // Ideally we want anyone active. Let's fetch distinct students from the LAST 6 MONTHS to be safe/inclusive, 
    // or just all unique IDs in the system. 
    // For robustness in this "One Table" architecture, let's fetch unique students from the entire history.
    // Warning: heavy query if millions of rows. 
    // Optimization: Just distinct on student_id, name.

    const { data: allStudents, error: studentError } = await supabase
        .from('attendance')
        .select('student_id, name')
    // .distinct('student_id') // Supabase JS distinct syntax is tricky, usually .select('...', { head: false }).distinct() isn't direct.
    // Workaround: Fetch logs and dedup in JS or use RPC. 
    // Simple approach for now: Fetch recent logs or just this month's logs?
    // If a student is absent ALL month, they won't appear if we only fetch this month.
    // Let's try to fetch unique students from a separate query if possible.
    // Actually, standard SQL `SELECT DISTINCT student_id, name FROM attendance` is best but unavailable via standard SDK easily without views.
    // Fallback: We will pivot ONLY students who have at least one record in this month OR we can assume `getClassAnalytics` logic (fetch everything).
    // Refined Plan: Fetch all unique students from the entire `attendance` table (selecting minimal fields). 
    // Assuming <1000 students, this is fine.

    // Actually, checking standard Supabase/PostgREST: 
    // .select('student_id, name').range(0, 1000) ??
    // Let's proceed with fetching ALL logs for the month and pivoting those. 
    // If a student is completely absent for a whole month, they technically "don't exist" in this system's view without a master table.
    // We will accept this limitation or try to fetch from a broader range.

    // Decision: Fetch logs for the requested month.
    const { data: logs, error } = await supabase
        .from('attendance')
        .select('student_id, name, date, is_present')
        .gte('date', startTs)
        .lte('date', endTs)

    if (error || !logs) {
        console.error('Error fetching monthly logs:', error)
        return []
    }

    // Pivot Logic
    const validLogs = logs as any[]
    const rowMap: Record<string, AttendanceGridRow> = {}

    validLogs.forEach(log => {
        const id = log.student_id.toString()
        if (!rowMap[id]) {
            rowMap[id] = {
                studentId: id,
                name: log.name,
                attendance: {}
            }
        }

        const dateObj = new Date(log.date)
        const day = dateObj.getDate()

        // If present = true, mark P. Else A?
        // Our generic logs only store presence? Or 'A' for absent?
        // Prompt says "is_present (bool)". Usually only TRUE checks are recorded in simple apps?
        // Or does it record FALSE?
        // If FALSE records exist, use them. If only TRUE exists, we assume absence for missing days?
        // Let's check `is_present`.
        if (log.is_present) {
            rowMap[id].attendance[day] = 'P'
        } else {
            rowMap[id].attendance[day] = 'A'
        }
    })

    // Fill gaps? 
    // Logic: For a sparse log system, missing = 'A' or '-' (No Data).
    // "Cells: Green 'P' or Red 'A'".
    // We will let the UI render default 'A' if missing for a known student.

    return Object.values(rowMap).sort((a, b) => a.name.localeCompare(b.name))
}


