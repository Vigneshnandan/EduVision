import { getAllStudents } from "@/lib/students";
import { StudentsClient } from "./StudentsClient";

export default async function StudentsPage() {
    const students = await getAllStudents();
    return <StudentsClient initialStudents={students} />;
}
