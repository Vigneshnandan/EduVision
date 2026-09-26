import { getAllSchoolsForDrilldown, getSchoolDrilldownDetails } from "@/lib/admin-drilldown"
import { SchoolDrillDownClient } from "./SchoolDrillDownClient"
import { Card, CardContent } from "@/components/ui/card"
import { Building2 } from "lucide-react"

export const metadata = {
    title: "Institutional Inspector — Platform Governance",
    description: "Read-only per-school drill-down for class breakdown and official monthly register."
}

export const revalidate = 0

interface DrillDownPageProps {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export default async function AdminDrillDownPage(props: DrillDownPageProps) {
    const searchParams = await props.searchParams
    const schools = await getAllSchoolsForDrilldown()

    if (schools.length === 0) {
        return (
            <div className="p-8">
                <Card className="bg-white border-slate-200">
                    <CardContent className="p-12 text-center text-slate-500">
                        <Building2 className="h-12 w-12 mx-auto text-slate-300 mb-3" />
                        <h3 className="text-lg font-bold text-slate-800">No Registered Institutions</h3>
                        <p className="text-xs text-slate-400 mt-1">Please register a school first to inspect class breakdowns and registers.</p>
                    </CardContent>
                </Card>
            </div>
        )
    }

    const requestedSchoolId = typeof searchParams.school_id === 'string' ? searchParams.school_id : undefined
    const selectedSchoolId = requestedSchoolId && schools.some(s => s.school_id === requestedSchoolId)
        ? requestedSchoolId
        : schools[0].school_id

    const now = new Date()
    const monthParam = typeof searchParams.month === 'string' ? parseInt(searchParams.month) : now.getMonth()
    const yearParam = typeof searchParams.year === 'string' ? parseInt(searchParams.year) : now.getFullYear()
    const selectedClass = typeof searchParams.class === 'string' ? searchParams.class : 'All'

    const month = isNaN(monthParam) ? now.getMonth() : monthParam
    const year = isNaN(yearParam) ? now.getFullYear() : yearParam

    const drilldownData = await getSchoolDrilldownDetails(selectedSchoolId, month, year, selectedClass)

    return (
        <SchoolDrillDownClient
            schools={schools}
            selectedSchoolId={selectedSchoolId}
            drilldownData={drilldownData}
            currentMonth={month}
            currentYear={year}
            selectedClass={selectedClass}
        />
    )
}
