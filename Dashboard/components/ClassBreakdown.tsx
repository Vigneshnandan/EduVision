
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { ClassAnalytics } from '@/lib/analytics'

interface ClassBreakdownProps {
    data: ClassAnalytics[]
}

export function ClassBreakdown({ data }: ClassBreakdownProps) {
    return (
        <Card className="h-full">
            <CardHeader>
                <CardTitle>Class-wise Attendance</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                {data.map((item) => (
                    <div key={item.className} className="space-y-1">
                        <div className="flex items-center justify-between text-sm">
                            <div className="flex items-center gap-2">
                                <span className="font-medium">Class {item.className}</span>
                                {Boolean(item.manualCount && item.manualCount > 0) && (
                                    <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-amber-300 text-amber-700 bg-amber-50">
                                        Manual ({item.manualCount})
                                    </Badge>
                                )}
                            </div>
                            <span className="text-muted-foreground">
                                {item.presentCount}/{item.totalCount} ({Math.round(item.percentage)}%)
                            </span>
                        </div>
                        <Progress value={item.percentage} className="h-2" />
                    </div>
                ))}
                {data.length === 0 && (
                    <p className="text-sm text-muted-foreground">No data available.</p>
                )}
            </CardContent>
        </Card>
    )
}
