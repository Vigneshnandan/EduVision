import { School, Users, UserCheck, LineChart } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface KPIGridProps {
    totalClasses?: number;
    totalStudents?: number;
    totalPresent: number;
    attendanceRate: number;
}

export function KPIGrid({ 
    totalClasses = 0, 
    totalStudents = 0, 
    totalPresent, 
    attendanceRate 
}: KPIGridProps) {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {/* Card 1: Total Academic Classes */}
            <Card className="border-l-4 border-l-blue-600 shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-500 mb-1">
                                Academic Classes
                            </p>
                            <h3 className="text-2xl font-bold text-gray-900">{totalClasses}</h3>
                        </div>
                        <div className="p-3 bg-blue-100 rounded-full">
                            <School className="h-6 w-6 text-blue-600" />
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Card 2: Enrolled Students */}
            <Card className="border-l-4 border-l-purple-500 shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-500 mb-1">
                                Enrolled Students
                            </p>
                            <h3 className="text-2xl font-bold text-gray-900">{totalStudents}</h3>
                        </div>
                        <div className="p-3 bg-purple-100 rounded-full">
                            <Users className="h-6 w-6 text-purple-600" />
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Card 3: Students Present Today */}
            <Card className="border-l-4 border-l-emerald-500 shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-500 mb-1">
                                Students Present
                            </p>
                            <h3 className="text-2xl font-bold text-gray-900">
                                {totalPresent}
                            </h3>
                        </div>
                        <div className="p-3 bg-emerald-100 rounded-full">
                            <UserCheck className="h-6 w-6 text-emerald-600" />
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Card 4: Attendance Rate Today */}
            <Card className="border-l-4 border-l-indigo-500 shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-500 mb-1">
                                Attendance Rate
                            </p>
                            <h3 className="text-2xl font-bold text-gray-900">
                                {isNaN(attendanceRate) ? "0.0" : Number(attendanceRate).toFixed(1)}%
                            </h3>
                        </div>
                        <div className="p-3 bg-indigo-100 rounded-full">
                            <LineChart className="h-6 w-6 text-indigo-600" />
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
