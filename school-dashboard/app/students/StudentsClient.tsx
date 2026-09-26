"use client";

import { useState } from "react";
import type { StudentProfile, StudentDayLog } from "@/lib/types";
import { saveStudentDetails, fetchStudentHistory } from "./actions";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
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
import { Search, Loader2, Edit2, Calendar, CheckCircle2, XCircle, AlertCircle, Info } from "lucide-react";
import { Label } from "@/components/ui/label";

interface StudentsClientProps {
    initialStudents: StudentProfile[];
}

export function StudentsClient({ initialStudents }: StudentsClientProps) {
    const [students, setStudents] = useState<StudentProfile[]>(initialStudents);
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedClass, setSelectedClass] = useState("All");

    // Edit State
    const [editingStudent, setEditingStudent] = useState<StudentProfile | null>(null);
    const [isSaving, setIsSaving] = useState(false);

    // Heatmap / History State
    const [heatmapStudent, setHeatmapStudent] = useState<StudentProfile | null>(null);
    const [historyLogs, setHistoryLogs] = useState<StudentDayLog[]>([]);
    const [loadingHistory, setLoadingHistory] = useState(false);
    const [selectedDayLog, setSelectedDayLog] = useState<StudentDayLog | null>(null);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingStudent) return;

        setIsSaving(true);
        try {
            await saveStudentDetails(editingStudent.student_id, editingStudent);
            setStudents(prev => prev.map(s => s.student_id === editingStudent.student_id ? editingStudent : s));
            setEditingStudent(null);
        } catch (err) {
            console.error("Failed to save", err);
            alert("Failed to save details");
        } finally {
            setIsSaving(false);
        }
    };

    const handleOpenHeatmap = async (student: StudentProfile) => {
        setHeatmapStudent(student);
        setLoadingHistory(true);
        setSelectedDayLog(null);
        try {
            const logs = await fetchStudentHistory(student.student_id);
            setHistoryLogs(logs);
            if (logs.length > 0) setSelectedDayLog(logs[0]);
        } catch (err) {
            console.error("Failed to fetch history:", err);
        } finally {
            setLoadingHistory(false);
        }
    };

    // Filter Logic
    const uniqueClasses = ["All", ...Array.from(new Set(students.map((s) => s.class_name)))];
    const filteredStudents = students.filter((s) => {
        const matchesSearch = s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            s.student_id.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesClass = selectedClass === "All" || s.class_name === selectedClass;
        return matchesSearch && matchesClass;
    });

    // Heatmap Grid: Build past 35 days calendar
    const heatmapDays = Array.from({ length: 35 }, (_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - (34 - i));
        const dateStr = d.toISOString().split('T')[0];
        const log = historyLogs.find(l => l.dateStr === dateStr);
        const isSunday = d.getDay() === 0;

        return {
            date: d,
            dateStr,
            dayNum: d.getDate(),
            log,
            isSunday
        };
    });

    // Heatmap stats
    const totalDaysRecorded = historyLogs.length;
    const presentCount = historyLogs.filter(l => l.isPresent).length;
    const manualCount = historyLogs.filter(l => l.isManual).length;
    const absentCount = historyLogs.filter(l => !l.isPresent).length;
    const attendancePct = totalDaysRecorded > 0 ? Math.round((presentCount / totalDaysRecorded) * 100) : 0;

    return (
        <div className="p-8 space-y-6 bg-slate-50 min-h-screen">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">Student Directory</h1>
                    <p className="text-slate-500 mt-1">Manage student profiles, extended details, and daily attendance heatmaps.</p>
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
                                {filteredStudents.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={7} className="text-center py-10 text-slate-500">
                                            No students found.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    filteredStudents.map((student) => (
                                        <TableRow key={student.student_id} className="hover:bg-slate-50/50 group">
                                            <TableCell className="font-mono text-xs text-slate-500">{student.student_id}</TableCell>
                                            <TableCell className="font-medium text-slate-900">
                                                <button
                                                    onClick={() => handleOpenHeatmap(student)}
                                                    className="text-left hover:text-blue-600 hover:underline font-semibold"
                                                >
                                                    {student.name}
                                                </button>
                                            </TableCell>
                                            <TableCell>
                                                <span className="inline-flex items-center px-2 py-1 rounded-md bg-blue-50 text-blue-700 text-xs font-medium">
                                                    {student.class_name}
                                                </span>
                                            </TableCell>
                                            <TableCell className="text-slate-600">{student.roll_number || "-"}</TableCell>
                                            <TableCell className="text-slate-600">{student.guardian_name || "-"}</TableCell>
                                            <TableCell className="text-slate-600">{student.contact_number || "-"}</TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex items-center justify-end gap-1">
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="text-blue-600 hover:bg-blue-50"
                                                        onClick={() => handleOpenHeatmap(student)}
                                                    >
                                                        <Calendar className="h-3.5 w-3.5 mr-1" /> Heatmap
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="opacity-0 group-hover:opacity-100 transition-opacity text-slate-600"
                                                        onClick={() => setEditingStudent(student)}
                                                    >
                                                        <Edit2 className="h-3.5 w-3.5 mr-1" /> Edit
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>

            {/* Attendance Calendar Heatmap Dialog */}
            <Dialog open={!!heatmapStudent} onOpenChange={(open) => !open && setHeatmapStudent(null)}>
                <DialogContent className="sm:max-w-[650px]">
                    <DialogHeader>
                        <div className="flex items-center justify-between">
                            <div>
                                <DialogTitle className="text-xl font-bold text-slate-900">
                                    {heatmapStudent?.name}
                                </DialogTitle>
                                <DialogDescription className="text-xs mt-0.5">
                                    Student ID: {heatmapStudent?.student_id} • Class: {heatmapStudent?.class_name} • Roll: {heatmapStudent?.roll_number || "N/A"}
                                </DialogDescription>
                            </div>
                        </div>
                    </DialogHeader>

                    {loadingHistory ? (
                        <div className="py-12 text-center text-slate-400">
                            <Loader2 className="h-6 w-6 animate-spin mx-auto text-blue-600" />
                            <p className="text-xs mt-2">Loading attendance calendar...</p>
                        </div>
                    ) : (
                        <div className="space-y-5 py-2">
                            {/* Summary KPI Badges */}
                            <div className="grid grid-cols-4 gap-3 text-center">
                                <div className="p-3 bg-slate-50 border rounded-lg">
                                    <p className="text-[10px] uppercase font-semibold text-slate-500">Attendance</p>
                                    <p className={`text-xl font-bold mt-0.5 ${attendancePct < 75 ? 'text-red-600' : 'text-emerald-600'}`}>
                                        {attendancePct}%
                                    </p>
                                </div>
                                <div className="p-3 bg-emerald-50/60 border border-emerald-100 rounded-lg">
                                    <p className="text-[10px] uppercase font-semibold text-emerald-700">Present Days</p>
                                    <p className="text-xl font-bold text-emerald-700 mt-0.5">{presentCount}</p>
                                </div>
                                <div className="p-3 bg-red-50/60 border border-red-100 rounded-lg">
                                    <p className="text-[10px] uppercase font-semibold text-red-700">Absent Days</p>
                                    <p className="text-xl font-bold text-red-700 mt-0.5">{absentCount}</p>
                                </div>
                                <div className="p-3 bg-amber-50/60 border border-amber-100 rounded-lg">
                                    <p className="text-[10px] uppercase font-semibold text-amber-700">Manual Edits</p>
                                    <p className="text-xl font-bold text-amber-700 mt-0.5">{manualCount}</p>
                                </div>
                            </div>

                            {/* 35-Day Heatmap Grid */}
                            <div>
                                <div className="flex items-center justify-between mb-2">
                                    <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                                        Last 35 Days Activity
                                    </h4>
                                    <div className="flex items-center gap-2 text-[10px] text-slate-500">
                                        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-emerald-500 inline-block" /> Present</span>
                                        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-amber-500 inline-block" /> Manual Override</span>
                                        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-red-400 inline-block" /> Absent</span>
                                        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-slate-200 inline-block" /> No record</span>
                                    </div>
                                </div>

                                <div className="grid grid-cols-7 gap-1.5 p-3 border rounded-xl bg-slate-50/50">
                                    {heatmapDays.map((d, idx) => {
                                        let bgClass = "bg-slate-200 text-slate-400 hover:border-slate-400";
                                        if (d.log?.isPresent) {
                                            if (d.log.isManual) {
                                                bgClass = "bg-amber-500 text-white font-bold shadow-sm hover:ring-2 hover:ring-amber-300";
                                            } else {
                                                bgClass = "bg-emerald-500 text-white font-bold shadow-sm hover:ring-2 hover:ring-emerald-300";
                                            }
                                        } else if (d.log && !d.log.isPresent) {
                                            bgClass = "bg-red-400 text-white font-bold shadow-sm hover:ring-2 hover:ring-red-300";
                                        } else if (d.isSunday) {
                                            bgClass = "bg-slate-100 text-slate-300";
                                        }

                                        const isSelected = selectedDayLog?.dateStr === d.dateStr;

                                        return (
                                            <button
                                                key={idx}
                                                type="button"
                                                onClick={() => d.log && setSelectedDayLog(d.log)}
                                                className={`h-9 rounded-lg flex flex-col items-center justify-center text-xs transition-all ${bgClass} ${isSelected ? 'ring-2 ring-blue-600 scale-105' : ''}`}
                                                title={`${d.dateStr}: ${d.log ? (d.log.isPresent ? (d.log.isManual ? 'Present (Manual)' : 'Present (Face AI)') : 'Absent') : (d.isSunday ? 'Sunday' : 'No data')}`}
                                            >
                                                <span className="text-[10px] leading-none">{d.dayNum}</span>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Selected Day Inspector / Manual Reason Box */}
                            {selectedDayLog && (
                                <div className="p-3.5 rounded-xl border bg-white shadow-sm space-y-1.5">
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs font-bold text-slate-800">
                                            Log for {selectedDayLog.dateStr}
                                        </span>
                                        {selectedDayLog.isPresent ? (
                                            <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                                                <CheckCircle2 className="h-3 w-3" /> Present
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center gap-1 text-xs font-semibold text-red-700 bg-red-50 px-2 py-0.5 rounded border border-red-200">
                                                <XCircle className="h-3 w-3" /> Absent
                                            </span>
                                        )}
                                    </div>

                                    {selectedDayLog.isManual && (
                                        <div className="mt-2 p-2.5 rounded-lg bg-amber-50/70 border border-amber-200 text-xs text-amber-900">
                                            <div className="flex items-center gap-1.5 font-semibold text-amber-800">
                                                <AlertCircle className="h-3.5 w-3.5 text-amber-600" />
                                                Manual Attendance Correction
                                            </div>
                                            <p className="mt-1 text-[11px] text-amber-700">
                                                <span className="font-medium">Marked by:</span> {selectedDayLog.markedBy || "Teacher Override"}
                                            </p>
                                            {selectedDayLog.correctionReason && (
                                                <p className="mt-0.5 text-[11px] text-amber-800 font-medium">
                                                    <span>Reason:</span> &quot;{selectedDayLog.correctionReason}&quot;
                                                </p>
                                            )}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )}
                </DialogContent>
            </Dialog>

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
