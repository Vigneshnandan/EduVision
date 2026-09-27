import { supabase } from "@/lib/supabase";

export interface StudentProfile {
    student_id: string;
    name: string;
    class_name: string;
    // Extended details
    roll_number?: string;
    guardian_name?: string;
    contact_number?: string;
    address?: string;
    blood_group?: string;
}

export async function getAllStudents(): Promise<StudentProfile[]> {
    try {
        // 1. Fetch all unique students from Attendance (The Source of Truth for "Who Exists")
        // Note: This matches our Reports logic.
        const { data: attendanceLogs, error: logError } = await supabase
            .from("attendance")
            .select("student_id, name, class_name")
            .order("class_name", { ascending: true });

        if (logError) throw logError;

        // Dedup in Memory
        const studentMap: Record<string, StudentProfile> = {};
        attendanceLogs?.forEach((log) => {
            // Use latest class if multiple? Or just first seen.
            // ID is unique key.
            if (!studentMap[log.student_id]) {
                studentMap[log.student_id] = {
                    student_id: log.student_id,
                    name: log.name,
                    class_name: log.class_name,
                };
            }
        });

        // 2. Fetch Extended Details
        const { data: details, error: detailError } = await supabase
            .from("student_details")
            .select("*");

        if (detailError && detailError.code !== "42P01") {
            console.warn("Could not fetch details (maybe table missing?)", detailError);
        }

        // 3. Merge
        if (details) {
            details.forEach((d) => {
                if (studentMap[d.student_id]) {
                    studentMap[d.student_id] = {
                        ...studentMap[d.student_id],
                        roll_number: d.roll_number,
                        guardian_name: d.guardian_name,
                        contact_number: d.contact_number,
                        address: d.address,
                        blood_group: d.blood_group,
                    };
                }
            });
        }

        return Object.values(studentMap).sort((a, b) => a.class_name.localeCompare(b.class_name) || a.name.localeCompare(b.name));
    } catch (error) {
        console.error("Error fetching students:", error);
        return [];
    }
}

export async function updateStudentDetails(id: string, details: Partial<StudentProfile>) {
    // Only update the extended table
    const { error } = await supabase
        .from('student_details')
        .upsert({
            student_id: id,
            roll_number: details.roll_number,
            guardian_name: details.guardian_name,
            contact_number: details.contact_number,
            address: details.address,
            blood_group: details.blood_group,
            updated_at: new Date()
        })

    if (error) throw error;
}
