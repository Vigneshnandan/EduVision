"use client"

import { useState } from "react"
import { SchoolHoliday } from "@/lib/types"
import { addHolidayAction, deleteHolidayAction } from "./actions"
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Calendar as CalendarIcon, Plus, Trash2, Loader2, Info } from "lucide-react"

interface CalendarClientProps {
    initialHolidays: SchoolHoliday[]
}

export function CalendarClient({ initialHolidays }: CalendarClientProps) {
    const [holidays, setHolidays] = useState<SchoolHoliday[]>(initialHolidays)
    const [isAddOpen, setIsAddOpen] = useState(false)
    const [isSubmitting, setIsSubmitting] = useState(false)

    const handleAdd = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setIsSubmitting(true)
        const formData = new FormData(e.currentTarget)
        const dateStr = formData.get('holidayDate') as string
        const label = formData.get('label') as string
        try {
            await addHolidayAction(formData)
            setHolidays(prev => [
                ...prev,
                {
                    holiday_id: `temp-${Date.now()}`,
                    school_id: '',
                    holiday_date: dateStr,
                    label: label
                }
            ].sort((a, b) => a.holiday_date.localeCompare(b.holiday_date)))
            setIsAddOpen(false)
        } catch (err: any) {
            alert(err.message || "Failed to add holiday")
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleDelete = async (holidayId: string, label: string) => {
        if (!confirm(`Delete holiday "${label}"?`)) return
        try {
            await deleteHolidayAction(holidayId)
            setHolidays(prev => prev.filter(h => h.holiday_id !== holidayId))
        } catch (err: any) {
            alert(err.message || "Failed to remove holiday")
        }
    }

    return (
        <div className="space-y-6">
            <Card className="bg-blue-50/50 border-blue-200">
                <CardContent className="p-4 flex items-start gap-3">
                    <Info className="h-5 w-5 text-blue-600 mt-0.5 shrink-0" />
                    <div className="text-sm text-blue-900">
                        <p className="font-semibold">Academic Working Days & Attendance Calculations</p>
                        <p className="text-blue-700 text-xs mt-0.5">
                            Days listed as holidays (along with Sundays) are automatically marked as non-school days in attendance registers and excluded from absenteeism rate penalties.
                        </p>
                    </div>
                </CardContent>
            </Card>

            <Card className="shadow-sm">
                <CardHeader className="flex flex-row items-center justify-between pb-4">
                    <div>
                        <CardTitle className="text-xl font-bold text-slate-900">School Holidays & Observances</CardTitle>
                        <CardDescription>
                            Configure gazetted holidays, term breaks, and institutional non-instructional days.
                        </CardDescription>
                    </div>
                    <Button onClick={() => setIsAddOpen(true)} className="bg-blue-600 hover:bg-blue-700">
                        <Plus className="h-4 w-4 mr-2" /> Add Holiday
                    </Button>
                </CardHeader>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-slate-50/70">
                                <TableHead className="font-semibold text-slate-700">Date</TableHead>
                                <TableHead className="font-semibold text-slate-700">Day</TableHead>
                                <TableHead className="font-semibold text-slate-700">Holiday Label / Occasion</TableHead>
                                <TableHead className="text-right font-semibold text-slate-700">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {holidays.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={4} className="text-center py-10 text-slate-500">
                                        No custom school holidays defined. Click &quot;Add Holiday&quot; to add institutional breaks.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                holidays.map((h) => {
                                    const dateObj = new Date(h.holiday_date + 'T00:00:00')
                                    const dayName = dateObj.toLocaleDateString('en-US', { weekday: 'long' })
                                    const formattedDate = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                                    return (
                                        <TableRow key={h.holiday_id} className="hover:bg-slate-50/50">
                                            <TableCell className="font-medium text-slate-900 font-mono text-xs">
                                                {formattedDate}
                                            </TableCell>
                                            <TableCell className="text-slate-600 text-sm">
                                                {dayName}
                                            </TableCell>
                                            <TableCell>
                                                <span className="inline-flex items-center px-2.5 py-1 rounded-md bg-amber-50 text-amber-800 font-medium text-xs border border-amber-200">
                                                    {h.label}
                                                </span>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => handleDelete(h.holiday_id, h.label)}
                                                    className="text-slate-400 hover:text-red-600 hover:bg-red-50"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    )
                                })
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            {/* Add Holiday Dialog */}
            <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>Declare School Holiday</DialogTitle>
                        <DialogDescription>
                            Specify the date and reason for school closure.
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleAdd} className="space-y-4 py-2">
                        <div className="space-y-2">
                            <Label htmlFor="holidayDate">Holiday Date</Label>
                            <Input id="holidayDate" name="holidayDate" type="date" required />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="label">Holiday Name / Occasion</Label>
                            <Input id="label" name="label" placeholder="e.g. Independence Day, Annual Sports Day" required />
                        </div>
                        <DialogFooter className="pt-2">
                            <Button type="button" variant="outline" onClick={() => setIsAddOpen(false)}>
                                Cancel
                            </Button>
                            <Button type="submit" disabled={isSubmitting} className="bg-blue-600 hover:bg-blue-700">
                                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Save Holiday
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    )
}
