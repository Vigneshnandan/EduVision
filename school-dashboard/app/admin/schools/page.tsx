import { getAllSchoolsDirectory } from "@/lib/admin-schools"
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { School, Plus, Building2, CheckCircle2, Clock, AlertOctagon, ArrowUpRight, Users, GraduationCap } from "lucide-react"

export const revalidate = 0

export default async function AdminSchoolsPage() {
    const schools = await getAllSchoolsDirectory()

    const totalSchools = schools.length
    const activeSchools = schools.filter(s => s.status === 'active').length
    const trialSchools = schools.filter(s => s.status === 'trial').length
    const suspendedSchools = schools.filter(s => s.status === 'suspended').length

    return (
        <div className="p-8 space-y-8 bg-slate-50 min-h-screen">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <div className="flex items-center gap-2">
                        <span className="px-2.5 py-0.5 rounded text-xs font-bold uppercase tracking-wider bg-purple-100 text-purple-800">
                            Super Admin
                        </span>
                        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Institutional Directory</h1>
                    </div>
                    <p className="text-slate-500 mt-1">
                        Register partner schools, monitor multi-tenant activity, and govern institutional access.
                    </p>
                </div>
                <Link href="/admin/schools/new">
                    <Button className="bg-blue-600 hover:bg-blue-700 shadow-sm">
                        <Plus className="h-4 w-4 mr-1.5" /> Register New School
                    </Button>
                </Link>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="bg-white border-slate-200">
                    <CardContent className="p-5 flex items-center gap-4">
                        <div className="h-12 w-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                            <Building2 className="h-6 w-6" />
                        </div>
                        <div>
                            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Institutions</p>
                            <h3 className="text-2xl font-bold text-slate-900">{totalSchools}</h3>
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-white border-slate-200">
                    <CardContent className="p-5 flex items-center gap-4">
                        <div className="h-12 w-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                            <CheckCircle2 className="h-6 w-6" />
                        </div>
                        <div>
                            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Active Deployments</p>
                            <h3 className="text-2xl font-bold text-slate-900">{activeSchools}</h3>
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-white border-slate-200">
                    <CardContent className="p-5 flex items-center gap-4">
                        <div className="h-12 w-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                            <Clock className="h-6 w-6" />
                        </div>
                        <div>
                            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Trial Pilots</p>
                            <h3 className="text-2xl font-bold text-slate-900">{trialSchools}</h3>
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-white border-slate-200">
                    <CardContent className="p-5 flex items-center gap-4">
                        <div className="h-12 w-12 rounded-xl bg-red-50 text-red-600 flex items-center justify-center">
                            <AlertOctagon className="h-6 w-6" />
                        </div>
                        <div>
                            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Suspended</p>
                            <h3 className="text-2xl font-bold text-slate-900">{suspendedSchools}</h3>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Directory Table */}
            <Card className="shadow-sm">
                <CardHeader className="flex flex-row items-center justify-between pb-4">
                    <div>
                        <CardTitle className="text-xl font-bold text-slate-900">Registered Institutions</CardTitle>
                        <CardDescription>
                            Cross-tenant administrative overview across all schools in the state/district.
                        </CardDescription>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-slate-50/70">
                                    <TableHead className="font-semibold text-slate-700">School Name</TableHead>
                                    <TableHead className="font-semibold text-slate-700">Code</TableHead>
                                    <TableHead className="font-semibold text-slate-700">Status</TableHead>
                                    <TableHead className="font-semibold text-slate-700">Teachers</TableHead>
                                    <TableHead className="font-semibold text-slate-700">Students</TableHead>
                                    <TableHead className="font-semibold text-slate-700">Last Attendance</TableHead>
                                    <TableHead className="text-right font-semibold text-slate-700">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {schools.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={7} className="text-center py-12 text-slate-500">
                                            No schools registered yet. Click &quot;Register New School&quot; to onboard your first institution.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    schools.map((school) => {
                                        let statusBadge = (
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
                                                Active
                                            </span>
                                        )
                                        if (school.status === 'trial') {
                                            statusBadge = (
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">
                                                    Trial
                                                </span>
                                            )
                                        } else if (school.status === 'suspended') {
                                            statusBadge = (
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-800">
                                                    Suspended
                                                </span>
                                            )
                                        }

                                        return (
                                            <TableRow key={school.school_id} className="hover:bg-slate-50/50">
                                                <TableCell className="font-medium text-slate-900">
                                                    <Link 
                                                        href={`/admin/schools/${school.school_id}`}
                                                        className="hover:text-blue-600 hover:underline font-semibold"
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
                                                    {statusBadge}
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
                                                    <Link href={`/admin/schools/${school.school_id}`}>
                                                        <Button variant="ghost" size="sm" className="text-blue-600 hover:bg-blue-50 text-xs">
                                                            Manage <ArrowUpRight className="h-3.5 w-3.5 ml-1" />
                                                        </Button>
                                                    </Link>
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
