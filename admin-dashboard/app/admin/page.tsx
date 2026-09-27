import { getAdminDashboardStats } from "@/lib/admin-analytics"
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import {
    Building2,
    GraduationCap,
    Users,
    TrendingUp,
    Plus,
    ArrowUpRight,
    Activity,
    Shield,
    CheckCircle2,
    Clock,
    AlertOctagon,
    CalendarCheck,
    Search,
    Layers
} from "lucide-react"

export const metadata = {
    title: "Platform KPIs — State Government Command Portal",
    description: "Central cross-school visibility and aggregate analytics."
}

export const revalidate = 0

export default async function AdminKPIPage() {
    const stats = await getAdminDashboardStats()

    return (
        <div className="space-y-8">
            {/* Executive Platform Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-6">
                <div>
                    <div className="flex items-center gap-2">
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-blue-100 text-blue-800 border border-blue-200">
                            State Government Command Portal
                        </span>
                        <span className="flex items-center gap-1 text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Live Telemetry
                        </span>
                    </div>
                    <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight mt-1">
                        Platform Executive Overview & KPIs
                    </h1>
                    <p className="text-slate-500 text-sm mt-0.5">
                        Consolidated multi-tenant analytics and regulatory status across all affiliated schools.
                    </p>
                </div>
                <div className="flex items-center gap-2.5">
                    <Link href="/admin/drill-down">
                        <Button variant="outline" className="border-slate-300 text-slate-700 hover:bg-slate-100 text-sm shadow-sm">
                            <Layers className="h-4 w-4 mr-1.5 text-blue-600" /> School Inspector
                        </Button>
                    </Link>
                    <Link href="/admin/teachers">
                        <Button variant="outline" className="border-slate-300 text-slate-700 hover:bg-slate-100 text-sm shadow-sm">
                            <Users className="h-4 w-4 mr-1.5 text-blue-600" /> Master Roster
                        </Button>
                    </Link>
                    <Link href="/admin/schools/new">
                        <Button className="bg-blue-600 hover:bg-blue-700 shadow-sm text-sm">
                            <Plus className="h-4 w-4 mr-1.5" /> Register School
                        </Button>
                    </Link>
                </div>
            </div>

            {/* 5.1 Platform Core KPIs Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* 1. Total Schools */}
                <Card className="bg-white border-slate-200 shadow-sm hover:border-slate-300 transition-colors">
                    <CardContent className="p-5 flex items-center justify-between">
                        <div>
                            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Schools</p>
                            <h3 className="text-3xl font-black text-slate-900 mt-1">{stats.totalSchools}</h3>
                            <div className="flex items-center gap-1.5 mt-1.5 text-[11px] font-medium text-slate-600">
                                <span className="text-emerald-600 font-bold">{stats.activeSchools} active</span>
                                <span>•</span>
                                <span className="text-blue-600 font-bold">{stats.trialSchools} trial</span>
                                {stats.suspendedSchools > 0 && (
                                    <>
                                        <span>•</span>
                                        <span className="text-red-600 font-bold">{stats.suspendedSchools} suspended</span>
                                    </>
                                )}
                            </div>
                        </div>
                        <div className="h-12 w-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                            <Building2 className="h-6 w-6" />
                        </div>
                    </CardContent>
                </Card>

                {/* 2. Total Teachers */}
                <Card className="bg-white border-slate-200 shadow-sm hover:border-slate-300 transition-colors">
                    <CardContent className="p-5 flex items-center justify-between">
                        <div>
                            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Teachers</p>
                            <h3 className="text-3xl font-black text-slate-900 mt-1">{stats.totalTeachers}</h3>
                            <p className="text-[11px] text-slate-500 mt-1.5 flex items-center gap-1">
                                <CheckCircle2 className="h-3 w-3 text-emerald-600" /> Registered App Credentials
                            </p>
                        </div>
                        <div className="h-12 w-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
                            <Users className="h-6 w-6" />
                        </div>
                    </CardContent>
                </Card>

                {/* 3. Total Students */}
                <Card className="bg-white border-slate-200 shadow-sm hover:border-slate-300 transition-colors">
                    <CardContent className="p-5 flex items-center justify-between">
                        <div>
                            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Students</p>
                            <h3 className="text-3xl font-black text-slate-900 mt-1">{stats.totalStudents}</h3>
                            <p className="text-[11px] text-slate-500 mt-1.5 flex items-center gap-1">
                                <GraduationCap className="h-3 w-3 text-blue-600" /> Monitored Across All Classes
                            </p>
                        </div>
                        <div className="h-12 w-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                            <GraduationCap className="h-6 w-6" />
                        </div>
                    </CardContent>
                </Card>

                {/* 4. Attendance Events This Week */}
                <Card className="bg-white border-slate-200 shadow-sm hover:border-slate-300 transition-colors">
                    <CardContent className="p-5 flex items-center justify-between">
                        <div>
                            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Weekly Attendance Events</p>
                            <h3 className="text-3xl font-black text-slate-900 mt-1">
                                {stats.attendanceEventsThisWeek.toLocaleString()}
                            </h3>
                            <p className="text-[11px] text-emerald-600 font-semibold mt-1.5 flex items-center gap-1">
                                <TrendingUp className="h-3 w-3" /> {stats.statewideAttendanceRate}% Avg Attendance Rate
                            </p>
                        </div>
                        <div className="h-12 w-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                            <CalendarCheck className="h-6 w-6" />
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Schools Breakdown by Status Section */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="bg-gradient-to-br from-emerald-50/50 to-white border-emerald-200/80 shadow-sm">
                    <CardContent className="p-4 flex items-center justify-between">
                        <div className="space-y-1">
                            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-100/60 px-2 py-0.5 rounded">
                                Active Status
                            </span>
                            <div className="text-2xl font-black text-emerald-950 mt-1">
                                {stats.schoolsByStatus.active} <span className="text-xs font-normal text-emerald-700">Schools</span>
                            </div>
                            <p className="text-xs text-slate-500">Fully authorized for live mobile attendance sync.</p>
                        </div>
                        <div className="h-10 w-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                            <CheckCircle2 className="h-5 w-5" />
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-blue-50/50 to-white border-blue-200/80 shadow-sm">
                    <CardContent className="p-4 flex items-center justify-between">
                        <div className="space-y-1">
                            <span className="text-[11px] font-bold uppercase tracking-wider text-blue-700 bg-blue-100/60 px-2 py-0.5 rounded">
                                Trial Status
                            </span>
                            <div className="text-2xl font-black text-blue-950 mt-1">
                                {stats.schoolsByStatus.trial} <span className="text-xs font-normal text-blue-700">Schools</span>
                            </div>
                            <p className="text-xs text-slate-500">Onboarding evaluation period; limited quota.</p>
                        </div>
                        <div className="h-10 w-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center">
                            <Clock className="h-5 w-5" />
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-red-50/50 to-white border-red-200/80 shadow-sm">
                    <CardContent className="p-4 flex items-center justify-between">
                        <div className="space-y-1">
                            <span className="text-[11px] font-bold uppercase tracking-wider text-red-700 bg-red-100/60 px-2 py-0.5 rounded">
                                Suspended Status
                            </span>
                            <div className="text-2xl font-black text-red-950 mt-1">
                                {stats.schoolsByStatus.suspended} <span className="text-xs font-normal text-red-700">Schools</span>
                            </div>
                            <p className="text-xs text-slate-500">Attendance sync blocked via restrictive DB policy.</p>
                        </div>
                        <div className="h-10 w-10 rounded-xl bg-red-100 text-red-700 flex items-center justify-center">
                            <AlertOctagon className="h-5 w-5" />
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Dual Grid: School Leaderboard & Live Mobile Sync Stream */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Institutional Performance Matrix (2 Cols) */}
                <Card className="lg:col-span-2 shadow-sm border-slate-200">
                    <CardHeader className="flex flex-row items-center justify-between pb-4 border-b">
                        <div>
                            <CardTitle className="text-lg font-bold text-slate-900">
                                Institutional Compliance & Attendance Ranking
                            </CardTitle>
                            <CardDescription className="text-xs">
                                Cross-school comparative standing derived from service-role aggregate telemetry.
                            </CardDescription>
                        </div>
                        <Link href="/admin/schools">
                            <Button variant="outline" size="sm" className="text-xs">
                                View All Schools <ArrowUpRight className="h-3.5 w-3.5 ml-1" />
                            </Button>
                        </Link>
                    </CardHeader>
                    <CardContent className="p-0">
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-slate-50 text-[11px] text-slate-500 font-semibold uppercase">
                                    <TableHead>Institution</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Students</TableHead>
                                    <TableHead>Weekly Rate</TableHead>
                                    <TableHead>Last Sync</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {stats.schoolRankings.map((school, index) => (
                                    <TableRow key={school.schoolId} className="hover:bg-slate-50/60 transition-colors">
                                        <TableCell>
                                            <div className="flex items-center gap-2.5">
                                                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-100 text-[10px] font-bold text-slate-600">
                                                    {index + 1}
                                                </span>
                                                <div>
                                                    <div className="font-semibold text-slate-900 text-sm">
                                                        {school.schoolName}
                                                    </div>
                                                    <div className="text-[11px] text-slate-400 font-mono">
                                                        {school.schoolCode}
                                                    </div>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            {school.status === 'active' && (
                                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                                    <CheckCircle2 className="h-3 w-3" /> Active
                                                </span>
                                            )}
                                            {school.status === 'trial' && (
                                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                                                    <Clock className="h-3 w-3" /> Trial
                                                </span>
                                            )}
                                            {school.status === 'suspended' && (
                                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-red-50 text-red-700 border border-red-200">
                                                    <AlertOctagon className="h-3 w-3" /> Suspended
                                                </span>
                                            )}
                                        </TableCell>
                                        <TableCell className="font-medium text-slate-700 text-sm">
                                            {school.studentCount}
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <div className="w-16 h-1.5 rounded-full bg-slate-100 overflow-hidden">
                                                    <div
                                                        className={`h-full rounded-full ${
                                                            school.attendanceRate >= 80
                                                                ? 'bg-emerald-500'
                                                                : school.attendanceRate >= 60
                                                                ? 'bg-amber-500'
                                                                : 'bg-red-500'
                                                        }`}
                                                        style={{ width: `${Math.min(100, school.attendanceRate)}%` }}
                                                    />
                                                </div>
                                                <span className="text-xs font-bold text-slate-800">
                                                    {school.attendanceRate}%
                                                </span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-xs text-slate-500">
                                            {school.lastActive || "No sync yet"}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex items-center justify-end gap-1.5">
                                                <Link href={`/admin/drill-down?school_id=${school.schoolId}`}>
                                                    <Button variant="ghost" size="sm" className="h-7 text-xs text-blue-600 hover:text-blue-700 hover:bg-blue-50">
                                                        Inspect
                                                    </Button>
                                                </Link>
                                                <Link href={`/admin/schools/${school.schoolId}`}>
                                                    <Button variant="ghost" size="sm" className="h-7 text-xs text-slate-600 hover:text-slate-900">
                                                        Manage
                                                    </Button>
                                                </Link>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                                {stats.schoolRankings.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={6} className="text-center py-8 text-slate-400">
                                            No schools registered in the platform yet.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>

                {/* Real-time Field Feed (1 Col) */}
                <Card className="shadow-sm border-slate-200">
                    <CardHeader className="pb-3 border-b">
                        <div className="flex items-center justify-between">
                            <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                                <Activity className="h-4 w-4 text-emerald-500" /> Live Field Feed
                            </CardTitle>
                            <span className="text-[10px] uppercase font-bold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
                                Mobile App Syncs
                            </span>
                        </div>
                        <CardDescription className="text-xs">
                            Direct incoming sync packets from teacher handhelds.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="p-4 space-y-3">
                        {stats.recentSyncFeed.map((feed) => (
                            <div
                                key={feed.id}
                                className="flex items-start justify-between p-3 rounded-lg border border-slate-100 bg-slate-50/50 hover:bg-slate-50 transition-colors"
                            >
                                <div className="space-y-0.5">
                                    <div className="text-xs font-bold text-slate-900">
                                        {feed.schoolName}
                                    </div>
                                    <div className="text-[11px] text-slate-500">
                                        Class <span className="font-semibold text-slate-700">{feed.className}</span> • marked by {feed.teacherName}
                                    </div>
                                    <div className="text-[10px] text-slate-400 font-mono">
                                        {feed.timestamp}
                                    </div>
                                </div>
                                <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-100">
                                    +{feed.count}
                                </span>
                            </div>
                        ))}
                        {stats.recentSyncFeed.length === 0 && (
                            <p className="text-xs text-slate-400 text-center py-6">
                                No attendance sync packets recorded this week.
                            </p>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
