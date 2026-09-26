"use client"

import { useState } from "react"
import { TeacherRecord } from "@/lib/types"
import { toggleStatusAction, changeRoleAction, addTeacherAction } from "./actions"
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Users, UserCheck, ShieldAlert, ShieldCheck, Plus, Power, Shield, Loader2 } from "lucide-react"

interface TeachersClientProps {
    initialTeachers: TeacherRecord[]
    isSchoolAdmin: boolean
}

export function TeachersClient({ initialTeachers, isSchoolAdmin }: TeachersClientProps) {
    const [teachers, setTeachers] = useState<TeacherRecord[]>(initialTeachers)
    const [isAddOpen, setIsAddOpen] = useState(false)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [actionLoadingId, setActionLoadingId] = useState<string | null>(null)

    // Stats
    const totalTeachers = teachers.length
    const activeCount = teachers.filter(t => t.is_active).length
    const inactiveCount = totalTeachers - activeCount
    const adminCount = teachers.filter(t => t.role === 'school_admin').length

    const handleToggleStatus = async (teacherId: string, currentStatus: boolean) => {
        setActionLoadingId(teacherId)
        try {
            await toggleStatusAction(teacherId, currentStatus)
            setTeachers(prev => prev.map(t => t.teacher_id === teacherId ? { ...t, is_active: !currentStatus } : t))
        } catch (err: any) {
            alert(err.message || "Failed to update teacher status")
        } finally {
            setActionLoadingId(null)
        }
    }

    const handleChangeRole = async (teacherId: string, currentRole: string) => {
        const nextRole = currentRole === 'school_admin' ? 'teacher' : 'school_admin'
        const confirmMsg = nextRole === 'school_admin' 
            ? "Promote this teacher to School Administrator? They will have access to modify school settings and roster."
            : "Demote this account back to standard Teacher?"
        
        if (!confirm(confirmMsg)) return

        setActionLoadingId(teacherId)
        try {
            await changeRoleAction(teacherId, nextRole)
            setTeachers(prev => prev.map(t => t.teacher_id === teacherId ? { ...t, role: nextRole } : t))
        } catch (err: any) {
            alert(err.message || "Failed to change role")
        } finally {
            setActionLoadingId(null)
        }
    }

    const handleAdd = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setIsSubmitting(true)
        const formData = new FormData(e.currentTarget)
        try {
            await addTeacherAction(formData)
            const name = formData.get('name') as string
            const loginId = formData.get('loginId') as string
            const role = (formData.get('role') as 'teacher' | 'school_admin') || 'teacher'

            setTeachers(prev => [
                {
                    teacher_id: `temp-${Date.now()}`,
                    school_id: '',
                    teacher_name: name,
                    teacher_login_id: loginId,
                    role: role,
                    is_active: true,
                    created_at: new Date().toISOString()
                },
                ...prev
            ])
            setIsAddOpen(false)
        } catch (err: any) {
            alert(err.message || "Failed to register teacher")
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <div className="space-y-6">
            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="bg-white border-slate-200">
                    <CardContent className="p-5 flex items-center gap-4">
                        <div className="h-12 w-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                            <Users className="h-6 w-6" />
                        </div>
                        <div>
                            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Faculty</p>
                            <h3 className="text-2xl font-bold text-slate-900">{totalTeachers}</h3>
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-white border-slate-200">
                    <CardContent className="p-5 flex items-center gap-4">
                        <div className="h-12 w-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                            <UserCheck className="h-6 w-6" />
                        </div>
                        <div>
                            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Active Staff</p>
                            <h3 className="text-2xl font-bold text-slate-900">{activeCount}</h3>
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-white border-slate-200">
                    <CardContent className="p-5 flex items-center gap-4">
                        <div className="h-12 w-12 rounded-xl bg-red-50 text-red-600 flex items-center justify-center">
                            <ShieldAlert className="h-6 w-6" />
                        </div>
                        <div>
                            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Deactivated</p>
                            <h3 className="text-2xl font-bold text-slate-900">{inactiveCount}</h3>
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-white border-slate-200">
                    <CardContent className="p-5 flex items-center gap-4">
                        <div className="h-12 w-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                            <ShieldCheck className="h-6 w-6" />
                        </div>
                        <div>
                            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">School Admins</p>
                            <h3 className="text-2xl font-bold text-slate-900">{adminCount}</h3>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Teacher Roster Table */}
            <Card className="shadow-sm">
                <CardHeader className="flex flex-row items-center justify-between pb-4">
                    <div>
                        <CardTitle className="text-xl font-bold text-slate-900">Faculty & Staff Roster</CardTitle>
                        <CardDescription>
                            All registered educators for this institution. Logins are synchronized with the mobile attendance app.
                        </CardDescription>
                    </div>
                    {isSchoolAdmin && (
                        <Button onClick={() => setIsAddOpen(true)} className="bg-blue-600 hover:bg-blue-700">
                            <Plus className="h-4 w-4 mr-2" /> Add Teacher
                        </Button>
                    )}
                </CardHeader>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-slate-50/70">
                                <TableHead className="font-semibold text-slate-700">Name</TableHead>
                                <TableHead className="font-semibold text-slate-700">Login ID / Email</TableHead>
                                <TableHead className="font-semibold text-slate-700">Role</TableHead>
                                <TableHead className="font-semibold text-slate-700">Status</TableHead>
                                <TableHead className="font-semibold text-slate-700">Registered</TableHead>
                                <TableHead className="text-right font-semibold text-slate-700">
                                    {isSchoolAdmin ? "Admin Actions" : "Access Level"}
                                </TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {teachers.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center py-10 text-slate-500">
                                        No teachers registered for this school yet.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                teachers.map((teacher) => {
                                    const isLoading = actionLoadingId === teacher.teacher_id
                                    return (
                                        <TableRow key={teacher.teacher_id} className="hover:bg-slate-50/50">
                                            <TableCell className="font-medium text-slate-900">
                                                {teacher.teacher_name}
                                            </TableCell>
                                            <TableCell className="font-mono text-xs text-slate-600">
                                                {teacher.teacher_login_id}
                                            </TableCell>
                                            <TableCell>
                                                {teacher.role === 'school_admin' ? (
                                                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-100 text-purple-800">
                                                        <Shield className="h-3 w-3" /> School Admin
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700">
                                                        Teacher
                                                    </span>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                {teacher.is_active ? (
                                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
                                                        Active
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                                        Deactivated
                                                    </span>
                                                )}
                                            </TableCell>
                                            <TableCell className="text-slate-500 text-xs">
                                                {teacher.created_at ? new Date(teacher.created_at).toLocaleDateString() : "-"}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                {isSchoolAdmin ? (
                                                    <div className="flex items-center justify-end gap-2">
                                                        {/* Role toggle button */}
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            disabled={isLoading}
                                                            onClick={() => handleChangeRole(teacher.teacher_id, teacher.role)}
                                                            className="text-xs h-8 text-slate-700"
                                                        >
                                                            {teacher.role === 'school_admin' ? 'Make Teacher' : 'Make Admin'}
                                                        </Button>

                                                        {/* Status toggle button */}
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            disabled={isLoading}
                                                            onClick={() => handleToggleStatus(teacher.teacher_id, teacher.is_active)}
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
                                                    </div>
                                                ) : (
                                                    <span className="text-xs text-slate-400">View Only</span>
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    )
                                })
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            {/* Add Teacher Modal */}
            <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>Register New Faculty</DialogTitle>
                        <DialogDescription>
                            Create a teacher profile. The teacher can use this Login ID on the EduVision Android App.
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleAdd} className="space-y-4 py-2">
                        <div className="space-y-2">
                            <Label htmlFor="name">Teacher Full Name</Label>
                            <Input id="name" name="name" placeholder="e.g. Ramesh Kumar" required />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="loginId">Login ID / Email</Label>
                            <Input id="loginId" name="loginId" type="email" placeholder="e.g. ramesh@school.edu" required />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="role">Institutional Role</Label>
                            <select
                                id="role"
                                name="role"
                                defaultValue="teacher"
                                className="w-full h-10 px-3 py-2 border rounded-md text-sm bg-white border-input"
                            >
                                <option value="teacher">Standard Teacher</option>
                                <option value="school_admin">School Administrator</option>
                            </select>
                        </div>
                        <DialogFooter className="pt-2">
                            <Button type="button" variant="outline" onClick={() => setIsAddOpen(false)}>
                                Cancel
                            </Button>
                            <Button type="submit" disabled={isSubmitting} className="bg-blue-600 hover:bg-blue-700">
                                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Add to Roster
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    )
}
