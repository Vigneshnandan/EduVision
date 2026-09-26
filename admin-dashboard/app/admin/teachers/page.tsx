import { getAllPlatformTeachers } from "@/lib/admin-teachers"
import { PlatformTeachersClient } from "./PlatformTeachersClient"

export const metadata = {
    title: "Master Teacher Roster — Platform Governance",
    description: "Cross-school teacher directory with platform-wide activation and credentials management."
}

export const revalidate = 0

export default async function AdminTeachersPage() {
    const { teachers, schools } = await getAllPlatformTeachers()

    return (
        <PlatformTeachersClient
            initialTeachers={teachers}
            schools={schools}
        />
    )
}
