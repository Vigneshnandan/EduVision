import { getSchoolTeachers } from '@/lib/teachers'
import { TeachersClient } from './TeachersClient'

export default async function TeachersPage() {
    const { teachers, isSchoolAdmin } = await getSchoolTeachers()

    return (
        <div className="p-8 space-y-8 bg-slate-50 min-h-screen">
            <div>
                <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Faculty & Teachers</h1>
                <p className="text-slate-500 mt-1">Manage institutional educator accounts, app access permissions, and roles.</p>
            </div>

            <TeachersClient initialTeachers={teachers} isSchoolAdmin={isSchoolAdmin} />
        </div>
    )
}
