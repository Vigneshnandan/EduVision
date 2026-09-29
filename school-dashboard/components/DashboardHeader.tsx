import { RefreshCw, School } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface DashboardHeaderProps {
    schoolName?: string;
    schoolId?: string;
    lastSync: string;
    onRefresh: () => void;
    isLoading: boolean;
}

export function DashboardHeader({ 
    schoolName, 
    schoolId, 
    lastSync, 
    onRefresh, 
    isLoading 
}: DashboardHeaderProps) {
    return (
        <header className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-10">
            <div className="w-full mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-16">
                    {/* Left Side: School Branding */}
                    <div className="flex items-center gap-3">
                        <img src="/icon.png" alt="EduVision Logo" className="h-10 w-10 rounded-xl shadow-xs shrink-0" />
                        <div>
                            <div className="flex items-center gap-2">
                                <h1 className="text-xl font-bold text-gray-900 leading-tight">
                                    {schoolName || "Institutional Attendance Dashboard"}
                                </h1>
                                {schoolId && (
                                    <Badge variant="outline" className="text-xs bg-slate-50 text-slate-600 border-slate-300 font-mono">
                                        ID: {schoolId}
                                    </Badge>
                                )}
                            </div>
                            <p className="text-xs text-blue-600 font-medium tracking-wide uppercase">
                                Real-time School Attendance Monitoring
                            </p>
                        </div>
                    </div>

                    {/* Right Side: Sync Info & Actions */}
                    <div className="flex items-center gap-4">
                        <div className="hidden md:flex flex-col items-end text-sm text-gray-500">
                            <span>Last Sync</span>
                            <span className="font-mono text-gray-900 font-medium">
                                {lastSync}
                            </span>
                        </div>
                        <Button
                            onClick={onRefresh}
                            variant="outline"
                            size="sm"
                            className="gap-2 border-blue-200 hover:bg-blue-50 text-blue-700"
                            disabled={isLoading}
                        >
                            <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
                            Refresh
                        </Button>
                    </div>
                </div>
            </div>
        </header>
    );
}
