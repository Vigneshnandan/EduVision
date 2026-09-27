
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { AlertTriangle, BellRing } from 'lucide-react'
import type { AtRiskStudent } from '@/lib/types'

interface RiskListProps {
    data: AtRiskStudent[]
}

export function RiskList({ data }: RiskListProps) {
    return (
        <Card className="col-span-1 border-red-100">
            <CardHeader>
                <div className="flex items-center gap-2 text-red-600">
                    <AlertTriangle className="h-5 w-5" />
                    <CardTitle>Students at Risk (Dropout Warning)</CardTitle>
                </div>
            </CardHeader>
            <CardContent>
                <div className="h-[300px] overflow-auto">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Student</TableHead>
                                <TableHead>Class</TableHead>
                                <TableHead className="text-right">Attendance</TableHead>
                                <TableHead className="text-right">Action</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {data.map((student) => (
                                <TableRow key={student.studentId}>
                                    <TableCell className="font-medium">{student.name}</TableCell>
                                    <TableCell>{student.className}</TableCell>
                                    <TableCell className="text-right">
                                        <span className={`px-2 py-1 rounded text-xs font-bold ${student.status === 'Critical'
                                                ? 'bg-red-100 text-red-700'
                                                : 'bg-yellow-100 text-yellow-700'
                                            }`}>
                                            {student.attendancePct}%
                                        </span>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                            <BellRing className="h-4 w-4 text-slate-500 hover:text-red-600" />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                            {data.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                                        🎉 No students at risk found in the last 30 days.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>
            </CardContent>
        </Card>
    )
}
