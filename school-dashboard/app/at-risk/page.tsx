import { RiskList } from '@/components/RiskList'
import { getAtRiskStudents } from '@/lib/analytics'

export default async function AtRiskPage() {
    const atRiskData = await getAtRiskStudents()
    return (
        <div className="p-6">
            <h1 className="text-2xl font-bold mb-4">At-Risk Students</h1>
            <RiskList data={atRiskData} />
        </div>
    )
}
