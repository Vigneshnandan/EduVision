"use client"

import { useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { SchoolDrilldownSummary } from "@/lib/admin-drilldown"
import { ClassBreakdown } from "@/components/ClassBreakdown"
import { MonthlyRegisterTable } from "@/components/MonthlyRegisterTable"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
    Building2,
    GraduationCap,
    Users,
    Activity,
    Layers,
    FileSpreadsheet,
    Calendar,
    ChevronLeft,
    ChevronRight,
    CheckCircle2,
    Clock,
    AlertOctagon,
    Filter,
    Mail,
    Phone,
    CalendarDays
} from "lucide-react"

interface SchoolDrillDownClientProps {
    schools: Array<{ school_id: string; school_name: string; school_code: string; status: string }>;
    selectedSchoolId: string;
    drilldownData: SchoolDrilldownSummary;
    currentMonth: number;
    currentYear: number;
    selectedClass: string;
}

const MONTH_NAMES = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
]

export function SchoolDrillDownClient({
    schools,
    selectedSchoolId,
    drilldownData,
    currentMonth,
    currentYear,
    selectedClass
}: SchoolDrillDownClientProps) {
    const router = useRouter()
    const [activeTab, setActiveTab] = useState<"overview" | "register">("overview")

    const handleSchoolChange = (newSchoolId: string) => {
        router.push(`/admin/drill-down?school_id=${newSchoolId}&month=${currentMonth}&year=${currentYear}&class=All`)
    }

    const handleClassChange = (newClass: string) => {
        router.push(`/admin/drill-down?school_id=${selectedSchoolId}&month=${currentMonth}&year=${currentYear}&class=${encodeURIComponent(newClass)}`)
    }

    const handleMonthChange = (newMonth: number, newYear: number) => {
        router.push(`/admin/drill-down?school_id=${selectedSchoolId}&month=${newMonth}&year=${newYear}&class=${encodeURIComponent(selectedClass)}`)
    }

    const prevMonth = currentMonth === 0 ? 11 : currentMonth - 1
    const prevYear = currentMonth === 0 ? currentYear - 1 : currentYear
    const nextMonth = currentMonth === 11 ? 0 : currentMonth + 1
    const nextYear = currentMonth === 11 ? currentYear + 1 : currentYear

    const school = drilldownData.school

    return (
        <div className="space-y-6">
            {/* Header & School Selector Bar */}
            <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-5">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-blue-100 text-blue-800 border border-blue-200">
                                Institutional Inspector
                            </span>
                            <span className="text-xs text-slate-500 font-medium">
                                Cross-School Read-Only Drilldown
                            </span>
                        </div>
                        <h1 className="text-2xl font-black text-slate-900 tracking-tight mt-1 flex items-center gap-2">
                            <Building2 className="h-6 w-6 text-blue-600" />
                            {school?.school_name || "Select an Institution"}
                        </h1>
                        <p className="text-xs text-slate-500 mt-0.5">
                            Examining live attendance records and Form 9A register without requiring school teacher login credentials.
                        </p>
                    </div>

                    {/* School Selector Dropdown */}
                    <div className="flex items-center gap-3">
                        <label className="text-xs font-bold text-slate-600 uppercase tracking-wider shrink-0">
                            Switch School:
                        </label>
                        <select
                            value={selectedSchoolId}
                            onChange={(e) => handleSchoolChange(e.target.value)}
                            aria-label="Switch School"
                            className="bg-slate-50 border border-slate-300 text-slate-900 text-sm font-semibold rounded-lg px-3.5 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none min-w-[240px]"
                        >
                            {schools.map((s) => (
                                <option key={s.school_id} value={s.school_id}>
                                    {s.school_name} ({s.school_code}) — {s.status.toUpperCase()}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* School Metadata Strip */}
                {school && (
                    <div className="pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-4 text-xs text-slate-600">
                        <div className="flex flex-wrap items-center gap-4">
                            <div className="flex items-center gap-1.5">
                                <span className="font-semibold text-slate-500">Code:</span>
                                <span className="font-mono bg-slate-100 px-2 py-0.5 rounded text-slate-800 font-bold">
                                    {school.school_code}
                                </span>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <span className="font-semibold text-slate-500">Status:</span>
                                {school.status === 'active' && (
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                        <CheckCircle2 className="h-3 w-3" /> Active
                                    </span>
                                )}
                                {school.status === 'trial' && (
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                                        <Clock className="h-3 w-3" /> Trial
                                    </span>
                                )}
                                {school.status === 'suspended' && (
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-red-50 text-red-700 border border-red-200">
                                        <AlertOctagon className="h-3 w-3" /> Suspended
                                    </span>
                                )}
                            </div>
                            <div className="flex items-center gap-1.5">
                                <span className="font-semibold text-slate-500">Plan:</span>
                                {school.plan_tier === 'paid' ? (
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                        Paid Tier
                                        {school.plan_renews_at && (
                                            <span className="font-normal text-slate-500 ml-1">({school.plan_renews_at})</span>
                                        )}
                                    </span>
                                ) : (
                                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-600 border border-slate-200">
                                        Free Tier
                                    </span>
                                )}
                            </div>
                            {school.contact_email && (
                                <div className="flex items-center gap-1">
                                    <Mail className="h-3.5 w-3.5 text-slate-400" />
                                    <span>{school.contact_email}</span>
                                </div>
                            )}
                            {school.contact_phone && (
                                <div className="flex items-center gap-1">
                                    <Phone className="h-3.5 w-3.5 text-slate-400" />
                                    <span>{school.contact_phone}</span>
                                </div>
                            )}
                        </div>

                        <div className="flex items-center gap-2">
                            <Button
                                size="sm"
                                variant={activeTab === "overview" ? "default" : "outline"}
                                onClick={() => setActiveTab("overview")}
                                className={activeTab === "overview" ? "bg-blue-600 text-xs" : "text-xs"}
                            >
                                <Layers className="h-3.5 w-3.5 mr-1.5" /> Class Breakdown
                            </Button>
                            <Button
                                size="sm"
                                variant={activeTab === "register" ? "default" : "outline"}
                                onClick={() => setActiveTab("register")}
                                className={activeTab === "register" ? "bg-blue-600 text-xs" : "text-xs"}
                            >
                                <FileSpreadsheet className="h-3.5 w-3.5 mr-1.5" /> Monthly Register
                            </Button>
                        </div>
                    </div>
                )}
            </div>

            {/* Quick Metrics Strip */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="bg-white border-slate-200 shadow-sm">
                    <CardContent className="p-4 flex items-center justify-between">
                        <div>
                            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Enrolled Students</p>
                            <h4 className="text-2xl font-black text-slate-900 mt-1">{drilldownData.totalStudents}</h4>
                            <p className="text-[11px] text-slate-400 mt-0.5">Recorded in school roster</p>
                        </div>
                        <div className="h-10 w-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                            <GraduationCap className="h-5 w-5" />
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-white border-slate-200 shadow-sm">
                    <CardContent className="p-4 flex items-center justify-between">
                        <div>
                            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Attendance Rate</p>
                            <h4 className="text-2xl font-black text-slate-900 mt-1">{drilldownData.attendanceRate}%</h4>
                            <p className="text-[11px] text-emerald-600 font-medium mt-0.5">30-day baseline</p>
                        </div>
                        <div className="h-10 w-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                            <Activity className="h-5 w-5" />
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-white border-slate-200 shadow-sm">
                    <CardContent className="p-4 flex items-center justify-between">
                        <div>
                            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Active Classes</p>
                            <h4 className="text-2xl font-black text-slate-900 mt-1">{drilldownData.classes.length}</h4>
                            <p className="text-[11px] text-slate-400 mt-0.5">Configured cohorts</p>
                        </div>
                        <div className="h-10 w-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                            <Layers className="h-5 w-5" />
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-white border-slate-200 shadow-sm">
                    <CardContent className="p-4 flex items-center justify-between">
                        <div>
                            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Form 9A Roster</p>
                            <h4 className="text-2xl font-black text-slate-900 mt-1">{drilldownData.monthlyRegister.length}</h4>
                            <p className="text-[11px] text-slate-400 mt-0.5">{MONTH_NAMES[currentMonth]} {currentYear}</p>
                        </div>
                        <div className="h-10 w-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                            <FileSpreadsheet className="h-5 w-5" />
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* TAB 1: Class Breakdown */}
            {activeTab === "overview" && (
                <div className="space-y-6">
                    <Card className="border-slate-200 shadow-sm">
                        <CardHeader className="bg-white border-b pb-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <CardTitle className="text-lg font-bold text-slate-900">
                                        Class Cohort Performance Breakdown
                                    </CardTitle>
                                    <CardDescription className="text-xs">
                                        Aggregated 30-day attendance metrics and manual correction count per class.
                                    </CardDescription>
                                </div>
                                <span className="text-xs font-semibold text-slate-500">
                                    {drilldownData.classAnalytics.length} Classes Monitored
                                </span>
                            </div>
                        </CardHeader>
                        <CardContent className="p-6">
                            {drilldownData.classAnalytics.length > 0 ? (
                                <ClassBreakdown data={drilldownData.classAnalytics} />
                            ) : (
                                <div className="text-center py-12 text-slate-400">
                                    <Layers className="h-10 w-10 mx-auto text-slate-300 mb-2" />
                                    <p className="font-semibold text-slate-600 text-sm">No class logs recorded</p>
                                    <p className="text-xs text-slate-400 mt-1">This school has not submitted attendance logs for any class yet.</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* TAB 2: Monthly Attendance Register (Form 9A) */}
            {activeTab === "register" && (
                <div className="space-y-6">
                    {/* Register Controls Toolbar */}
                    <Card className="border-slate-200 shadow-sm">
                        <CardContent className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                            {/* Month Navigator */}
                            <div className="flex items-center gap-3">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleMonthChange(prevMonth, prevYear)}
                                    className="h-8 text-xs border-slate-300"
                                >
                                    <ChevronLeft className="h-3.5 w-3.5 mr-1" /> {MONTH_NAMES[prevMonth]}
                                </Button>
                                <span className="text-sm font-bold text-slate-900 px-2 flex items-center gap-1.5">
                                    <Calendar className="h-4 w-4 text-blue-600" />
                                    {MONTH_NAMES[currentMonth]} {currentYear}
                                </span>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleMonthChange(nextMonth, nextYear)}
                                    className="h-8 text-xs border-slate-300"
                                >
                                    {MONTH_NAMES[nextMonth]} <ChevronRight className="h-3.5 w-3.5 ml-1" />
                                </Button>
                            </div>

                            {/* Class Filter Dropdown */}
                            <div className="flex items-center gap-2">
                                <Filter className="h-4 w-4 text-slate-400" />
                                <span className="text-xs font-semibold text-slate-600">Filter Class:</span>
                                <select
                                    value={selectedClass}
                                    onChange={(e) => handleClassChange(e.target.value)}
                                    aria-label="Filter Class"
                                    className="bg-slate-50 border border-slate-300 text-slate-800 text-xs font-medium rounded-md px-3 py-1.5 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                >
                                    <option value="All">All Classes</option>
                                    {drilldownData.classes.map((c) => (
                                        <option key={c} value={c}>
                                            Class {c}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Official Monthly Register Table */}
                    <div className="overflow-x-auto">
                        <MonthlyRegisterTable
                            data={drilldownData.monthlyRegister}
                            month={currentMonth}
                            year={currentYear}
                            daysInMonth={drilldownData.daysInMonth}
                        />
                    </div>
                </div>
            )}
        </div>
    )
}
