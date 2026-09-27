"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { DashboardHeader } from "@/components/DashboardHeader";
import { KPIGrid } from "@/components/KPIGrid";
import { RecentActivityTable } from "@/components/RecentActivityTable";
import { ClassPerformanceChart } from "@/components/ClassPerformanceChart";
import { WeeklyAttendanceChart } from "@/components/WeeklyAttendanceChart";
import { AbsenteeAlertBanner } from "@/components/AbsenteeAlertBanner";
import { DashboardData } from "@/lib/dashboard";

interface DashboardClientProps {
    initialData: DashboardData;
}

export function DashboardClient({ initialData }: DashboardClientProps) {
    const router = useRouter();
    const [isRefreshing, setIsRefreshing] = useState(false);

    const handleRefresh = async () => {
        setIsRefreshing(true);
        try {
            router.refresh();
        } finally {
            setTimeout(() => {
                setIsRefreshing(false);
            }, 600);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 font-sans text-gray-900 pb-10">
            <DashboardHeader
                schoolName={initialData.school.school_name}
                schoolId={initialData.school.school_id}
                lastSync={initialData.lastSync}
                onRefresh={handleRefresh}
                isLoading={isRefreshing}
            />

            <main className="w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
                {/* At-Risk Dropout Alert Banner */}
                <AbsenteeAlertBanner />

                {/* KPI Grid Section */}
                <KPIGrid
                    totalClasses={initialData.stats.totalClasses}
                    totalStudents={initialData.stats.totalStudents}
                    totalPresent={initialData.stats.totalPresent}
                    attendanceRate={initialData.stats.attendanceRate}
                />

                {/* Charts Section */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <ClassPerformanceChart data={initialData.classPerformance} />
                    <WeeklyAttendanceChart data={initialData.weeklyTrends} />
                </div>

                {/* Recent Activity Table Section */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-bold text-gray-800 tracking-tight">
                            Live Class Activity Feed
                        </h2>
                    </div>
                    <RecentActivityTable batches={initialData.batches} />
                </div>
            </main>
        </div>
    );
}
