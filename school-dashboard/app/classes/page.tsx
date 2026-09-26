import { getClassesWithDetails } from '@/lib/classes'
import { getClassAnalytics } from '@/lib/analytics'
import { ClassesClient } from './ClassesClient'
import { ClassBreakdown } from '@/components/ClassBreakdown'

export default async function ClassesPage() {
    const [{ classes, teachers }, classAnalytics] = await Promise.all([
        getClassesWithDetails(),
        getClassAnalytics()
    ])

    return (
        <div className="p-8 space-y-8 bg-slate-50 min-h-screen">
            <div>
                <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Classes & Teachers</h1>
                <p className="text-slate-500 mt-1">Institutional academic structures, assigned educators, and attendance performance.</p>
            </div>

            {/* Class Directory & Teacher Assignment Management */}
            <ClassesClient initialClasses={classes} teachers={teachers} />

            {/* Attendance Performance Breakdown */}
            <div className="pt-4">
                <ClassBreakdown data={classAnalytics} />
            </div>
        </div>
    )
}
