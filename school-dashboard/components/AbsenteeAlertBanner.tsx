"use client"

import { useEffect, useState } from "react"
import { AtRiskStudent } from "@/lib/types"
import { fetchAtRiskAlertAction } from "@/lib/actions"
import { AlertTriangle, ArrowRight, ShieldAlert, X } from "lucide-react"
import Link from "next/link"

export function AbsenteeAlertBanner() {
    const [atRiskList, setAtRiskList] = useState<AtRiskStudent[]>([])
    const [isDismissed, setIsDismissed] = useState(false)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        async function load() {
            try {
                const data = await fetchAtRiskAlertAction()
                setAtRiskList(data || [])
            } catch (err) {
                console.error("Failed to load at-risk alert banner:", err)
            } finally {
                setLoading(false)
            }
        }
        load()
    }, [])

    if (loading || isDismissed || atRiskList.length === 0) {
        return null
    }

    const criticalCount = atRiskList.filter(s => s.status === 'Critical').length
    const warningCount = atRiskList.length - criticalCount

    return (
        <div className="relative rounded-xl border border-red-200 bg-gradient-to-r from-red-50 via-amber-50 to-red-50 p-4 shadow-sm mb-6 transition-all">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-start gap-3">
                    <div className="h-10 w-10 rounded-xl bg-red-100 flex items-center justify-center shrink-0 text-red-600 mt-0.5">
                        <AlertTriangle className="h-5 w-5 animate-pulse" />
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <h4 className="text-sm font-bold text-red-900">
                                Institutional Dropout & Absentee Warning
                            </h4>
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-600 text-white uppercase tracking-wider">
                                {atRiskList.length} Students At-Risk
                            </span>
                        </div>
                        <p className="text-xs text-red-700 mt-0.5">
                            {criticalCount > 0 && `${criticalCount} critical dropout risk (<60% attendance)`}
                            {criticalCount > 0 && warningCount > 0 && ' and '}
                            {warningCount > 0 && `${warningCount} attendance warning (<75% attendance)`}
                            . Immediate intervention or guardian follow-up recommended.
                        </p>
                        
                        {/* Student pill preview */}
                        <div className="flex flex-wrap gap-1.5 mt-2">
                            {atRiskList.slice(0, 4).map(s => (
                                <span key={s.studentId} className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-md bg-white border border-red-200 text-red-800 shadow-2xs">
                                    <span className="font-semibold">{s.name}</span> ({s.className})
                                    <span className="text-[10px] font-bold text-red-600 ml-1">{s.attendancePct}%</span>
                                </span>
                            ))}
                            {atRiskList.length > 4 && (
                                <span className="text-[11px] font-medium text-red-600 self-center">
                                    +{atRiskList.length - 4} more
                                </span>
                            )}
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
                    <Link
                        href="/at-risk"
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-red-600 text-white hover:bg-red-700 shadow-sm transition-colors"
                    >
                        View Case Register <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                    <button
                        onClick={() => setIsDismissed(true)}
                        className="p-1.5 rounded-md text-red-400 hover:text-red-700 hover:bg-red-100 transition-colors"
                        title="Dismiss banner"
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>
            </div>
        </div>
    )
}
