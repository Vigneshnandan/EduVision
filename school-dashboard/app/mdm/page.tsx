import { MDMReportCard } from '@/components/MDMReportCard'
import { fetchMDMStats } from '@/lib/actions'

export default async function MDMPage() {
    const mdmData = await fetchMDMStats()
    return (
        <div className="p-6">
            <h1 className="text-2xl font-bold mb-4">MDM Report</h1>
            <MDMReportCard stats={mdmData} isSaved={mdmData.isSaved} />
        </div>
    )
}
