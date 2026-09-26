"use client";

import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { DashboardHeader } from "@/components/DashboardHeader";
import { KPIGrid } from "@/components/KPIGrid";
import {
  RecentActivityTable,
  ClassBatch,
  AttendanceLog,
} from "@/components/RecentActivityTable";
import { format } from "date-fns";
import { ClassPerformanceChart } from "@/components/ClassPerformanceChart";
import { WeeklyAttendanceChart } from "@/components/WeeklyAttendanceChart";

export default function GovernmentDashboard() {
  const [lastSync, setLastSync] = useState<string>("--:-- --");
  const [isLoading, setIsLoading] = useState(false);
  const [totalPresent, setTotalPresent] = useState(0);
  const [attendanceRate, setAttendanceRate] = useState(0);
  const [totalSchools, setTotalSchools] = useState(0);
  // State for Charts
  const [classPerformance, setClassPerformance] = useState<any[]>([]);
  const [weeklyTrends, setWeeklyTrends] = useState<any[]>([]);
  const [batches, setBatches] = useState<ClassBatch[]>([]);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayEpoch = today.getTime();

      // Calculate 7 days ago for trend
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(today.getDate() - 6);
      sevenDaysAgo.setHours(0, 0, 0, 0);
      const sevenDaysAgoEpoch = sevenDaysAgo.getTime();

      // Fetch total schools count
      const { count: schoolCount } = await supabase
        .from("schools")
        .select("*", { count: "exact", head: true });
      setTotalSchools(schoolCount || 0);

      // Fetch logs from last 7 days
      const { data, error } = await supabase
        .from("attendance")
        .select("*")
        .gte("timestamp", sevenDaysAgoEpoch)
        .order("timestamp", { ascending: false });

      if (error) {
        console.error("Error fetching attendance:", error);
        return;
      }

      const allLogs = (data as AttendanceLog[]) || [];

      // Separate Today's logs for KPI and Table
      const todaysLogs = allLogs.filter(log => log.timestamp >= todayEpoch);

      // --- KPI Logic (Today) ---
      const presentCount = todaysLogs.filter((log) => log.is_present).length;
      const totalCount = todaysLogs.length;
      const rate = totalCount > 0 ? (presentCount / totalCount) * 100 : 0;

      setTotalPresent(presentCount);
      setAttendanceRate(rate);

      // --- Table & Class Chart Logic (Today) ---
      const groups: Record<string, AttendanceLog[]> = {};
      todaysLogs.forEach((log) => {
        if (!groups[log.class_name]) {
          groups[log.class_name] = [];
        }
        groups[log.class_name].push(log);
      });

      const batchList: ClassBatch[] = Object.keys(groups).map((className) => {
        const classLogs = groups[className];
        classLogs.sort((a, b) => b.timestamp - a.timestamp);

        const classTotal = classLogs.length;
        const classPresent = classLogs.filter((l) => l.is_present).length;
        const latestTime = classLogs[0]?.timestamp ? new Date(classLogs[0].timestamp).toISOString() : new Date().toISOString();

        return {
          className,
          lastSync: latestTime,
          totalStudents: classTotal,
          presentCount: classPresent,
          students: classLogs,
        };
      });

      batchList.sort((a, b) => new Date(b.lastSync).getTime() - new Date(a.lastSync).getTime());
      setBatches(batchList);

      // Prepare Data for ClassPerformanceChart
      const chartData = batchList.map(batch => ({
        className: batch.className,
        percentage: batch.totalStudents > 0 ? Math.round((batch.presentCount / batch.totalStudents) * 100) : 0,
        presentCount: batch.presentCount,
        totalCount: batch.totalStudents
      }));
      setClassPerformance(chartData);

      // --- Weekly Trend Logic ---
      const daysMap: Record<string, { total: number; present: number }> = {};

      // Initialize last 7 days with 0
      for (let i = 0; i < 7; i++) {
        const d = new Date();
        d.setDate(today.getDate() - i);
        const dateStr = format(d, 'yyyy-MM-dd');
        daysMap[dateStr] = { total: 0, present: 0 };
      }

      allLogs.forEach(log => {
        const logDate = new Date(log.timestamp);
        const dateStr = format(logDate, 'yyyy-MM-dd');
        if (daysMap[dateStr]) {
          daysMap[dateStr].total += 1;
          if (log.is_present) daysMap[dateStr].present += 1;
        }
      });

      const trendData = Object.keys(daysMap).sort().map(date => {
        const dayStats = daysMap[date];
        return {
          date,
          percentage: dayStats.total > 0 ? Math.round((dayStats.present / dayStats.total) * 100) : 0,
          total: dayStats.total
        };
      });
      setWeeklyTrends(trendData);

      setLastSync(format(new Date(), "h:mm a"));
    } catch (err) {
      console.error("Unexpected error:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 60000);
    return () => clearInterval(interval);
  }, [fetchData]);

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-gray-900 pb-10">
      <DashboardHeader
        lastSync={lastSync}
        onRefresh={fetchData}
        isLoading={isLoading}
      />

      <main className="w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* KPI Grid Section */}
        <KPIGrid totalPresent={totalPresent} attendanceRate={attendanceRate} registeredSchools={totalSchools} />

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ClassPerformanceChart data={classPerformance} />
          <WeeklyAttendanceChart data={weeklyTrends} />
        </div>

        {/* Recent Activity Table Section */}
        <div className="space-y-4">

          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-800 tracking-tight">
              Class Activity Feed
            </h2>
            {/* Optionally add filters here later */}
          </div>
          <RecentActivityTable batches={batches} />
        </div>
      </main>
    </div>
  );
}
