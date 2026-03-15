
"use client"

import { AttendanceGridRow } from '@/lib/reports'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { FileDown } from 'lucide-react'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"

interface MonthlyRegisterTableProps {
    data: AttendanceGridRow[]
    month: number
    year: number
    daysInMonth: number
}

export function MonthlyRegisterTable({ data, month, year, daysInMonth }: MonthlyRegisterTableProps) {
    const days = Array.from({ length: daysInMonth }, (_, i) => i + 1)

    const handleExport = () => {
        const header = ['Student Name', ...days.map(d => `${d}/${month + 1}`)].join(',')
        const rows = data.map(row => {
            const attendanceCells = days.map(d => row.attendance[d] || 'A').join(',')
            return `${row.name},${attendanceCells}`
        })
        const csvContent = [header, ...rows].join('\n')
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.setAttribute('download', `Official_Register_${month + 1}_${year}.csv`)
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
    }

    return (
        <Card className="w-full border-t-4 border-t-blue-700 shadow-md">
            <CardHeader className="flex flex-row items-center justify-between border-b bg-gray-50/50 py-4">
                <div>
                    <CardTitle className="text-xl text-gray-800 font-serif">Official Attendance Register</CardTitle>
                    <p className="text-xs text-gray-500 uppercase tracking-widest mt-1">Form 9A • Monthly Record</p>
                </div>
                <Button
                    size="sm"
                    variant="outline"
                    onClick={handleExport}
                    className="border-blue-200 text-blue-700 hover:bg-blue-50 hover:text-blue-800"
                >
                    <FileDown className="h-4 w-4 mr-2" />
                    Export CSV
                </Button>
            </CardHeader>
            <CardContent className="p-0">
                <div className="w-full overflow-x-auto">
                    <Table className="min-w-[1000px] border-collapse">
                        <TableHeader>
                            <TableRow className="bg-gray-100 border-b-2 border-gray-300">
                                <TableHead className="sticky left-0 bg-gray-100 z-20 w-[200px] font-bold text-gray-800 border-r border-gray-300 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] h-12">
                                    Student Name
                                </TableHead>
                                {days.map(d => (
                                    <TableHead key={d} className="text-center w-8 p-0 text-[10px] font-semibold text-gray-600 border-r border-gray-200 h-12">
                                        <div className="flex flex-col items-center justify-center">
                                            <span>{d}</span>
                                        </div>
                                    </TableHead>
                                ))}
                                <TableHead className="text-center w-12 font-bold text-gray-800 bg-gray-100 border-l border-gray-300">
                                    %
                                </TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {data.map((row, idx) => {
                                // Calculate row stats
                                const presentDays = days.filter(d => row.attendance[d] === 'P').length;
                                const percentage = Math.round((presentDays / daysInMonth) * 100);

                                return (
                                    <TableRow key={row.studentId} className={`hover:bg-blue-50/30 ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/30'}`}>
                                        <TableCell className="sticky left-0 bg-white z-10 font-medium text-gray-900 border-r border-gray-200 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] py-2 text-sm">
                                            {row.name}
                                        </TableCell>
                                        {days.map(d => {
                                            const status = row.attendance[d] || 'A'
                                            return (
                                                <TableCell key={d} className="p-0 text-center border-r border-gray-100 h-10 w-8">
                                                    {status === 'P' ? (
                                                        <span className="inline-flex items-center justify-center h-full w-full font-bold text-emerald-600 text-xs">
                                                            P
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex items-center justify-center h-full w-full text-gray-300 text-[10px]">
                                                            -
                                                        </span>
                                                    )}
                                                </TableCell>
                                            )
                                        })}
                                        <TableCell className="text-center font-bold text-xs border-l border-gray-200 bg-gray-50/50">
                                            <span className={`${percentage < 75 ? 'text-red-600' : 'text-gray-900'}`}>{percentage}%</span>
                                        </TableCell>
                                    </TableRow>
                                )
                            })}
                        </TableBody>
                    </Table>
                </div>
            </CardContent>
        </Card>
    )
}
