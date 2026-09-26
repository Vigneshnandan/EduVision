import { getSchoolDetail } from "@/lib/admin-schools"
import { SchoolDetailClient } from "./SchoolDetailClient"
import { notFound } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ChevronLeft } from "lucide-react"

export const revalidate = 0

interface SchoolDetailPageProps {
    params: Promise<{ id: string }>
}

export default async function SchoolDetailPage({ params }: SchoolDetailPageProps) {
    const { id } = await params
    const school = await getSchoolDetail(id)

    if (!school) {
        notFound()
    }

    return (
        <div className="p-8 max-w-5xl mx-auto space-y-6">
            <div className="flex items-center justify-between border-b pb-4">
                <div className="flex items-center gap-3">
                    <Link href="/admin/schools">
                        <Button variant="outline" size="icon" className="h-9 w-9">
                            <ChevronLeft className="h-4 w-4" />
                        </Button>
                    </Link>
                    <div>
                        <div className="flex items-center gap-2">
                            <h1 className="text-2xl font-bold text-slate-900">{school.school_name}</h1>
                            <span className="font-mono text-xs px-2 py-0.5 rounded bg-slate-100 font-bold text-slate-700">
                                {school.school_code}
                            </span>
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">
                            Manage institutional configuration, licensing status, and deployment settings.
                        </p>
                    </div>
                </div>
            </div>

            <SchoolDetailClient school={school} />
        </div>
    )
}
