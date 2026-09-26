"use client"

import { useState } from "react"
import { PlatformTeacherItem } from "@/lib/admin-teachers"
import { togglePlatformTeacherAction } from "./actions"
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Users, Search, Building2, Power, Loader2, Shield } from "lucide-react"

interface PlatformTeachersClientProps {
    initialTeachers: PlatformTeacherItem[]
    schools: { school_id: string; school_name: string }[]
}

export function PlatformTeachersClient({ initialTeachers, schools }: PlatformTeachersClientProps) {
    const [teachers, setTeachers] = useState<PlatformTeacherItem[]>(initialTeachers)
    const [searchTerm, setSearchTerm] = useState("")
    const [selectedSchool, setSelectedSchool] = useState("All")
    const [selectedStatus, setSelectedStatus] = useState("All")
    const [loadingId, setLoadingId] = useState<string | null>(null)

    const handleToggle = async (teacherId: string, currentStatus: boolean, teacherName: string) => {
        const actionVerb = currentStatus ? "DEACTIVATE" : "ACTIVATE"
        if (!confirm(`Are you sure you want to ${actionVerb} access for educator "${teacherName}" across the platform?`)) {
            return
        }

        setLoadingId(teacherId)
        try {
            await togglePlatformTeacherAction(teacherId, currentStatus)
            setTeachers(prev => prev.map(t => t.teacher_id === teacherId ? { ...t, is_active: !currentStatus } : t))
        } catch (err: any) {
            alert(err.message || "Failed to toggle status")
        } finally {
            setLoadingId(null)
        }
    }

    // Filter Logic
    const filteredTeachers = teachers.filter(t => {
        const matchesSearch = t.teacher_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            t.teacher_login_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
            t.school_name.toLowerCase().includes(searchTerm.toLowerCase())
        const matchesSchool = selectedSchool === "All" || t.school_id === selectedSchool
        const matchesStatus = selectedStatus === "All" || 
            (selectedStatus === "Active" && t.is_active) || 
            (selectedStatus === "Deactivated" && !t.is_active)
        return matchesSearch && matchesSchool && matchesStatus
    })

    const totalCount = teachers.length
    const activeCount = teachers.filter(t => t.is_active).length
    const inactiveCount = totalCount - activeCount

    return (
        <div className="space-y-6">
            {/* Quick KPI Strip */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="bg-white border-slate-200">
                    <CardContent className="p-4 flex items-center gap-3">
                        <div className="h-10 w-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                            <Users className="h-5 w-5" />
                        </div>
                        <div>
                            <p className="text-[11px] font-semibold text-slate-500 uppercase">Statewide Faculty</p>
                            <h4 className="text-xl font-bold text-slate-900">{totalCount}</h4>
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-white border-slate-200">
                    <CardContent className="p-4 flex items-center gap-3">
                        <div className="h-10 w-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                            <Power className="h-5 w-5" />
                        </div>
                        <div>
                            <p className="text-[11px] font-semibold text-slate-500 uppercase">Active Accounts</p>
                            <h4 className="text-xl font-bold text-slate-900">{activeCount}</h4>
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-white border-slate-200">
                    <CardContent className="p-4 flex items-center gap-3">
                        <div className="h-10 w-10 rounded-lg bg-red-50 text-red-600 flex items-center justify-center">
                            <Shield className="h-5 w-5" />
                        </div>
                        <div>
                            <p className="text-[11px] font-semibold text-slate-500 uppercase">Deactivated</p>
                            <h4 className="text-xl font-bold text-slate-900">{inactiveCount}</h4>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Filter Bar */}
            <Card className="shadow-sm border-slate-200">
                <CardHeader className="bg-white border-b pb-4">
                    <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
                        <div className="relative w-full md:w-80">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-500" />
                            <Input
                                placeholder="Search teacher, email, or school..."
                                className="pl-9"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <div className="flex flex-wrap items-center gap-3">
                            <div className="flex items-center gap-2">
                                <span className="text-xs text-slate-500 font-medium">School:</span>
                                <select
                                    className="h-9 rounded-md border border-input bg-background px-3 py-1.5 text-xs bg-white"
                                    value={selectedSchool}
                                    onChange={(e) => setSelectedSchool(e.target.value)}
                                >
                                    <option value="All">All Schools ({schools.length})</option>
                                    {schools.map(s => (
                                        <option key={s.school_id} value={s.school_id}>{s.school_name}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-xs text-slate-500 font-medium">Status:</span>
                                <select
                                    className="h-9 rounded-md border border-input bg-background px-3 py-1.5 text-xs bg-white"
                                    value={selectedStatus}
                                    onChange={(e) => setSelectedStatus(e.target.value)}
                                >
                                    <option value="All">All Statuses</option>
                                    <option value="Active">Active Only</option>
                                    <option value="Deactivated">Deactivated Only</option>
                                </select>
                            </div>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-slate-50/70">
                                    <TableHead className="font-semibold text-slate-700">Educator Name</TableHead>
                                    <TableHead className="font-semibold text-slate-700">Institution</TableHead>
                                    <TableHead className="font-semibold text-slate-700">Login ID / Email</TableHead>
                                    <TableHead className="font-semibold text-slate-700">Role</TableHead>
                                    <TableHead className="font-semibold text-slate-700">Status</TableHead>
                                    <TableHead className="text-right font-semibold text-slate-700">Platform Action</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredTeachers.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="text-center py-12 text-slate-500">
                                            No educators found matching criteria.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    filteredTeachers.map((teacher) => {
                                        const isLoading = loadingId === teacher.teacher_id
                                        return (
                                            <TableRow key={teacher.teacher_id} className="hover:bg-slate-50/50">
                                                <TableCell className="font-medium text-slate-900">
                                                    {teacher.teacher_name}
                                                </TableCell>
                                                <TableCell>
                                                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-slate-100 text-slate-700 text-xs font-medium">
                                                        <Building2 className="h-3 w-3 text-slate-400" />
                                                        {teacher.school_name}
                                                    </span>
                                                </TableCell>
                                                <TableCell className="font-mono text-xs text-slate-600">
                                                    {teacher.teacher_login_id}
                                                </TableCell>
                                                <TableCell>
                                                    {teacher.role === 'school_admin' ? (
                                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-purple-100 text-purple-800">
                                                            School Admin
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-600">
                                                            Teacher
                                                        </span>
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    {teacher.is_active ? (
                                                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100 text-emerald-800">
                                                            Active
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-red-100 text-red-800">
                                                            Deactivated
                                                        </span>
                                                    )}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        disabled={isLoading}
                                                        onClick={() => handleToggle(teacher.teacher_id, teacher.is_active, teacher.teacher_name)}
                                                        className={`text-xs h-8 ${teacher.is_active ? 'text-red-600 hover:bg-red-50' : 'text-emerald-600 hover:bg-emerald-50'}`}
                                                    >
                                                        {isLoading ? (
                                                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                                        ) : (
                                                            <>
                                                                <Power className="h-3.5 w-3.5 mr-1" />
                                                                {teacher.is_active ? 'Deactivate' : 'Activate'}
                                                            </>
                                                        )}
                                                    </Button>
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
