
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
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
                            <span className="font-medium">Class {item.className}</span>
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
