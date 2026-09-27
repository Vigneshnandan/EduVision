"use client"

import { AttendanceGridRow } from '@/lib/reports'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { FileDown, Printer } from 'lucide-react'
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
    school?: any
    monthName?: string
}

export function MonthlyRegisterTable({ 
    data, 
    month, 
    year, 
    daysInMonth,
    school,
    monthName = "" 
}: MonthlyRegisterTableProps) {
    const days = Array.from({ length: daysInMonth }, (_, i) => i + 1)

    const handleExportCSV = () => {
        const header = ['Student Name', 'Class', ...days.map(d => `${d}/${month + 1}`), 'Attendance %'].join(',')
        const rows = data.map(row => {
            const attendanceCells = days.map(d => row.attendance[d] || 'A').join(',')
            const presentDays = days.filter(d => row.attendance[d] === 'P').length
            const pct = Math.round((presentDays / daysInMonth) * 100)
            return `"${row.name}","${row.className || 'General'}",${attendanceCells},${pct}%`
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

    const handlePrintPDF = () => {
        window.print()
    }

    return (
        <div className="space-y-4">
            {/* Printable Official School Header (Visible in print mode) */}
            <div className="hidden print:block text-center border-b-2 border-slate-900 pb-4 mb-4">
                <h1 className="text-2xl font-bold uppercase tracking-wide text-slate-900 font-serif">
                    {school?.school_name || "EduVision Partner School"}
                </h1>
                <p className="text-xs text-slate-600 mt-0.5">
                    School Code: {school?.school_code || "EV-SCH-01"} • District / Address: {school?.address || "District Education Division"}
                </p>
                <div className="flex justify-between items-center mt-3 text-xs font-semibold uppercase tracking-wider text-slate-800 border-t pt-2 border-slate-300">
                    <span>Monthly Academic Attendance Register (Form 9A)</span>
                    <span>Month / Year: {monthName} {year}</span>
                    <span>Total Students: {data.length}</span>
                </div>
            </div>

            <Card className="w-full border-t-4 border-t-blue-700 shadow-md print:shadow-none print:border-none">
                <CardHeader className="flex flex-row items-center justify-between border-b bg-gray-50/50 py-4 print:hidden">
                    <div>
                        <CardTitle className="text-xl text-gray-800 font-serif">Official Attendance Register</CardTitle>
                        <div className="flex items-center gap-3 mt-1">
                            <p className="text-xs text-gray-500 uppercase tracking-widest">Form 9A • Monthly Record</p>
                            <span className="inline-flex items-center gap-1 text-[10px] text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                                <span className="w-1.5 h-1.5 bg-amber-500 rounded-full" />
                                Manual edit
                            </span>
                            <span className="inline-flex items-center gap-1 text-[10px] text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200">
                                <span className="font-bold">H</span> Holiday
                            </span>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button
                            size="sm"
                            variant="outline"
                            onClick={handlePrintPDF}
                            className="border-slate-300 text-slate-700 hover:bg-slate-100"
                        >
                            <Printer className="h-4 w-4 mr-1.5" />
                            Print / Save PDF
                        </Button>
                        <Button
                            size="sm"
                            variant="outline"
                            onClick={handleExportCSV}
                            className="border-blue-200 text-blue-700 hover:bg-blue-50 hover:text-blue-800"
                        >
                            <FileDown className="h-4 w-4 mr-1.5" />
                            Export CSV
                        </Button>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="w-full overflow-x-auto print:overflow-visible">
                        <Table className="min-w-[1000px] print:min-w-full border-collapse">
                            <TableHeader>
                                <TableRow className="bg-gray-100 border-b-2 border-gray-300 print:bg-slate-100">
                                    <TableHead className="sticky left-0 bg-gray-100 z-20 w-[180px] font-bold text-gray-800 border-r border-gray-300 print:static print:w-auto h-10">
                                        Student Name
                                    </TableHead>
                                    <TableHead className="w-[80px] font-semibold text-gray-700 border-r border-gray-300 h-10 text-xs">
                                        Class
                                    </TableHead>
                                    {days.map(d => (
                                        <TableHead key={d} className="text-center w-7 p-0 text-[10px] font-semibold text-gray-600 border-r border-gray-200 h-10">
                                            <span>{d}</span>
                                        </TableHead>
                                    ))}
                                    <TableHead className="text-center w-12 font-bold text-gray-800 bg-gray-100 border-l border-gray-300 h-10 text-xs">
                                        %
                                    </TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {data.map((row, idx) => {
                                    // Calculate row stats: exclude 'H' (holidays) from total school days
                                    const schoolDays = days.filter(d => row.attendance[d] !== 'H').length
                                    const presentDays = days.filter(d => row.attendance[d] === 'P').length
                                    const percentage = schoolDays > 0 ? Math.round((presentDays / schoolDays) * 100) : 0

                                    return (
                                        <TableRow key={row.studentId} className={`hover:bg-blue-50/30 ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/30'}`}>
                                            <TableCell className="sticky left-0 bg-white z-10 font-medium text-gray-900 border-r border-gray-200 print:static py-1 text-xs whitespace-nowrap">
                                                {row.name}
                                            </TableCell>
                                            <TableCell className="font-mono text-[11px] text-slate-600 border-r border-gray-200 py-1">
                                                {row.className || "-"}
                                            </TableCell>
                                            {days.map(d => {
                                                const status = row.attendance[d] || 'A'
                                                const isManual = row.manualDays?.[d]

                                                if (status === 'H') {
                                                    return (
                                                        <TableCell key={d} className="p-0 text-center border-r border-gray-100 h-8 w-7 bg-slate-100/60 print:bg-slate-100">
                                                            <span className="text-[10px] font-bold text-slate-400">H</span>
                                                        </TableCell>
                                                    )
                                                }

                                                return (
                                                    <TableCell key={d} className="p-0 text-center border-r border-gray-100 h-8 w-7 relative">
                                                        {status === 'P' ? (
                                                            <span className="inline-flex items-center justify-center h-full w-full font-bold text-emerald-600 text-xs relative">
                                                                P
                                                                {isManual && (
                                                                    <span className="absolute top-0.5 right-0.5 w-1.5 h-1.5 bg-amber-500 rounded-full print:hidden" title="Manually edited" />
                                                                )}
                                                            </span>
                                                        ) : (
                                                            <span className="inline-flex items-center justify-center h-full w-full text-red-400 text-[10px] relative font-medium">
                                                                A
                                                                {isManual && (
                                                                    <span className="absolute top-0.5 right-0.5 w-1.5 h-1.5 bg-amber-500 rounded-full print:hidden" title="Manually edited" />
                                                                )}
                                                            </span>
                                                        )}
                                                    </TableCell>
                                                )
                                            })}
                                            <TableCell className="text-center font-bold text-xs border-l border-gray-200 bg-gray-50/50 py-1">
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

            {/* Formal Government / School Inspection Signature Block (Visible in print) */}
            <div className="hidden print:grid grid-cols-3 gap-8 pt-10 mt-8 border-t border-slate-300 text-xs text-slate-800">
                <div className="text-center border-t border-dashed border-slate-400 pt-2">
                    <p className="font-semibold">Class Teacher Signature</p>
                    <p className="text-[10px] text-slate-500 mt-1">Verified with daily register</p>
                </div>
                <div className="text-center border-t border-dashed border-slate-400 pt-2">
                    <p className="font-semibold">Official School Seal</p>
                    <p className="text-[10px] text-slate-500 mt-1">Dated: _______________</p>
                </div>
                <div className="text-center border-t border-dashed border-slate-400 pt-2">
                    <p className="font-semibold">Headmaster / Principal</p>
                    <p className="text-[10px] text-slate-500 mt-1">Countersigned for submission</p>
                </div>
            </div>
        </div>
    )
}
