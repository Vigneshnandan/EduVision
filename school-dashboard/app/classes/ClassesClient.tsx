"use client"

import { useState } from "react"
import { ClassRecord } from "@/lib/types"
import { addClassAction, updateClassAction, deleteClassAction } from "./actions"
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Plus, School, Users, UserCheck, Edit3, Trash2, Loader2, Sparkles } from "lucide-react"

interface ClassesClientProps {
    initialClasses: ClassRecord[]
    teachers: { teacher_id: string; teacher_name: string }[]
}

export function ClassesClient({ initialClasses, teachers }: ClassesClientProps) {
    const [classes, setClasses] = useState<ClassRecord[]>(initialClasses)
    const [isAddOpen, setIsAddOpen] = useState(false)
    const [editingClass, setEditingClass] = useState<ClassRecord | null>(null)
    const [isSubmitting, setIsSubmitting] = useState(false)

    // Stats
    const totalClasses = classes.length
    const assignedCount = classes.filter(c => c.class_teacher_id).length
    const unassignedCount = totalClasses - assignedCount
    const totalStudents = classes.reduce((sum, c) => sum + (c.student_count || 0), 0)

    const handleAdd = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setIsSubmitting(true)
        const formData = new FormData(e.currentTarget)
        try {
            await addClassAction(formData)
            const newClassName = formData.get('className') as string
            const teacherId = formData.get('teacherId') as string
            const teacherObj = teachers.find(t => t.teacher_id === teacherId)
            
            setClasses(prev => [
                ...prev,
                {
                    class_id: `temp-${Date.now()}`,
                    school_id: '',
                    class_name: newClassName,
                    class_teacher_id: teacherId || null,
                    teacher_name: teacherObj?.teacher_name || null,
                    student_count: 0
                }
            ].sort((a, b) => a.class_name.localeCompare(b.class_name)))
            
            setIsAddOpen(false)
        } catch (err: any) {
            alert(err.message || "Failed to create class")
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleUpdate = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        if (!editingClass) return
        setIsSubmitting(true)
        const formData = new FormData(e.currentTarget)
        const newName = formData.get('className') as string
        const teacherId = formData.get('teacherId') as string
        try {
            await updateClassAction(editingClass.class_id, newName, teacherId || null)
            const teacherObj = teachers.find(t => t.teacher_id === teacherId)
            setClasses(prev => prev.map(c => c.class_id === editingClass.class_id ? {
                ...c,
                class_name: newName,
                class_teacher_id: teacherId || null,
                teacher_name: teacherObj?.teacher_name || null
            } : c))
            setEditingClass(null)
        } catch (err: any) {
            alert(err.message || "Failed to update class")
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleDelete = async (classId: string, className: string) => {
        if (!confirm(`Are you sure you want to delete "${className}"? Historical attendance will remain preserved.`)) {
            return
        }
        try {
            await deleteClassAction(classId)
            setClasses(prev => prev.filter(c => c.class_id !== classId))
        } catch (err: any) {
            alert(err.message || "Failed to delete class")
        }
    }

    return (
        <div className="space-y-6">
            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="bg-white border-slate-200">
                    <CardContent className="p-5 flex items-center gap-4">
                        <div className="h-12 w-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                            <School className="h-6 w-6" />
                        </div>
                        <div>
                            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Classes</p>
                            <h3 className="text-2xl font-bold text-slate-900">{totalClasses}</h3>
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-white border-slate-200">
                    <CardContent className="p-5 flex items-center gap-4">
                        <div className="h-12 w-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                            <UserCheck className="h-6 w-6" />
                        </div>
                        <div>
                            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Assigned Teachers</p>
                            <h3 className="text-2xl font-bold text-slate-900">{assignedCount}</h3>
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-white border-slate-200">
                    <CardContent className="p-5 flex items-center gap-4">
                        <div className="h-12 w-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                            <Users className="h-6 w-6" />
                        </div>
                        <div>
                            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Unassigned</p>
                            <h3 className="text-2xl font-bold text-slate-900">{unassignedCount}</h3>
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-white border-slate-200">
                    <CardContent className="p-5 flex items-center gap-4">
                        <div className="h-12 w-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                            <Sparkles className="h-6 w-6" />
                        </div>
                        <div>
                            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Enrolled Students</p>
                            <h3 className="text-2xl font-bold text-slate-900">{totalStudents}</h3>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Classes Table */}
            <Card className="shadow-sm">
                <CardHeader className="flex flex-row items-center justify-between pb-4">
                    <div>
                        <CardTitle className="text-xl font-bold text-slate-900">Academic Classes & Teachers</CardTitle>
                        <CardDescription>Assign class teachers and manage institutional class structures.</CardDescription>
                    </div>
                    <Button onClick={() => setIsAddOpen(true)} className="bg-blue-600 hover:bg-blue-700">
                        <Plus className="h-4 w-4 mr-2" /> Add Class
                    </Button>
                </CardHeader>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-slate-50/70">
                                <TableHead className="font-semibold text-slate-700">Class Name</TableHead>
                                <TableHead className="font-semibold text-slate-700">Assigned Class Teacher</TableHead>
                                <TableHead className="font-semibold text-slate-700">Students</TableHead>
                                <TableHead className="text-right font-semibold text-slate-700">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {classes.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={4} className="text-center py-10 text-slate-500">
                                        No classes configured yet. Click &quot;Add Class&quot; to create one.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                classes.map((c) => (
                                    <TableRow key={c.class_id} className="hover:bg-slate-50/50">
                                        <TableCell className="font-medium text-slate-900">
                                            <span className="inline-flex items-center px-2.5 py-1 rounded-md bg-blue-50 text-blue-700 font-semibold text-sm">
                                                {c.class_name}
                                            </span>
                                        </TableCell>
                                        <TableCell>
                                            {c.teacher_name ? (
                                                <span className="inline-flex items-center gap-1.5 text-slate-800 text-sm font-medium">
                                                    <UserCheck className="h-4 w-4 text-emerald-600" />
                                                    {c.teacher_name}
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200">
                                                    Unassigned
                                                </span>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-slate-600 text-sm font-medium">
                                            {c.student_count || 0} students
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex items-center justify-end gap-1">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => setEditingClass(c)}
                                                    className="text-slate-600 hover:text-blue-600 hover:bg-blue-50"
                                                >
                                                    <Edit3 className="h-4 w-4 mr-1" /> Edit
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => handleDelete(c.class_id, c.class_name)}
                                                    className="text-slate-400 hover:text-red-600 hover:bg-red-50"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            {/* Add Class Modal */}
            <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>Add New Class</DialogTitle>
                        <DialogDescription>
                            Create a class and assign a primary class teacher.
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleAdd} className="space-y-4 py-2">
                        <div className="space-y-2">
                            <Label htmlFor="className">Class Name (e.g. Class 5A)</Label>
                            <Input id="className" name="className" placeholder="Class 5A" required />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="teacherId">Class Teacher</Label>
                            <select
                                id="teacherId"
                                name="teacherId"
                                className="w-full h-10 px-3 py-2 border rounded-md text-sm bg-white border-input"
                            >
                                <option value="">-- No Teacher Assigned --</option>
                                {teachers.map(t => (
                                    <option key={t.teacher_id} value={t.teacher_id}>
                                        {t.teacher_name}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <DialogFooter className="pt-2">
                            <Button type="button" variant="outline" onClick={() => setIsAddOpen(false)}>
                                Cancel
                            </Button>
                            <Button type="submit" disabled={isSubmitting} className="bg-blue-600 hover:bg-blue-700">
                                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Create Class
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Edit Class Modal */}
            <Dialog open={!!editingClass} onOpenChange={(open) => !open && setEditingClass(null)}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>Edit Class: {editingClass?.class_name}</DialogTitle>
                        <DialogDescription>
                            Update class naming or assign a different teacher.
                        </DialogDescription>
                    </DialogHeader>
                    {editingClass && (
                        <form onSubmit={handleUpdate} className="space-y-4 py-2">
                            <div className="space-y-2">
                                <Label htmlFor="edit-className">Class Name</Label>
                                <Input
                                    id="edit-className"
                                    name="className"
                                    defaultValue={editingClass.class_name}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="edit-teacherId">Class Teacher</Label>
                                <select
                                    id="edit-teacherId"
                                    name="teacherId"
                                    defaultValue={editingClass.class_teacher_id || ""}
                                    className="w-full h-10 px-3 py-2 border rounded-md text-sm bg-white border-input"
                                >
                                    <option value="">-- No Teacher Assigned --</option>
                                    {teachers.map(t => (
                                        <option key={t.teacher_id} value={t.teacher_id}>
                                            {t.teacher_name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <DialogFooter className="pt-2">
                                <Button type="button" variant="outline" onClick={() => setEditingClass(null)}>
                                    Cancel
                                </Button>
                                <Button type="submit" disabled={isSubmitting} className="bg-blue-600 hover:bg-blue-700">
                                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Save Changes
                                </Button>
                            </DialogFooter>
                        </form>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    )
}
