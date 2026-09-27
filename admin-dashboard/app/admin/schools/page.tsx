import { getAllSchoolsDirectory } from "@/lib/admin-schools"
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Plus, Building2, CheckCircle2, Clock, AlertOctagon, ArrowUpRight, Users, GraduationCap, Sparkles, CreditCard } from "lucide-react"

export const metadata = {
    title: "Institutions Directory — Platform Governance",
    description: "Cross-school management, governance status, and commercial subscriptions."
}

export const revalidate = 0

export default async function AdminSchoolsPage() {
    const schools = await getAllSchoolsDirectory()

    const totalSchools = schools.length
    const activeSchools = schools.filter(s => s.status === 'active').length
    const trialSchools = schools.filter(s => s.status === 'trial').length
    const suspendedSchools = schools.filter(s => s.status === 'suspended').length
    const paidSchools = schools.filter(s => s.plan_tier === 'paid').length

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-6">
                <div>
                    <div className="flex items-center gap-2">
                        <span className="px-2.5 py-0.5 rounded text-xs font-bold uppercase tracking-wider bg-blue-100 text-blue-800 border border-blue-200">
                            Super Admin
                        </span>
                        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Institutional Directory</h1>
                    </div>
                    <p className="text-slate-500 text-sm mt-1">
                        Register partner schools, govern multi-tenant status, and manage commercial subscription licenses.
                    </p>
                </div>
                <div className="flex items-center gap-2.5">
                    <Link href="/admin/drill-down">
                        <Button variant="outline" className="border-slate-300 text-slate-700 hover:bg-slate-100 text-sm">
                            School Inspector
                        </Button>
                    </Link>
                    <Link href="/admin/schools/new">
                        <Button className="bg-blue-600 hover:bg-blue-700 shadow-sm text-sm">
                            <Plus className="h-4 w-4 mr-1.5" /> Register New School
                        </Button>
                    </Link>
                </div>
            </div>

            {/* KPI Cards Strip */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="bg-white border-slate-200 shadow-sm">
                    <CardContent className="p-5 flex items-center justify-between">
                        <div>
                            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Institutions</p>
                            <h3 className="text-2xl font-black text-slate-900 mt-1">{totalSchools}</h3>
                            <p className="text-[11px] text-slate-400 mt-1">Onboarded across state</p>
                        </div>
                        <div className="h-11 w-11 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                            <Building2 className="h-5 w-5" />
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-white border-slate-200 shadow-sm">
                    <CardContent className="p-5 flex items-center justify-between">
                        <div>
                            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Active Deployments</p>
                            <h3 className="text-2xl font-black text-slate-900 mt-1">{activeSchools}</h3>
                            <p className="text-[11px] text-emerald-600 font-semibold mt-1">Authorized for live sync</p>
                        </div>
                        <div className="h-11 w-11 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                            <CheckCircle2 className="h-5 w-5" />
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-white border-slate-200 shadow-sm">
                    <CardContent className="p-5 flex items-center justify-between">
                        <div>
                            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Commercial Paid Tier</p>
                            <h3 className="text-2xl font-black text-slate-900 mt-1">{paidSchools}</h3>
                            <p className="text-[11px] text-emerald-700 font-medium mt-1">Full enterprise features</p>
                        </div>
                        <div className="h-11 w-11 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                            <Sparkles className="h-5 w-5" />
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-white border-slate-200 shadow-sm">
                    <CardContent className="p-5 flex items-center justify-between">
                        <div>
                            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Trial / Suspended</p>
                            <h3 className="text-2xl font-black text-slate-900 mt-1">
                                {trialSchools} <span className="text-xs font-normal text-slate-400">/ {suspendedSchools}</span>
                            </h3>
                            <p className="text-[11px] text-slate-400 mt-1">Evaluation & restricted</p>
                        </div>
                        <div className="h-11 w-11 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                            <Clock className="h-5 w-5" />
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Directory Table */}
            <Card className="shadow-sm border-slate-200 bg-white">
                <CardHeader className="flex flex-row items-center justify-between pb-4 border-b">
                    <div>
                        <CardTitle className="text-lg font-bold text-slate-900">Registered Institutions</CardTitle>
                        <CardDescription className="text-xs">
                            Cross-tenant administrative directory with governance and commercial plan tier statuses.
                        </CardDescription>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-slate-50/70 text-xs font-semibold text-slate-600 uppercase">
                                    <TableHead>School Name</TableHead>
                                    <TableHead>Code</TableHead>
                                    <TableHead>Gov Status</TableHead>
                                    <TableHead>Plan Tier</TableHead>
                                    <TableHead>Teachers</TableHead>
                                    <TableHead>Students</TableHead>
                                    <TableHead>Last Attendance</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {schools.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={8} className="text-center py-12 text-slate-500">
                                            No schools registered yet. Click &quot;Register New School&quot; to onboard your first institution.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    schools.map((school) => {
                                        return (
                                            <TableRow key={school.school_id} className="hover:bg-slate-50/50 transition-colors">
                                                <TableCell className="font-medium text-slate-900">
                                                    <Link 
                                                        href={`/admin/schools/${school.school_id}`}
                                                        className="hover:text-blue-600 hover:underline font-bold text-sm"
                                                    >
                                                        {school.school_name}
                                                    </Link>
                                                    {school.address && (
                                                        <p className="text-xs text-slate-400 font-normal truncate max-w-xs">{school.address}</p>
                                                    )}
                                                </TableCell>
                                                <TableCell className="font-mono text-xs font-bold text-slate-600">
                                                    {school.school_code}
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
                                                <TableCell>
                                                    {school.plan_tier === 'paid' ? (
                                                        <div className="space-y-0.5">
                                                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                                                <Sparkles className="h-3 w-3" /> Paid Tier
                                                            </span>
                                                            {school.plan_renews_at && (
                                                                <p className="text-[10px] text-slate-400 font-mono">Renews: {school.plan_renews_at}</p>
                                                            )}
                                                        </div>
                                                    ) : (
                                                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-600 border border-slate-200">
                                                            Free Tier
                                                        </span>
                                                    )}
                                                </TableCell>
                                                <TableCell className="text-slate-600 text-sm">
                                                    <span className="inline-flex items-center gap-1">
                                                        <Users className="h-3.5 w-3.5 text-slate-400" />
                                                        {school.teacher_count}
                                                    </span>
                                                </TableCell>
                                                <TableCell className="text-slate-600 text-sm">
                                                    <span className="inline-flex items-center gap-1">
                                                        <GraduationCap className="h-3.5 w-3.5 text-slate-400" />
                                                        {school.student_count}
                                                    </span>
                                                </TableCell>
                                                <TableCell className="text-xs text-slate-500 font-mono">
                                                    {school.last_activity || "No activity yet"}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <div className="flex items-center justify-end gap-1.5">
                                                        <Link href={`/admin/drill-down?school_id=${school.school_id}`}>
                                                            <Button variant="ghost" size="sm" className="text-blue-600 hover:bg-blue-50 text-xs h-7">
                                                                Inspect
                                                            </Button>
                                                        </Link>
                                                        <Link href={`/admin/schools/${school.school_id}`}>
                                                            <Button variant="outline" size="sm" className="text-slate-700 hover:bg-slate-100 text-xs h-7">
                                                                Manage <ArrowUpRight className="h-3 w-3 ml-1" />
                                                            </Button>
                                                        </Link>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        )
                                    })
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
