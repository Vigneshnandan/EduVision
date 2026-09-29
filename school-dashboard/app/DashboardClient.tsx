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
import {
    LayoutDashboard,
    Radio,
    ArrowRight,
    Clock,
    UserCheck,
    Sparkles,
    AlertCircle,
    School,
    ShieldCheck,
    CheckCircle2,
    Calendar,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

interface DashboardClientProps {
    initialData: DashboardData;
}

export function DashboardClient({ initialData }: DashboardClientProps) {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState<"overview" | "live-feed">("overview");
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

    const latestBatch = initialData.batches.length > 0 ? initialData.batches[0] : null;

    return (
        <div className="min-h-screen bg-slate-50/60 font-sans text-slate-900 pb-16">
            {/* Top Navigation & School Header */}
            <DashboardHeader
                schoolName={initialData.school.school_name}
                schoolId={initialData.school.school_id}
                lastSync={initialData.lastSync}
                onRefresh={handleRefresh}
                isLoading={isRefreshing}
            />

            {/* Sticky Modern Tab Navigation Bar */}
            <div className="bg-white border-b border-slate-200/80 sticky top-16 z-20 shadow-xs">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-14">
                        <div className="flex items-center space-x-1 sm:space-x-3">
                            {/* Tab 1: Executive Overview */}
                            <button
                                onClick={() => setActiveTab("overview")}
                                className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg transition-all ${
                                    activeTab === "overview"
                                        ? "bg-blue-50 text-blue-700 shadow-xs font-bold"
                                        : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                                }`}
                            >
                                <LayoutDashboard className="h-4 w-4" />
                                <span>Overview & Analytics</span>
                            </button>

                            {/* Tab 2: Live Activity & Audit Feed */}
                            <button
                                onClick={() => setActiveTab("live-feed")}
                                className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg transition-all ${
                                    activeTab === "live-feed"
                                        ? "bg-blue-50 text-blue-700 shadow-xs font-bold"
                                        : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                                }`}
                            >
                                <span className="relative flex h-2.5 w-2.5">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                                </span>
                                <span>Live Activity & Audit Feed</span>
                                <Badge
                                    variant="secondary"
                                    className="ml-1 bg-emerald-100/80 text-emerald-800 text-[11px] font-bold px-2 py-0.5 rounded-full"
                                >
                                    {initialData.batches.length}{" "}
                                    {initialData.batches.length === 1 ? "Class" : "Classes"}
                                </Badge>
                            </button>
                        </div>

                        {/* Quick Status Pill */}
                        <div className="hidden sm:flex items-center gap-2 text-xs text-slate-500">
                            <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
                            <span className="font-medium text-slate-600">Cloud Sync Connected</span>
                            <span className="text-slate-300">•</span>
                            <span className="font-mono text-slate-500">{initialData.lastSync}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content Area */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* TAB 1: EXECUTIVE OVERVIEW */}
                {activeTab === "overview" && (
                    <div className="space-y-8 animate-in fade-in duration-150">
                        {/* At-Risk Dropout Alert Banner */}
                        <AbsenteeAlertBanner />

                        {/* KPI Cards Grid */}
                        <KPIGrid
                            totalClasses={initialData.stats.totalClasses}
                            totalStudents={initialData.stats.totalStudents}
                            totalPresent={initialData.stats.totalPresent}
                            attendanceRate={initialData.stats.attendanceRate}
                            todayManualCount={initialData.stats.todayManualCount}
                            todayAiCount={initialData.stats.todayAiCount}
                        />

                        {/* Analytical Charts Grid */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            <ClassPerformanceChart data={initialData.classPerformance} />
                            <WeeklyAttendanceChart data={initialData.weeklyTrends} />
                        </div>

                        {/* Live Activity Snapshot & Fast Action */}
                        <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 rounded-2xl p-6 text-white shadow-md">
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                                <div className="space-y-2">
                                    <div className="flex items-center gap-2">
                                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-white/20 backdrop-blur-xs text-white">
                                            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse"></span>
                                            Live Ingestion Stream Active
                                        </span>
                                        {latestBatch && (
                                            <span className="text-xs text-blue-100 font-mono">
                                                Last batch: {format(new Date(latestBatch.lastSync), "h:mm a")}
                                            </span>
                                        )}
                                    </div>

                                    <h3 className="text-xl font-bold tracking-tight text-white">
                                        Real-Time Classroom Audit & Manual Override Feed
                                    </h3>

                                    <p className="text-sm text-blue-100 max-w-2xl leading-relaxed">
                                        Inspect synchronization batches from device cameras, verify who marked attendance,
                                        and review reason documentation for manual overrides.
                                    </p>
                                </div>

                                <div className="flex items-center gap-3">
                                    <button
                                        onClick={() => setActiveTab("live-feed")}
                                        className="px-5 py-2.5 rounded-xl bg-white text-blue-700 font-bold text-sm shadow-sm hover:bg-blue-50 transition-all flex items-center gap-2 shrink-0"
                                    >
                                        <span>Open Live Activity Feed</span>
                                        <ArrowRight className="h-4 w-4" />
                                    </button>
                                </div>
                            </div>

                            {/* Mini Batch Preview Strip if batches exist */}
                            {latestBatch && (
                                <div className="mt-5 pt-4 border-t border-white/15 grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs text-blue-100">
                                    <div className="flex items-center gap-2">
                                        <School className="h-4 w-4 text-blue-200" />
                                        <span>
                                            Latest Class: <strong className="text-white font-semibold">Class {latestBatch.className}</strong>
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <UserCheck className="h-4 w-4 text-blue-200" />
                                        <span>
                                            Captured: <strong className="text-white font-semibold">{latestBatch.presentCount} / {latestBatch.totalStudents} Present</strong>
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <ShieldCheck className="h-4 w-4 text-blue-200" />
                                        <span>
                                            Logged By: <strong className="text-white font-semibold">{latestBatch.markedBy || latestBatch.teacherName || "Staff"}</strong>
                                        </span>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* TAB 2: LIVE ACTIVITY & AUDIT FEED */}
                {activeTab === "live-feed" && (
                    <div className="space-y-6 animate-in fade-in duration-150">
                        {/* Dedicated Audit Header */}
                        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div>
                                <div className="flex items-center gap-2.5">
                                    <h2 className="text-xl font-bold text-slate-900 tracking-tight">
                                        Real-Time Attendance Feed & Audit Trail
                                    </h2>
                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                        <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
                                        Live Feed Connected
                                    </span>
                                </div>
                                <p className="text-sm text-slate-500 mt-1 max-w-2xl leading-relaxed">
                                    Audit device biometric logs, check who submitted each session, review present/absent rosters,
                                    and examine justification notes for manual entries.
                                </p>
                            </div>

                            <div className="flex items-center gap-3">
                                <button
                                    onClick={handleRefresh}
                                    disabled={isRefreshing}
                                    className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors flex items-center gap-2 shrink-0"
                                >
                                    <span className={`h-2 w-2 rounded-full bg-blue-600 ${isRefreshing ? "animate-ping" : ""}`} />
                                    {isRefreshing ? "Syncing Feed..." : "Refresh Feed"}
                                </button>
                            </div>
                        </div>

                        {/* Recent Activity Table Component */}
                        <RecentActivityTable
                            batches={initialData.batches}
                            recentLogs={initialData.recentLogs}
                        />
                    </div>
                )}
            </main>
        </div>
    );
}
