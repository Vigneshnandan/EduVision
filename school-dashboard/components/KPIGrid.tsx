import { School, Users, UserCheck, LineChart, Sparkles } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface KPIGridProps {
    totalClasses?: number;
    totalStudents?: number;
    totalPresent: number;
    attendanceRate: number;
    todayManualCount?: number;
    todayAiCount?: number;
}

export function KPIGrid({ 
    totalClasses = 0, 
    totalStudents = 0, 
    totalPresent, 
    attendanceRate,
    todayManualCount = 0,
    todayAiCount = 0,
}: KPIGridProps) {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {/* Card 1: Total Academic Classes */}
            <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs hover:shadow-sm transition-all">
                <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                        Academic Classes
                    </span>
                    <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl">
                        <School className="h-5 w-5" />
                    </div>
                </div>
                <div className="mt-3">
                    <h3 className="text-3xl font-extrabold text-slate-900 tracking-tight">
                        {totalClasses}
                    </h3>
                    <p className="text-xs text-slate-500 mt-1 font-medium">
                        Active registered divisions
                    </p>
                </div>
            </div>

            {/* Card 2: Enrolled Students */}
            <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs hover:shadow-sm transition-all">
                <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                        Enrolled Students
                    </span>
                    <div className="p-2.5 bg-purple-50 text-purple-600 rounded-xl">
                        <Users className="h-5 w-5" />
                    </div>
                </div>
                <div className="mt-3">
                    <h3 className="text-3xl font-extrabold text-slate-900 tracking-tight">
                        {totalStudents}
                    </h3>
                    <p className="text-xs text-slate-500 mt-1 font-medium">
                        Active student directory
                    </p>
                </div>
            </div>

            {/* Card 3: Students Present Today */}
            <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs hover:shadow-sm transition-all">
                <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                        Students Present
                    </span>
                    <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl">
                        <UserCheck className="h-5 w-5" />
                    </div>
                </div>
                <div className="mt-3">
                    <h3 className="text-3xl font-extrabold text-emerald-700 tracking-tight">
                        {totalPresent}
                    </h3>
                    <p className="text-xs text-emerald-600 mt-1 font-medium flex items-center gap-1">
                        Verified present today
                    </p>
                </div>
            </div>

            {/* Card 4: Attendance Rate Today */}
            <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs hover:shadow-sm transition-all">
                <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                        Attendance Rate
                    </span>
                    <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl">
                        <LineChart className="h-5 w-5" />
                    </div>
                </div>
                <div className="mt-3">
                    <h3 className="text-3xl font-extrabold text-indigo-700 tracking-tight">
                        {isNaN(attendanceRate) ? "0.0" : Number(attendanceRate).toFixed(1)}%
                    </h3>
                    <p className="text-xs text-slate-500 mt-1 font-medium">
                        Campus average for session
                    </p>
                </div>
            </div>
        </div>
    );
}
