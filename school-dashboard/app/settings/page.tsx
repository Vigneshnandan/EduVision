import { createClient } from '@/lib/supabase-server'
import { getSessionSchoolId } from '@/lib/students'
import { SettingsForm } from './SettingsForm'

export default async function SettingsPage() {
    const supabase = await createClient()
    const schoolId = await getSessionSchoolId(supabase)

    if (!schoolId) {
        return (
            <div className="p-8">
                <p>Not authenticated. Please log in.</p>
            </div>
        )
    }

    const { data: school } = await supabase
        .from('schools')
        .select('*')
        .eq('school_id', schoolId)
        .maybeSingle()

    if (!school) {
        return (
            <div className="p-8">
                <p>School profile not found.</p>
            </div>
        )
    }

    return (
        <div className="p-8 space-y-8 w-full mx-auto">
            <div className="mb-6">
                <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">System Settings</h1>
                <p className="text-slate-500 mt-2">Manage application preferences and school configuration.</p>
            </div>
            <SettingsForm school={school} />
        </div>
    )
}
