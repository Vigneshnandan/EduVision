
"use client"

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Cell
} from 'recharts'
import type { ClassAnalytics } from '@/lib/types'

interface ClassPerformanceChartProps {
    data: ClassAnalytics[]
}

export function ClassPerformanceChart({ data }: ClassPerformanceChartProps) {
    return (
        <Card className="col-span-1">
            <CardHeader>
                <CardTitle>Class Performance</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                            data={data}
                            margin={{ top: 10, right: 30, left: 0, bottom: 5 }}
                        >
                            <CartesianGrid strokeDasharray="3 3" vertical={false} />
                            <XAxis
                                dataKey="className"
                                stroke="#888888"
                                fontSize={12}
                                tickLine={false}
                                axisLine={false}
                            />
                            <YAxis
                                stroke="#888888"
                                fontSize={12}
                                tickLine={false}
                                axisLine={false}
                                tickFormatter={(value) => `${value}%`}
                                domain={[0, 100]}
                            />
                            <Tooltip
                                cursor={{ fill: 'transparent' }}
                                content={({ active, payload }) => {
                                    if (active && payload && payload.length) {
                                        const data = payload[0].payload;
                                        return (
                                            <div className="bg-slate-900 text-white text-xs p-2 rounded shadow-lg">
                                                <p className="font-bold mb-1">Class {data.className}</p>
                                                <p>Attendance: {Math.round(data.percentage)}%</p>
                                                <p className="text-slate-300">({data.presentCount}/{data.totalCount} Present)</p>
                                            </div>
                                        )
                                    }
                                    return null;
                                }}
                            />
                            <Bar dataKey="percentage" radius={[4, 4, 0, 0]}>
                                {data.map((entry, index) => (
                                    <Cell
                                        key={`cell-${index}`}
                                        fill={entry.percentage >= 90 ? '#22c55e' : entry.percentage >= 75 ? '#3b82f6' : '#ef4444'}
                                    />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </CardContent>
        </Card>
    )
}
