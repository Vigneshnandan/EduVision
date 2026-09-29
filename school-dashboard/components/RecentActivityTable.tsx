"use client";

import React, { useState, useMemo } from "react";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
    ChevronDown,
    ChevronRight,
    User,
    UserCheck,
    UserX,
    Clock,
    ShieldCheck,
    AlertCircle,
    Edit3,
    Search,
    Layers,
    ListFilter,
    Sparkles,
    CheckCircle2,
    XCircle,
    School,
    Info,
} from "lucide-react";
import { format } from "date-fns";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export interface AttendanceLog {
    id: number | string;
    student_id: string;
    name: string;
    class_name: string;
    roll_number?: string;
    is_present: boolean;
    timestamp: number;
    is_manual?: boolean;
    marked_by?: string;
    marked_by_name?: string;
    correction_reason?: string;
}

export interface ClassBatch {
    className: string;
    lastSync: string;
    totalStudents: number;
    presentCount: number;
    absentCount?: number;
    manualCount?: number;
    aiCount?: number;
    teacherName?: string;
    markedBy?: string;
    students: AttendanceLog[];
}

interface RecentActivityTableProps {
    batches: ClassBatch[];
    recentLogs?: AttendanceLog[];
}

export function RecentActivityTable({ batches, recentLogs = [] }: RecentActivityTableProps) {
    const [expandedClasses, setExpandedClasses] = useState<string[]>(
        batches.length > 0 ? [batches[0].className] : []
    );
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedClass, setSelectedClass] = useState<string>("ALL");
    const [selectedMode, setSelectedMode] = useState<"ALL" | "AI" | "MANUAL">("ALL");
    const [selectedStatus, setSelectedStatus] = useState<"ALL" | "PRESENT" | "ABSENT">("ALL");
    const [viewMode, setViewMode] = useState<"batches" | "stream">("batches");

    // All available classes
    const classNames = useMemo(() => {
        const set = new Set<string>();
        batches.forEach((b) => set.add(b.className));
        return Array.from(set).sort();
    }, [batches]);

    // Compute summary statistics across all batches
    const stats = useMemo(() => {
        let totalRecords = 0;
        let totalPresent = 0;
        let totalManual = 0;
        let totalAi = 0;

        batches.forEach((b) => {
            b.students.forEach((s) => {
                totalRecords++;
                if (s.is_present) totalPresent++;
                if (s.is_manual) totalManual++;
                else totalAi++;
            });
        });

        return {
            totalBatches: batches.length,
            totalRecords,
            totalPresent,
            totalAbsent: totalRecords - totalPresent,
            totalManual,
            totalAi,
            manualPercentage: totalRecords > 0 ? Math.round((totalManual / totalRecords) * 100) : 0,
        };
    }, [batches]);

    const toggleClass = (className: string) => {
        setExpandedClasses((prev) =>
            prev.includes(className)
                ? prev.filter((c) => c !== className)
                : [...prev, className]
        );
    };

    // Filtered Batches
    const filteredBatches = useMemo(() => {
        return batches
            .filter((b) => selectedClass === "ALL" || b.className === selectedClass)
            .map((b) => {
                const filteredStudents = b.students.filter((s) => {
                    const matchesSearch =
                        !searchQuery ||
                        s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        s.student_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        (s.roll_number && s.roll_number.toLowerCase().includes(searchQuery.toLowerCase())) ||
                        (s.marked_by_name && s.marked_by_name.toLowerCase().includes(searchQuery.toLowerCase())) ||
                        (s.correction_reason && s.correction_reason.toLowerCase().includes(searchQuery.toLowerCase()));

                    const matchesMode =
                        selectedMode === "ALL" ||
                        (selectedMode === "AI" && !s.is_manual) ||
                        (selectedMode === "MANUAL" && s.is_manual);

                    const matchesStatus =
                        selectedStatus === "ALL" ||
                        (selectedStatus === "PRESENT" && s.is_present) ||
                        (selectedStatus === "ABSENT" && !s.is_present);

                    return matchesSearch && matchesMode && matchesStatus;
                });

                return {
                    ...b,
                    filteredStudents,
                };
            })
            .filter((b) => b.filteredStudents.length > 0 || !searchQuery);
    }, [batches, selectedClass, searchQuery, selectedMode, selectedStatus]);

    // Flat chronological stream of logs
    const flatStreamLogs = useMemo(() => {
        const pool = recentLogs.length > 0 ? recentLogs : batches.flatMap((b) => b.students);
        return pool
            .filter((s) => {
                const matchesClass = selectedClass === "ALL" || s.class_name === selectedClass;
                const matchesSearch =
                    !searchQuery ||
                    s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    s.student_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    (s.roll_number && s.roll_number.toLowerCase().includes(searchQuery.toLowerCase())) ||
                    (s.marked_by_name && s.marked_by_name.toLowerCase().includes(searchQuery.toLowerCase())) ||
                    (s.correction_reason && s.correction_reason.toLowerCase().includes(searchQuery.toLowerCase()));

                const matchesMode =
                    selectedMode === "ALL" ||
                    (selectedMode === "AI" && !s.is_manual) ||
                    (selectedMode === "MANUAL" && s.is_manual);

                const matchesStatus =
                    selectedStatus === "ALL" ||
                    (selectedStatus === "PRESENT" && s.is_present) ||
                    (selectedStatus === "ABSENT" && !s.is_present);

                return matchesClass && matchesSearch && matchesMode && matchesStatus;
            })
            .sort((a, b) => b.timestamp - a.timestamp);
    }, [recentLogs, batches, selectedClass, searchQuery, selectedMode, selectedStatus]);

    return (
        <div className="space-y-6">
            {/* Top Stat Strip */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white border border-slate-200/80 rounded-xl p-4 shadow-xs">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                            Synced Classes
                        </span>
                        <div className="h-8 w-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                            <School className="h-4 w-4" />
                        </div>
                    </div>
                    <div className="mt-2 flex items-baseline gap-2">
                        <span className="text-2xl font-bold text-slate-900">{stats.totalBatches}</span>
                        <span className="text-xs text-slate-500">Batches Today</span>
                    </div>
                </div>

                <div className="bg-white border border-slate-200/80 rounded-xl p-4 shadow-xs">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                            Attendance Captured
                        </span>
                        <div className="h-8 w-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                            <UserCheck className="h-4 w-4" />
                        </div>
                    </div>
                    <div className="mt-2 flex items-baseline gap-2">
                        <span className="text-2xl font-bold text-emerald-700">{stats.totalPresent}</span>
                        <span className="text-xs text-slate-500">
                            / {stats.totalRecords} ({stats.totalRecords > 0 ? Math.round((stats.totalPresent / stats.totalRecords) * 100) : 0}%)
                        </span>
                    </div>
                </div>

                <div className="bg-white border border-slate-200/80 rounded-xl p-4 shadow-xs">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                            Face AI Verified
                        </span>
                        <div className="h-8 w-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                            <Sparkles className="h-4 w-4" />
                        </div>
                    </div>
                    <div className="mt-2 flex items-baseline gap-2">
                        <span className="text-2xl font-bold text-indigo-700">{stats.totalAi}</span>
                        <Badge variant="outline" className="bg-indigo-50 text-indigo-700 border-indigo-200 text-[11px] font-semibold">
                            Biometric
                        </Badge>
                    </div>
                </div>

                <div className="bg-white border border-slate-200/80 rounded-xl p-4 shadow-xs">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                            Manual Overrides
                        </span>
                        <div className="h-8 w-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
                            <Edit3 className="h-4 w-4" />
                        </div>
                    </div>
                    <div className="mt-2 flex items-baseline gap-2">
                        <span className="text-2xl font-bold text-amber-700">{stats.totalManual}</span>
                        <Badge
                            variant="outline"
                            className={
                                stats.totalManual > 0
                                    ? "bg-amber-50 text-amber-700 border-amber-200 text-[11px] font-semibold"
                                    : "bg-slate-50 text-slate-500 border-slate-200 text-[11px]"
                            }
                        >
                            {stats.manualPercentage}% of total
                        </Badge>
                    </div>
                </div>
            </div>

            {/* Filter & View Switcher Card */}
            <div className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-xs space-y-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    {/* Search Input */}
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                        <Input
                            placeholder="Search by student, ID, teacher, or override reason..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-9 h-9 text-sm bg-slate-50/50 border-slate-200 focus:bg-white"
                        />
                        {searchQuery && (
                            <button
                                onClick={() => setSearchQuery("")}
                                className="absolute right-2.5 top-2.5 text-xs text-slate-400 hover:text-slate-600"
                            >
                                Clear
                            </button>
                        )}
                    </div>

                    {/* View Switcher Toggle */}
                    <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg self-start md:self-auto">
                        <button
                            onClick={() => setViewMode("batches")}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                                viewMode === "batches"
                                    ? "bg-white text-blue-700 shadow-xs"
                                    : "text-slate-600 hover:text-slate-900"
                            }`}
                        >
                            <Layers className="h-3.5 w-3.5" />
                            Class Batches View
                        </button>
                        <button
                            onClick={() => setViewMode("stream")}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                                viewMode === "stream"
                                    ? "bg-white text-blue-700 shadow-xs"
                                    : "text-slate-600 hover:text-slate-900"
                            }`}
                        >
                            <ListFilter className="h-3.5 w-3.5" />
                            Audit Trail Stream
                        </button>
                    </div>
                </div>

                {/* Filter Pills Bar */}
                <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100 text-xs">
                    <span className="font-semibold text-slate-500 mr-1 flex items-center gap-1">
                        Filters:
                    </span>

                    {/* Class Filter */}
                    <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 rounded-lg p-0.5">
                        <button
                            onClick={() => setSelectedClass("ALL")}
                            className={`px-2.5 py-1 rounded-md font-medium transition-all ${
                                selectedClass === "ALL"
                                    ? "bg-blue-600 text-white shadow-xs"
                                    : "text-slate-600 hover:text-slate-900"
                            }`}
                        >
                            All Classes
                        </button>
                        {classNames.map((cls) => (
                            <button
                                key={cls}
                                onClick={() => setSelectedClass(cls)}
                                className={`px-2.5 py-1 rounded-md font-medium transition-all ${
                                    selectedClass === cls
                                        ? "bg-blue-600 text-white shadow-xs"
                                        : "text-slate-600 hover:text-slate-900"
                                }`}
                            >
                                {cls}
                            </button>
                        ))}
                    </div>

                    {/* Verification Mode Filter */}
                    <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 rounded-lg p-0.5">
                        <button
                            onClick={() => setSelectedMode("ALL")}
                            className={`px-2.5 py-1 rounded-md font-medium transition-all ${
                                selectedMode === "ALL"
                                    ? "bg-slate-800 text-white shadow-xs"
                                    : "text-slate-600 hover:text-slate-900"
                            }`}
                        >
                            All Modes
                        </button>
                        <button
                            onClick={() => setSelectedMode("AI")}
                            className={`px-2.5 py-1 rounded-md font-medium transition-all flex items-center gap-1 ${
                                selectedMode === "AI"
                                    ? "bg-emerald-600 text-white shadow-xs"
                                    : "text-emerald-700 hover:text-emerald-900"
                            }`}
                        >
                            <Sparkles className="h-3 w-3" />
                            Face AI
                        </button>
                        <button
                            onClick={() => setSelectedMode("MANUAL")}
                            className={`px-2.5 py-1 rounded-md font-medium transition-all flex items-center gap-1 ${
                                selectedMode === "MANUAL"
                                    ? "bg-amber-600 text-white shadow-xs"
                                    : "text-amber-700 hover:text-amber-900"
                            }`}
                        >
                            <Edit3 className="h-3 w-3" />
                            Manual Overrides
                        </button>
                    </div>

                    {/* Attendance Status Filter */}
                    <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 rounded-lg p-0.5">
                        <button
                            onClick={() => setSelectedStatus("ALL")}
                            className={`px-2.5 py-1 rounded-md font-medium transition-all ${
                                selectedStatus === "ALL"
                                    ? "bg-slate-800 text-white shadow-xs"
                                    : "text-slate-600 hover:text-slate-900"
                            }`}
                        >
                            All Status
                        </button>
                        <button
                            onClick={() => setSelectedStatus("PRESENT")}
                            className={`px-2.5 py-1 rounded-md font-medium transition-all ${
                                selectedStatus === "PRESENT"
                                    ? "bg-emerald-600 text-white shadow-xs"
                                    : "text-emerald-700 hover:text-emerald-900"
                            }`}
                        >
                            Present
                        </button>
                        <button
                            onClick={() => setSelectedStatus("ABSENT")}
                            className={`px-2.5 py-1 rounded-md font-medium transition-all ${
                                selectedStatus === "ABSENT"
                                    ? "bg-rose-600 text-white shadow-xs"
                                    : "text-rose-700 hover:text-rose-900"
                            }`}
                        >
                            Absent
                        </button>
                    </div>

                    {(selectedClass !== "ALL" || selectedMode !== "ALL" || selectedStatus !== "ALL" || searchQuery) && (
                        <button
                            onClick={() => {
                                setSelectedClass("ALL");
                                setSelectedMode("ALL");
                                setSelectedStatus("ALL");
                                setSearchQuery("");
                            }}
                            className="text-xs text-blue-600 hover:text-blue-800 underline ml-auto"
                        >
                            Reset Filters
                        </button>
                    )}
                </div>
            </div>

            {/* VIEW MODE 1: CLASS BATCHES VIEW */}
            {viewMode === "batches" && (
                <div className="space-y-4">
                    {filteredBatches.length === 0 ? (
                        <Card className="border-dashed border-2 border-slate-200 p-12 text-center">
                            <Info className="h-10 w-10 text-slate-400 mx-auto mb-3" />
                            <h4 className="text-base font-semibold text-slate-800">No attendance activity found</h4>
                            <p className="text-sm text-slate-500 mt-1 max-w-sm mx-auto">
                                No class batches match your current filter criteria or have synced today.
                            </p>
                        </Card>
                    ) : (
                        filteredBatches.map((batch) => {
                            const isExpanded = expandedClasses.includes(batch.className);
                            const teacherName = batch.teacherName || "Unassigned";
                            const loggedBy = batch.markedBy || batch.teacherName || "Staff Member";
                            const total = batch.totalStudents;
                            const present = batch.presentCount;
                            const rate = total > 0 ? Math.round((present / total) * 100) : 0;
                            const manualCount = batch.manualCount ?? batch.students.filter((s) => s.is_manual).length;
                            const aiCount = batch.aiCount ?? (total - manualCount);
                            const studentsToShow = batch.filteredStudents || batch.students;

                            return (
                                <div
                                    key={batch.className}
                                    className="bg-white border border-slate-200/90 rounded-xl overflow-hidden shadow-xs hover:border-blue-200 transition-all"
                                >
                                    {/* Batch Card Header */}
                                    <div
                                        className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 cursor-pointer bg-gradient-to-r from-white via-white to-slate-50/50 hover:bg-slate-50/80 transition-colors"
                                        onClick={() => toggleClass(batch.className)}
                                    >
                                        {/* Class & Teacher Metadata */}
                                        <div className="flex items-start sm:items-center gap-3.5">
                                            <div className="h-11 w-11 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center shrink-0 text-blue-600 font-bold">
                                                {isExpanded ? (
                                                    <ChevronDown className="h-5 w-5 text-blue-600" />
                                                ) : (
                                                    <ChevronRight className="h-5 w-5 text-blue-600" />
                                                )}
                                            </div>

                                            <div>
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <span className="text-base font-bold text-slate-900">
                                                        Class {batch.className}
                                                    </span>
                                                    <Badge
                                                        variant="secondary"
                                                        className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs px-2 py-0.5 font-medium"
                                                    >
                                                        Cloud Synced
                                                    </Badge>
                                                    {manualCount > 0 && (
                                                        <Badge
                                                            variant="outline"
                                                            className="bg-amber-50 text-amber-800 border-amber-300 text-xs px-2 py-0.5 font-semibold flex items-center gap-1"
                                                        >
                                                            <AlertCircle className="h-3 w-3 text-amber-600" />
                                                            {manualCount} Manual {manualCount === 1 ? "Override" : "Overrides"}
                                                        </Badge>
                                                    )}
                                                </div>

                                                <div className="flex items-center gap-3 text-xs text-slate-500 mt-1 flex-wrap">
                                                    <span className="flex items-center gap-1">
                                                        <User className="h-3.5 w-3.5 text-slate-400" />
                                                        Teacher: <strong className="text-slate-700 font-medium">{teacherName}</strong>
                                                    </span>
                                                    <span className="text-slate-300">•</span>
                                                    <span className="flex items-center gap-1 text-slate-600">
                                                        Logged By: <strong className="text-slate-800 font-semibold">{loggedBy}</strong>
                                                    </span>
                                                    <span className="text-slate-300">•</span>
                                                    <span className="flex items-center gap-1 font-mono text-slate-500">
                                                        <Clock className="h-3.5 w-3.5 text-slate-400" />
                                                        {format(new Date(batch.lastSync), "h:mm a • MMM d")}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Attendance Metric & Method Pills */}
                                        <div className="flex items-center gap-4 self-end md:self-center">
                                            <div className="text-right">
                                                <div className="flex items-center gap-2 justify-end">
                                                    <span className="text-sm font-bold text-slate-900">
                                                        {present} / {total} Present
                                                    </span>
                                                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                                                        rate >= 75 ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"
                                                    }`}>
                                                        {rate}%
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-0.5 justify-end">
                                                    <span className="text-emerald-700 font-medium flex items-center gap-0.5">
                                                        <Sparkles className="h-2.5 w-2.5" /> {aiCount} AI Verified
                                                    </span>
                                                    {manualCount > 0 && (
                                                        <>
                                                            <span>•</span>
                                                            <span className="text-amber-700 font-medium">
                                                                {manualCount} Manual
                                                            </span>
                                                        </>
                                                    )}
                                                </div>
                                            </div>

                                            <button
                                                className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors flex items-center gap-1 shrink-0"
                                            >
                                                {isExpanded ? "Hide Roster" : "View Roster"}
                                            </button>
                                        </div>
                                    </div>

                                    {/* Expanded Student Breakdown */}
                                    {isExpanded && (
                                        <div className="border-t border-slate-100 bg-slate-50/50 p-5 space-y-4">
                                            <div className="flex items-center justify-between text-xs font-semibold text-slate-600 px-1">
                                                <span>
                                                    Class Attendance Audit Roster ({studentsToShow.length} {studentsToShow.length === 1 ? "student" : "students"})
                                                </span>
                                                <span className="text-slate-400 font-normal">
                                                    Click on student to view audit log details
                                                </span>
                                            </div>

                                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                                {studentsToShow.map((student) => {
                                                    const isManual = student.is_manual;
                                                    const reason = student.correction_reason;
                                                    const markedByStaff = student.marked_by_name || student.marked_by || loggedBy;

                                                    return (
                                                        <div
                                                            key={student.id}
                                                            className={`p-3.5 rounded-xl border transition-all text-xs flex flex-col justify-between gap-2.5 ${
                                                                student.is_present
                                                                    ? isManual
                                                                        ? "bg-white border-amber-200/80 shadow-xs"
                                                                        : "bg-white border-emerald-100 shadow-xs"
                                                                    : "bg-red-50/50 border-red-200/80"
                                                            }`}
                                                        >
                                                            {/* Student Header */}
                                                            <div className="flex items-start justify-between gap-2">
                                                                <div className="flex items-start gap-2.5">
                                                                    <div
                                                                        className={`mt-0.5 h-2.5 w-2.5 rounded-full shrink-0 ${
                                                                            student.is_present ? "bg-emerald-500" : "bg-red-500"
                                                                        }`}
                                                                    />
                                                                    <div>
                                                                        <h5 className="font-bold text-slate-900 text-sm leading-tight">
                                                                            {student.name}
                                                                        </h5>
                                                                        <div className="flex items-center gap-1.5 text-slate-500 text-[11px] mt-0.5">
                                                                            <span>ID: {student.student_id}</span>
                                                                            {student.roll_number && (
                                                                                <>
                                                                                    <span>•</span>
                                                                                    <span>Roll: {student.roll_number}</span>
                                                                                </>
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                </div>

                                                                {/* Attendance Status Pill */}
                                                                <Badge
                                                                    variant="outline"
                                                                    className={`text-[10px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1 ${
                                                                        student.is_present
                                                                            ? "bg-emerald-50 text-emerald-700 border-emerald-300"
                                                                            : "bg-rose-50 text-rose-700 border-rose-300"
                                                                    }`}
                                                                >
                                                                    {student.is_present ? (
                                                                        <>
                                                                            <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                                                                            Present
                                                                        </>
                                                                    ) : (
                                                                        <>
                                                                            <XCircle className="h-3 w-3 text-rose-600" />
                                                                            Absent
                                                                        </>
                                                                    )}
                                                                </Badge>
                                                            </div>

                                                            {/* Verification Method & Logged By */}
                                                            <div className="flex items-center justify-between text-[11px] pt-2 border-t border-slate-100 text-slate-500">
                                                                <span className="flex items-center gap-1">
                                                                    {isManual ? (
                                                                        <Badge
                                                                            variant="outline"
                                                                            className="bg-amber-50 text-amber-800 border-amber-300 text-[10px] font-semibold px-1.5 py-0 flex items-center gap-1"
                                                                        >
                                                                            <Edit3 className="h-2.5 w-2.5 text-amber-600" />
                                                                            Manual Override
                                                                        </Badge>
                                                                    ) : (
                                                                        <Badge
                                                                            variant="outline"
                                                                            className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px] font-semibold px-1.5 py-0 flex items-center gap-1"
                                                                        >
                                                                            <Sparkles className="h-2.5 w-2.5 text-emerald-600" />
                                                                            Face AI
                                                                        </Badge>
                                                                    )}
                                                                </span>

                                                                <span className="text-slate-500">
                                                                    By: <strong className="text-slate-700">{markedByStaff}</strong>
                                                                </span>
                                                            </div>

                                                            {/* If Manual: Highlight Reason Prominently */}
                                                            {isManual && (
                                                                <div className="bg-amber-50/90 border border-amber-200/90 rounded-lg p-2 text-amber-900 text-[11px] space-y-0.5">
                                                                    <div className="flex items-center gap-1 font-semibold text-amber-800">
                                                                        <AlertCircle className="h-3 w-3 text-amber-600 shrink-0" />
                                                                        Override Reason:
                                                                    </div>
                                                                    <p className="pl-4 font-medium italic text-amber-950">
                                                                        "{reason || "Manual entry recorded without reason notes"}"
                                                                    </p>
                                                                </div>
                                                            )}
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })
                    )}
                </div>
            )}

            {/* VIEW MODE 2: AUDIT TRAIL STREAM */}
            {viewMode === "stream" && (
                <Card className="border-slate-200 shadow-xs overflow-hidden">
                    <CardHeader className="bg-slate-50/70 border-b border-slate-100 py-3.5 px-6">
                        <div className="flex items-center justify-between">
                            <CardTitle className="text-sm font-bold text-slate-800 flex items-center gap-2">
                                <ListFilter className="h-4 w-4 text-blue-600" />
                                Chronological Attendance Audit Stream ({flatStreamLogs.length} Records)
                            </CardTitle>
                            <span className="text-xs text-slate-500 font-mono">
                                Sorted: Most Recent First
                            </span>
                        </div>
                    </CardHeader>

                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-slate-50 hover:bg-slate-50 text-xs">
                                    <TableHead className="font-semibold text-slate-600">Time</TableHead>
                                    <TableHead className="font-semibold text-slate-600">Class</TableHead>
                                    <TableHead className="font-semibold text-slate-600">Student</TableHead>
                                    <TableHead className="font-semibold text-slate-600">Status</TableHead>
                                    <TableHead className="font-semibold text-slate-600">Verification</TableHead>
                                    <TableHead className="font-semibold text-slate-600">Logged By</TableHead>
                                    <TableHead className="font-semibold text-slate-600 min-w-[200px]">Audit Notes / Reason</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {flatStreamLogs.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={7} className="text-center py-10 text-slate-500 text-sm">
                                            No student records match the active filter criteria.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    flatStreamLogs.map((log) => {
                                        const isManual = log.is_manual;
                                        const reason = log.correction_reason;
                                        const staff = log.marked_by_name || log.marked_by || "Staff";

                                        return (
                                            <TableRow key={log.id} className="hover:bg-slate-50/60 text-xs">
                                                <TableCell className="font-mono text-slate-500 whitespace-nowrap">
                                                    {format(new Date(log.timestamp), "h:mm:ss a")}
                                                </TableCell>
                                                <TableCell className="font-bold text-blue-700 whitespace-nowrap">
                                                    Class {log.class_name}
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex flex-col">
                                                        <span className="font-bold text-slate-900">{log.name}</span>
                                                        <span className="text-[11px] text-slate-400">
                                                            ID: {log.student_id} {log.roll_number && `• Roll: ${log.roll_number}`}
                                                        </span>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <Badge
                                                        variant="outline"
                                                        className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                                                            log.is_present
                                                                ? "bg-emerald-50 text-emerald-700 border-emerald-300"
                                                                : "bg-rose-50 text-rose-700 border-rose-300"
                                                        }`}
                                                    >
                                                        {log.is_present ? "Present" : "Absent"}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>
                                                    {isManual ? (
                                                        <Badge
                                                            variant="outline"
                                                            className="bg-amber-50 text-amber-800 border-amber-300 text-[10px] font-semibold px-2 py-0.5 flex items-center gap-1 w-fit"
                                                        >
                                                            <Edit3 className="h-3 w-3 text-amber-600" />
                                                            Manual
                                                        </Badge>
                                                    ) : (
                                                        <Badge
                                                            variant="outline"
                                                            className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px] font-semibold px-2 py-0.5 flex items-center gap-1 w-fit"
                                                        >
                                                            <Sparkles className="h-3 w-3 text-emerald-600" />
                                                            Face AI
                                                        </Badge>
                                                    )}
                                                </TableCell>
                                                <TableCell className="font-medium text-slate-700">
                                                    {staff}
                                                </TableCell>
                                                <TableCell>
                                                    {isManual ? (
                                                        <div className="bg-amber-50 border border-amber-200 text-amber-900 px-2 py-1 rounded text-[11px] font-medium flex items-center gap-1">
                                                            <AlertCircle className="h-3 w-3 text-amber-600 shrink-0" />
                                                            <span>Reason: <strong>{reason || "Manual Override"}</strong></span>
                                                        </div>
                                                    ) : (
                                                        <span className="text-emerald-700 font-medium flex items-center gap-1">
                                                            <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
                                                            Biometric Match Verified
                                                        </span>
                                                    )}
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </Card>
            )}
        </div>
    );
}
