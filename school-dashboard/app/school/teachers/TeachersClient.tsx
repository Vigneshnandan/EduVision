"use client"

import { useState } from "react"
import { TeacherRecord } from "@/lib/types"
import { toggleStatusAction, changeRoleAction, addTeacherAction, setTeacherPasswordAction, deleteTeacherAction } from "./actions"
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Users, UserCheck, ShieldAlert, ShieldCheck, Plus, Power, Shield, Loader2, KeyRound, Copy, Check, Eye, EyeOff, RefreshCw, Smartphone, Trash2 } from "lucide-react"

function generateRandomPassword() {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%"
    let pass = ""
    for (let i = 0; i < 9; i++) {
        pass += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return pass
}

interface TeachersClientProps {
    initialTeachers: TeacherRecord[]
    isSchoolAdmin: boolean
}

export function TeachersClient({ initialTeachers, isSchoolAdmin }: TeachersClientProps) {
    const [teachers, setTeachers] = useState<TeacherRecord[]>(initialTeachers)
    const [isAddOpen, setIsAddOpen] = useState(false)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [actionLoadingId, setActionLoadingId] = useState<string | null>(null)

    // Add Teacher Form State
    const [addPassword, setAddPassword] = useState("TeachPass@2026")
    const [showAddPassword, setShowAddPassword] = useState(false)

    // Created Credentials Success Dialog State
    const [createdCredentials, setCreatedCredentials] = useState<{
        name: string
        loginId: string
        password?: string
        schoolId?: string
    } | null>(null)

    // Set / Reset Password Dialog State
    const [isSetPasswordOpen, setIsSetPasswordOpen] = useState(false)
    const [targetTeacher, setTargetTeacher] = useState<TeacherRecord | null>(null)
    const [targetPassword, setTargetPassword] = useState("")
    const [showTargetPassword, setShowTargetPassword] = useState(false)
    const [isSettingPassword, setIsSettingPassword] = useState(false)

    // Copied feedback
    const [copiedKey, setCopiedKey] = useState<string | null>(null)

    const copyToClipboard = (text: string, key: string) => {
        navigator.clipboard.writeText(text)
        setCopiedKey(key)
        setTimeout(() => setCopiedKey(null), 2000)
    }

    // Stats
    const totalTeachers = teachers.length
    const activeCount = teachers.filter(t => t.is_active).length
    const inactiveCount = totalTeachers - activeCount
    const adminCount = teachers.filter(t => t.role === 'school_admin').length
    const appReadyCount = teachers.filter(t => Boolean(t.auth_user_id)).length

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
        const name = formData.get('name') as string
        const loginId = formData.get('loginId') as string
        const password = formData.get('password') as string
        const role = (formData.get('role') as 'teacher' | 'school_admin') || 'teacher'

        try {
            const result = await addTeacherAction(formData)
            if (result?.error) {
                alert(result.error)
                setIsSubmitting(false)
                return
            }
            
            const teacherData = result?.teacher
            const newTeacher: TeacherRecord = {
                teacher_id: teacherData?.id ? String(teacherData.id) : `temp-${Date.now()}`,
                school_id: teacherData?.school_id ? String(teacherData.school_id) : (teachers[0]?.school_id || ''),
                teacher_name: name,
                teacher_login_id: loginId,
                role: role,
                is_active: true,
                auth_user_id: teacherData?.auth_created ? 'provisioned' : (password ? 'provisioned' : null),
                created_at: new Date().toISOString()
            }

            setTeachers(prev => [newTeacher, ...prev])
            setIsAddOpen(false)

            // Open credentials dialog if password was set
            if (password) {
                setCreatedCredentials({
                    name,
                    loginId,
                    password,
                    schoolId: newTeacher.school_id
                })
            }
        } catch (err: any) {
            alert(err.message || "Failed to register teacher")
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleSetPassword = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!targetTeacher) return
        if (!targetPassword || targetPassword.length < 6) {
            alert("Password must be at least 6 characters.")
            return
        }

        setIsSettingPassword(true)
        try {
            const res = await setTeacherPasswordAction(targetTeacher.teacher_id, targetTeacher.teacher_login_id, targetPassword)
            if (res?.error) {
                alert(res.error)
                setIsSettingPassword(false)
                return
            }
            
            // Mark auth_user_id as provisioned in local state
            setTeachers(prev => prev.map(t => 
                t.teacher_id === targetTeacher.teacher_id ? { ...t, auth_user_id: 'provisioned' } : t
            ))

            setCreatedCredentials({
                name: targetTeacher.teacher_name,
                loginId: targetTeacher.teacher_login_id,
                password: targetPassword,
                schoolId: targetTeacher.school_id
            })

            setIsSetPasswordOpen(false)
            setTargetTeacher(null)
            setTargetPassword("")
        } catch (err: any) {
            alert(err.message || "Failed to set password")
        } finally {
            setIsSettingPassword(false)
        }
    }

    const handleDeleteTeacher = async (teacherId: string, name: string) => {
        if (!confirm(`Are you sure you want to remove ${name} from the school roster? This will delete their faculty record.`)) {
            return
        }

        setActionLoadingId(teacherId)
        try {
            const res = await deleteTeacherAction(teacherId)
            if (res?.error) {
                alert(res.error)
                return
            }
            setTeachers(prev => prev.filter(t => t.teacher_id !== teacherId))
        } catch (err: any) {
            alert(err.message || "Failed to remove teacher")
        } finally {
            setActionLoadingId(null)
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
                            <Smartphone className="h-6 w-6" />
                        </div>
                        <div>
                            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">App Login Ready</p>
                            <h3 className="text-2xl font-bold text-slate-900">{appReadyCount}</h3>
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

                <Card className="bg-white border-slate-200">
                    <CardContent className="p-5 flex items-center gap-4">
                        <div className="h-12 w-12 rounded-xl bg-slate-50 text-slate-600 flex items-center justify-center">
                            <UserCheck className="h-6 w-6" />
                        </div>
                        <div>
                            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Active Staff</p>
                            <h3 className="text-2xl font-bold text-slate-900">{activeCount}</h3>
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
                            Manage teachers, authorize accounts for the EduVision Android App, and assign institutional roles.
                        </CardDescription>
                    </div>
                    {isSchoolAdmin && (
                        <Button 
                            onClick={() => {
                                setAddPassword(generateRandomPassword())
                                setIsAddOpen(true)
                            }} 
                            className="bg-blue-600 hover:bg-blue-700"
                        >
                            <Plus className="h-4 w-4 mr-2" />
                            Register Faculty Member
                        </Button>
                    )}
                </CardHeader>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-slate-50/70">
                                <TableHead className="font-semibold text-slate-700">Name</TableHead>
                                <TableHead className="font-semibold text-slate-700">Login ID / Username</TableHead>
                                <TableHead className="font-semibold text-slate-700">App Login</TableHead>
                                <TableHead className="font-semibold text-slate-700">Role</TableHead>
                                <TableHead className="font-semibold text-slate-700">Status</TableHead>
                                <TableHead className="font-semibold text-slate-700">Registered</TableHead>
                                <TableHead className="text-right font-semibold text-slate-700">
                                    {isSchoolAdmin ? "Faculty Actions" : "Access Level"}
                                </TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {teachers.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={7} className="text-center py-10 text-slate-500">
                                        No teachers registered for this school yet. Click &quot;Register Faculty Member&quot; to onboard.
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
                                                {teacher.auth_user_id ? (
                                                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                                                        <Smartphone className="h-3 w-3" /> App Ready
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-amber-50 text-amber-700 border border-amber-200">
                                                        <KeyRound className="h-3 w-3" /> No Password Set
                                                    </span>
                                                )}
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
                                                    <div className="flex items-center justify-end gap-1.5">
                                                        {/* Set / Reset Password button */}
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            disabled={isLoading}
                                                            onClick={() => {
                                                                setTargetTeacher(teacher)
                                                                setTargetPassword(generateRandomPassword())
                                                                setIsSetPasswordOpen(true)
                                                            }}
                                                            className="text-xs h-8 text-blue-700 border-blue-200 hover:bg-blue-50"
                                                            title="Set password for EduVision Android App & Dashboard"
                                                        >
                                                            <KeyRound className="h-3.5 w-3.5 mr-1" />
                                                            {teacher.auth_user_id ? 'Reset Pass' : 'Set Pass'}
                                                        </Button>

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
                                                            className={`text-xs h-8 ${teacher.is_active ? 'text-slate-600 hover:bg-slate-100' : 'text-emerald-600 hover:bg-emerald-50'}`}
                                                            title={teacher.is_active ? 'Deactivate faculty member' : 'Activate faculty member'}
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

                                                        {/* Remove/Delete button */}
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            disabled={isLoading}
                                                            onClick={() => handleDeleteTeacher(teacher.teacher_id, teacher.teacher_name)}
                                                            className="text-xs h-8 text-red-600 hover:bg-red-50 hover:text-red-700 p-2"
                                                            title="Delete faculty record from roster"
                                                        >
                                                            <Trash2 className="h-3.5 w-3.5" />
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

            {/* Modal 1: Register New Faculty with Password */}
            <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
                <DialogContent className="sm:max-w-[460px]">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Plus className="h-5 w-5 text-blue-600" />
                            Register New Faculty Member
                        </DialogTitle>
                        <DialogDescription>
                            Create a teacher profile and initial login password for the EduVision Android App and School Dashboard.
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleAdd} className="space-y-4 py-2">
                        <div className="space-y-2">
                            <Label htmlFor="name">Teacher Full Name *</Label>
                            <Input id="name" name="name" placeholder="e.g. Ramesh Kumar" required />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="loginId">Login ID / Email Address *</Label>
                            <Input 
                                id="loginId" 
                                name="loginId" 
                                placeholder="e.g. ramesh@school.edu or ramesh.kumar" 
                                required 
                            />
                            <p className="text-[11px] text-slate-500">
                                Used to sign in on the EduVision Android App.
                            </p>
                        </div>

                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <Label htmlFor="password">Initial Password *</Label>
                                <button
                                    type="button"
                                    onClick={() => setAddPassword(generateRandomPassword())}
                                    className="text-[11px] text-blue-600 hover:text-blue-800 flex items-center gap-1 font-medium"
                                >
                                    <RefreshCw className="h-3 w-3" /> Auto-generate
                                </button>
                            </div>
                            <div className="relative">
                                <Input
                                    id="password"
                                    name="password"
                                    type={showAddPassword ? "text" : "password"}
                                    value={addPassword}
                                    onChange={(e) => setAddPassword(e.target.value)}
                                    placeholder="Enter at least 6 characters"
                                    className="pr-10 font-mono text-sm"
                                    required
                                    minLength={6}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowAddPassword(!showAddPassword)}
                                    className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
                                >
                                    {showAddPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </button>
                            </div>
                            <p className="text-[11px] text-slate-500">
                                Minimum 6 characters. You can copy the credentials once created.
                            </p>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="role">Institutional Role</Label>
                            <select
                                id="role"
                                name="role"
                                defaultValue="teacher"
                                className="w-full h-10 px-3 py-2 border rounded-md text-sm bg-white border-input"
                            >
                                <option value="teacher">Standard Teacher (Attendance & Class Rosters)</option>
                                <option value="school_admin">School Administrator (Full Institutional Access)</option>
                            </select>
                        </div>

                        <DialogFooter className="pt-2">
                            <Button type="button" variant="outline" onClick={() => setIsAddOpen(false)} disabled={isSubmitting}>
                                Cancel
                            </Button>
                            <Button type="submit" disabled={isSubmitting} className="bg-blue-600 hover:bg-blue-700">
                                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Create Account & Set Login
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Modal 2: Set / Reset Password for Existing Teacher */}
            <Dialog open={isSetPasswordOpen} onOpenChange={setIsSetPasswordOpen}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <KeyRound className="h-5 w-5 text-blue-600" />
                            Set App Password for Faculty
                        </DialogTitle>
                        <DialogDescription>
                            Configure or update login credentials for {targetTeacher?.teacher_name}. They can use this password on the EduVision Android App.
                        </DialogDescription>
                    </DialogHeader>

                    {targetTeacher && (
                        <form onSubmit={handleSetPassword} className="space-y-4 py-2">
                            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-1">
                                <span className="text-[11px] font-semibold text-slate-500 uppercase">Faculty Member</span>
                                <p className="text-sm font-bold text-slate-900">{targetTeacher.teacher_name}</p>
                                <p className="text-xs font-mono text-slate-600">Login ID: {targetTeacher.teacher_login_id}</p>
                            </div>

                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <Label htmlFor="target_password">New Password *</Label>
                                    <button
                                        type="button"
                                        onClick={() => setTargetPassword(generateRandomPassword())}
                                        className="text-[11px] text-blue-600 hover:text-blue-800 flex items-center gap-1 font-medium"
                                    >
                                        <RefreshCw className="h-3 w-3" /> Auto-generate
                                    </button>
                                </div>
                                <div className="relative">
                                    <Input
                                        id="target_password"
                                        type={showTargetPassword ? "text" : "password"}
                                        value={targetPassword}
                                        onChange={(e) => setTargetPassword(e.target.value)}
                                        placeholder="Enter at least 6 characters"
                                        className="pr-10 font-mono text-sm"
                                        required
                                        minLength={6}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowTargetPassword(!showTargetPassword)}
                                        className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
                                    >
                                        {showTargetPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                    </button>
                                </div>
                                <p className="text-[11px] text-slate-500">
                                    This immediately updates their authentication credentials in Supabase.
                                </p>
                            </div>

                            <DialogFooter className="pt-2">
                                <Button 
                                    type="button" 
                                    variant="outline" 
                                    onClick={() => setIsSetPasswordOpen(false)}
                                    disabled={isSettingPassword}
                                >
                                    Cancel
                                </Button>
                                <Button 
                                    type="submit" 
                                    disabled={isSettingPassword}
                                    className="bg-blue-600 hover:bg-blue-700"
                                >
                                    {isSettingPassword && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Save App Password
                                </Button>
                            </DialogFooter>
                        </form>
                    )}
                </DialogContent>
            </Dialog>

            {/* Modal 3: Credentials Ready Handover Summary */}
            <Dialog open={Boolean(createdCredentials)} onOpenChange={(open) => !open && setCreatedCredentials(null)}>
                <DialogContent className="sm:max-w-[460px]">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-emerald-800">
                            <Check className="h-5 w-5 text-emerald-600" />
                            Faculty Credentials Ready!
                        </DialogTitle>
                        <DialogDescription>
                            The teacher account has been configured. Copy these details and share them with the teacher.
                        </DialogDescription>
                    </DialogHeader>

                    {createdCredentials && (
                        <div className="space-y-4 py-2">
                            <div className="p-4 bg-emerald-50/60 rounded-xl border border-emerald-200 space-y-3">
                                <div>
                                    <span className="text-[11px] font-semibold text-emerald-700 uppercase">Teacher Name</span>
                                    <p className="text-sm font-bold text-slate-900">{createdCredentials.name}</p>
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                    <div>
                                        <span className="text-[11px] font-semibold text-emerald-700 uppercase">Login ID / Username</span>
                                        <p className="text-sm font-mono font-bold text-slate-900">{createdCredentials.loginId}</p>
                                    </div>
                                    <div>
                                        <span className="text-[11px] font-semibold text-emerald-700 uppercase">Password</span>
                                        <p className="text-sm font-mono font-bold text-emerald-700">{createdCredentials.password}</p>
                                    </div>
                                </div>
                                {createdCredentials.schoolId && (
                                    <div>
                                        <span className="text-[11px] font-semibold text-emerald-700 uppercase">School ID</span>
                                        <p className="text-sm font-mono font-bold text-blue-700">{createdCredentials.schoolId}</p>
                                    </div>
                                )}
                            </div>

                            <p className="text-xs text-slate-500">
                                📱 <strong>To login on Android App:</strong> Open EduVision App, select/enter School ID, then type Login ID and Password above.
                            </p>

                            <DialogFooter className="pt-2 flex sm:justify-between items-center">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => {
                                        const handover = `EduVision Faculty Login Credentials
-----------------------------------
Teacher Name : ${createdCredentials.name}
Login ID     : ${createdCredentials.loginId}
Password     : ${createdCredentials.password}
${createdCredentials.schoolId ? `School ID    : ${createdCredentials.schoolId}\n` : ''}
Use these credentials on the EduVision Android App or School Dashboard.`
                                        copyToClipboard(handover, 'teacher_handover')
                                    }}
                                    className="text-xs"
                                >
                                    {copiedKey === 'teacher_handover' ? <Check className="h-3.5 w-3.5 mr-1 text-emerald-600" /> : <Copy className="h-3.5 w-3.5 mr-1" />}
                                    {copiedKey === 'teacher_handover' ? 'Copied Handover!' : 'Copy Credentials'}
                                </Button>
                                <Button 
                                    type="button" 
                                    onClick={() => setCreatedCredentials(null)}
                                    className="bg-emerald-600 hover:bg-emerald-700 text-white"
                                >
                                    Done
                                </Button>
                            </DialogFooter>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    )
}
