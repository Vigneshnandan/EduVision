
"use client"

import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { FileDown, CheckCircle, Save } from 'lucide-react'
import { MDMStats } from '@/lib/mdm-utils'
import { saveMDMReport } from '@/lib/actions'
import { useState } from 'react'

interface MDMReportCardProps {
    stats: MDMStats
    isSaved?: boolean
}

export function MDMReportCard({ stats, isSaved = false }: MDMReportCardProps) {
    const [saved, setSaved] = useState(isSaved)
    const [loading, setLoading] = useState(false)

    const handleSave = async () => {
        setLoading(true)
        try {
            await saveMDMReport(stats)
            setSaved(true)
        } catch (e) {
            alert("Failed to save report")
        } finally {
            setLoading(false)
        }
    }

    return (
        <Card className="flex flex-col h-full">
            <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                    <CardTitle className="text-lg font-bold text-slate-800">PM POSHAN Daily Report</CardTitle>
                    <div className="flex items-center gap-2">
                        <span className="text-xs font-mono bg-slate-100 px-2 py-1 rounded text-slate-500">
                            {new Date().toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
                        </span>
                        {saved && <span className="flex items-center gap-1 text-xs bg-green-100 text-green-700 px-2 py-1 rounded font-bold"><CheckCircle className="h-3 w-3" /> Submitted</span>}
                    </div>
                </div>
            </CardHeader>
            <CardContent className="flex-1 space-y-6">
                {/* Beneficiary Table */}
                <div className="rounded-md border">
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-slate-50">
                                <TableHead>Category</TableHead>
                                <TableHead className="text-right">Enrolled</TableHead>
                                <TableHead className="text-right">Present</TableHead>
                                <TableHead className="text-right font-bold text-slate-700">Meals Served</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            <TableRow>
                                <TableCell className="font-medium">{stats.primary.label}</TableCell>
                                <TableCell className="text-right text-muted-foreground">{stats.primary.enrolled}</TableCell>
                                <TableCell className="text-right text-muted-foreground">{stats.primary.present}</TableCell>
                                <TableCell className="text-right font-bold">{stats.primary.served}</TableCell>
                            </TableRow>
                            <TableRow>
                                <TableCell className="font-medium">{stats.upperPrimary.label}</TableCell>
                                <TableCell className="text-right text-muted-foreground">{stats.upperPrimary.enrolled}</TableCell>
                                <TableCell className="text-right text-muted-foreground">{stats.upperPrimary.present}</TableCell>
                                <TableCell className="text-right font-bold">{stats.upperPrimary.served}</TableCell>
                            </TableRow>
                        </TableBody>
                    </Table>
                </div>

                {/* Stock Utilization */}
                <div className="bg-amber-50 border border-amber-100 rounded-lg p-4 space-y-3">
                    <h4 className="text-sm font-semibold text-amber-900 flex items-center gap-2">
                        Today's Stock Utilization
                    </h4>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="flex flex-col">
                            <span className="text-xs text-amber-600 uppercase font-semibold">Rice / Wheat</span>
                            <span className="text-2xl font-bold text-amber-800">{stats.totalRiceKg.toFixed(2)} <span className="text-sm font-normal">kg</span></span>
                        </div>
                        <div className="flex flex-col">
                            <span className="text-xs text-amber-600 uppercase font-semibold">Dal / Pulses</span>
                            <span className="text-2xl font-bold text-amber-800">{stats.totalDalKg.toFixed(2)} <span className="text-sm font-normal">kg</span></span>
                        </div>
                    </div>
                </div>
            </CardContent>
            <CardFooter className="gap-2">
                {!saved ? (
                    <Button className="w-full bg-green-600 hover:bg-green-700" onClick={handleSave} disabled={loading}>
                        <Save className="h-4 w-4 mr-2" />
                        {loading ? 'Saving...' : 'Save & Submit Report'}
                    </Button>
                ) : (
                    <Button variant="outline" className="w-full gap-2" disabled>
                        <CheckCircle className="h-4 w-4" />
                        Report Submitted
                    </Button>
                )}
            </CardFooter>
        </Card>
    )
}
