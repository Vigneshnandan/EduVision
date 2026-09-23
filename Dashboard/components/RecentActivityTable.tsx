"use client";

import React, { useState } from "react";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ChevronDown, ChevronRight, User } from "lucide-react";
import { format } from "date-fns";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

export interface AttendanceLog {
    id: number;
    student_id: string;
    name: string;
    class_name: string;
    is_present: boolean;
    timestamp: number;
    is_manual?: boolean;
    marked_by?: string;
}

export interface ClassBatch {
    className: string;
    lastSync: string;
    totalStudents: number;
    presentCount: number;
    students: AttendanceLog[];
}

interface RecentActivityTableProps {
    batches: ClassBatch[];
}

// Helper to get mock teacher name based on class
const getTeacherForClass = (className: string) => {
    const teachers: Record<string, string> = {
        "Class 10": "Mrs. Sharma",
        "Class 10 A": "Mr. Verma",
        "Class 9": "Ms. Gupta",
        "Class 9 B": "Mr. Singh",
        // Add more mappings or a default
    };
    return teachers[className] || "Staff Member";
};

export function RecentActivityTable({ batches }: RecentActivityTableProps) {
    const [expandedClasses, setExpandedClasses] = useState<string[]>([]);

    const toggleClass = (className: string) => {
        setExpandedClasses((prev) =>
            prev.includes(className)
                ? prev.filter((c) => c !== className)
                : [...prev, className]
        );
    };

    return (
        <Card className="shadow-sm border-gray-200 overflow-hidden">
            <CardHeader className="bg-gray-50 border-b border-gray-100 px-6 py-4">
                <CardTitle className="text-lg font-semibold text-gray-800">Recent Class Activity</CardTitle>
            </CardHeader>
            <div className="overflow-x-auto">
                <Table>
                    <TableHeader>
                        <TableRow className="bg-gray-50 hover:bg-gray-50">
                            <TableHead className="w-[50px]"></TableHead>
                            <TableHead className="font-semibold text-gray-600">Time</TableHead>
                            <TableHead className="font-semibold text-gray-600">School</TableHead>
                            <TableHead className="font-semibold text-gray-600">Teacher</TableHead>
                            <TableHead className="font-semibold text-gray-600">Class</TableHead>
                            <TableHead className="font-semibold text-gray-600">Attendance</TableHead>
                            <TableHead className="font-semibold text-gray-600">Status</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {batches.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                                    No recent activity found today.
                                </TableCell>
                            </TableRow>
                        ) : (
                            batches.map((batch) => {
                                const isExpanded = expandedClasses.includes(batch.className);
                                const teacherName = getTeacherForClass(batch.className);
                                const attendanceRate =
                                    batch.totalStudents > 0
                                        ? Math.round((batch.presentCount / batch.totalStudents) * 100)
                                        : 0;

                                return (
                                    <React.Fragment key={batch.className}>
                                        <TableRow
                                            className="cursor-pointer hover:bg-blue-50/50 transition-colors"
                                            onClick={() => toggleClass(batch.className)}
                                        >
                                            <TableCell>
                                                {isExpanded ? (
                                                    <ChevronDown className="h-4 w-4 text-gray-500" />
                                                ) : (
                                                    <ChevronRight className="h-4 w-4 text-gray-500" />
                                                )}
                                            </TableCell>
                                            <TableCell className="font-mono text-xs text-gray-600">
                                                {format(new Date(batch.lastSync), "h:mm a")}
                                            </TableCell>
                                            <TableCell className="text-gray-700">Govt High School</TableCell>
                                            <TableCell className="text-gray-700">{teacherName}</TableCell>
                                            <TableCell className="font-medium text-blue-700">
                                                {batch.className}
                                            </TableCell>
                                            <TableCell className="font-medium text-emerald-600">
                                                {batch.presentCount} / {batch.totalStudents}{" "}
                                                <span className="text-xs text-emerald-500 ml-1">
                                                    ({attendanceRate}%)
                                                </span>
                                            </TableCell>
                                            <TableCell>
                                                <Badge
                                                    variant="secondary"
                                                    className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border-none px-2 py-0.5"
                                                >
                                                    Synced
                                                </Badge>
                                            </TableCell>
                                        </TableRow>

                                        {/* Expanded Row for Student Details */}
                                        {isExpanded && (
                                            <TableRow className="bg-gray-50/50 hover:bg-gray-50/50">
                                                <TableCell colSpan={7} className="p-0 border-b">
                                                    <div className="p-4 pl-14 pr-8 animate-in fade-in slide-in-from-top-1 duration-200">
                                                        <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                                                            <User className="h-4 w-4" /> Student List ({batch.totalStudents})
                                                        </h4>
                                                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                                                            {batch.students.map((student) => (
                                                                <div
                                                                    key={student.id}
                                                                    className={`
                                        flex items-center gap-3 p-3 rounded-lg border text-sm
                                        ${student.is_present
                                                                            ? "bg-white border-emerald-100 shadow-sm"
                                                                            : "bg-red-50 border-red-100"
                                                                        }
                                    `}
                                                                >
                                                                    <div
                                                                        className={`
                                        w-2 h-2 rounded-full
                                        ${student.is_present ? "bg-emerald-500" : "bg-red-500"}
                                    `}
                                                                    />
                                                                    <div className="flex flex-col">
                                                                        <div className="flex items-center gap-1.5">
                                                                            <span className="font-medium text-gray-900">
                                                                                {student.name}
                                                                            </span>
                                                                            {student.is_manual && (
                                                                                <Badge variant="outline" className="text-[10px] px-1 py-0 border-amber-300 text-amber-700 bg-amber-50">
                                                                                    Manual
                                                                                </Badge>
                                                                            )}
                                                                        </div>
                                                                        <span className="text-xs text-gray-500">
                                                                            ID: {student.student_id}
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </React.Fragment>
                                );
                            })
                        )}
                    </TableBody>
                </Table>
            </div>
        </Card>
    );
}
