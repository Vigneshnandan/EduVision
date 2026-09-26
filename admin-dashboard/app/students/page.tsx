"use client";

import { useEffect, useState } from "react";
import { StudentProfile, getAllStudents, updateStudentDetails } from "@/lib/students";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { Search, Loader2, Edit2, Save } from "lucide-react";
import { Label } from "@/components/ui/label";

export default function StudentsPage() {
    const [students, setStudents] = useState<StudentProfile[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedClass, setSelectedClass] = useState("All");

    // Edit State
    const [editingStudent, setEditingStudent] = useState<StudentProfile | null>(null);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        loadStudents();
    }, []);

    const loadStudents = async () => {
        setLoading(true);
        const data = await getAllStudents();
        setStudents(data);
        setLoading(false);
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingStudent) return;

        setIsSaving(true);
        try {
            await updateStudentDetails(editingStudent.student_id, editingStudent);
            // Optimistic Update or Reload
            setStudents(prev => prev.map(s => s.student_id === editingStudent.student_id ? editingStudent : s));
            setEditingStudent(null);
        } catch (err) {
            console.error("Failed to save", err);
            alert("Failed to save details");
        } finally {
            setIsSaving(false);
        }
    }

    // Filter Logic
    const uniqueClasses = ["All", ...Array.from(new Set(students.map((s) => s.class_name)))];
    const filteredStudents = students.filter((s) => {
        const matchesSearch = s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            s.student_id.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesClass = selectedClass === "All" || s.class_name === selectedClass;
        return matchesSearch && matchesClass;
    });

    return (
        <div className="p-8 space-y-6 bg-slate-50 min-h-screen">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">Student Directory</h1>
                    <p className="text-slate-500 mt-1">Manage student profiles and extended details.</p>
                </div>
                <div className="flex gap-2">
                    <span className="bg-white px-3 py-1 rounded border text-sm font-medium text-slate-600 self-center">
                        Total: {students.length}
                    </span>
                </div>
            </div>

            <Card className="shadow-sm">
                <CardHeader className="bg-white border-b pb-4">
                    <div className="flex flex-col md:flex-row gap-4 justify-between">
                        <div className="relative w-full md:w-72">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-500" />
                            <Input
                                placeholder="Search by name or ID..."
                                className="pl-9"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-sm text-slate-500 text-nowrap">Filter Class:</span>
                            <select
                                className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                value={selectedClass}
                                onChange={(e) => setSelectedClass(e.target.value)}
                            >
                                {uniqueClasses.map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-slate-50/50">
                                    <TableHead className="w-[100px]">Student ID</TableHead>
                                    <TableHead>Name</TableHead>
                                    <TableHead>Class</TableHead>
                                    <TableHead>Roll No</TableHead>
                                    <TableHead>Guardian</TableHead>
                                    <TableHead>Contact</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading ? (
                                    <TableRow>
                                        <TableCell colSpan={7} className="text-center py-10">
                                            <Loader2 className="h-6 w-6 animate-spin mx-auto text-blue-600" />
                                            <p className="text-xs text-slate-400 mt-2">Loading Registry...</p>
                                        </TableCell>
                                    </TableRow>
                                ) : filteredStudents.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={7} className="text-center py-10 text-slate-500">
                                            No students found.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    filteredStudents.map((student) => (
                                        <TableRow key={student.student_id} className="hover:bg-slate-50/50 group">
                                            <TableCell className="font-mono text-xs text-slate-500">{student.student_id}</TableCell>
                                            <TableCell className="font-medium text-slate-900">{student.name}</TableCell>
                                            <TableCell>
                                                <span className="inline-flex items-center px-2 py-1 rounded-md bg-blue-50 text-blue-700 text-xs font-medium">
                                                    {student.class_name}
                                                </span>
                                            </TableCell>
                                            <TableCell className="text-slate-600">{student.roll_number || "-"}</TableCell>
                                            <TableCell className="text-slate-600">{student.guardian_name || "-"}</TableCell>
                                            <TableCell className="text-slate-600">{student.contact_number || "-"}</TableCell>
                                            <TableCell className="text-right">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="opacity-0 group-hover:opacity-100 transition-opacity"
                                                    onClick={() => setEditingStudent(student)}
                                                >
                                                    <Edit2 className="h-3.5 w-3.5 mr-1" /> Edit
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>

            {/* Edit Dialog */}
            <Dialog open={!!editingStudent} onOpenChange={(open) => !open && setEditingStudent(null)}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>Edit Student Details</DialogTitle>
                        <DialogDescription>
                            Add extended profile information for {editingStudent?.name}.
                        </DialogDescription>
                    </DialogHeader>
                    {editingStudent && (
                        <form onSubmit={handleSave} className="grid gap-4 py-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="grid gap-2">
                                    <Label>Roll Number</Label>
                                    <Input
                                        value={editingStudent.roll_number || ""}
                                        onChange={e => setEditingStudent({ ...editingStudent, roll_number: e.target.value })}
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label>Blood Group</Label>
                                    <Input
                                        value={editingStudent.blood_group || ""}
                                        onChange={e => setEditingStudent({ ...editingStudent, blood_group: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div className="grid gap-2">
                                <Label>Guardian Name</Label>
                                <Input
                                    value={editingStudent.guardian_name || ""}
                                    onChange={e => setEditingStudent({ ...editingStudent, guardian_name: e.target.value })}
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label>Contact Number</Label>
                                <Input
                                    value={editingStudent.contact_number || ""}
                                    onChange={e => setEditingStudent({ ...editingStudent, contact_number: e.target.value })}
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label>Address</Label>
                                <Input
                                    value={editingStudent.address || ""}
                                    onChange={e => setEditingStudent({ ...editingStudent, address: e.target.value })}
                                />
                            </div>
                            <DialogFooter className="mt-4">
                                <Button type="submit" disabled={isSaving}>
                                    {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Save Changes
                                </Button>
                            </DialogFooter>
                        </form>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}
