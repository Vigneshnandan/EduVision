"use client"

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer
} from 'recharts'
import { format, subDays } from 'date-fns'

interface WeeklyData {
    date: string;
    percentage: number;
    total: number;
}

interface WeeklyAttendanceChartProps {
    data: WeeklyData[];
}

export function WeeklyAttendanceChart({ data }: WeeklyAttendanceChartProps) {
    return (
        <Card className="col-span-1 shadow-sm border-gray-200">
            <CardHeader>
                <CardTitle className="text-gray-800">Attendance Trend (Last 7 Days)</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart
                            data={data}
                            margin={{ top: 10, right: 30, left: 0, bottom: 5 }}
                        >
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                            <XAxis
                                dataKey="date"
                                stroke="#6b7280"
                                fontSize={12}
                                tickLine={false}
                                axisLine={false}
                                tickFormatter={(str) => {
                                    const date = new Date(str);
                                    if (isNaN(date.getTime())) return str;
                                    return format(date, 'MMM d');
                                }}
                            />
                            <YAxis
                                stroke="#6b7280"
                                fontSize={12}
                                tickLine={false}
                                axisLine={false}
                                tickFormatter={(value) => `${value}%`}
                                domain={[0, 100]}
                            />
                            <Tooltip
                                contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '6px', color: '#fff' }}
                                itemStyle={{ color: '#fff' }}
                                labelStyle={{ color: '#94a3b8', marginBottom: '4px' }}
                                labelFormatter={(label) => {
                                    const date = new Date(label);
                                    if (isNaN(date.getTime())) return label;
                                    return format(date, 'MMMM d, yyyy');
                                }}
                                formatter={(value: number | undefined) => [value !== undefined ? `${value}%` : '', 'Attendance Rate']}
                            />
                            <Line
                                type="monotone"
                                dataKey="percentage"
                                stroke="#2563eb"
                                strokeWidth={3}
                                dot={{ fill: '#2563eb', strokeWidth: 2, r: 4, stroke: '#fff' }}
                                activeDot={{ r: 6, strokeWidth: 0 }}
                            />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </CardContent>
        </Card>
    )
}
