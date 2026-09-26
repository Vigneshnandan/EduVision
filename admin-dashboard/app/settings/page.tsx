"use client"

import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Bell, Shield, Cloud, Lock } from "lucide-react"

export default function SettingsPage() {
    return (
        <div className="p-8 space-y-8 w-full mx-auto">
            <div className="mb-6">
                <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">System Settings</h1>
                <p className="text-slate-500 mt-2">Manage application preferences and school configuration.</p>
            </div>

            <div className="grid grid-cols-1 gap-6">
                {/* School Profile - Read Only for now */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Shield className="h-5 w-5 text-blue-600" />
                            School Configuration
                        </CardTitle>
                        <CardDescription>Basic information about your institution.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <Label>School Name</Label>
                                <Input defaultValue="Govt High School" readOnly className="bg-slate-50" />
                            </div>
                            <div className="space-y-2">
                                <Label>School Code</Label>
                                <Input defaultValue="SCH-2026-001" readOnly className="bg-slate-50" />
                            </div>
                            <div className="space-y-2">
                                <Label>Zone / District</Label>
                                <Input defaultValue="North Zone, Rural District" readOnly className="bg-slate-50" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* System Preferences */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Bell className="h-5 w-5 text-amber-600" />
                            Notifications & Alerts
                        </CardTitle>
                        <CardDescription>Configure system alerts and thresholds.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                                <Label className="text-base">Low Attendance Alert</Label>
                                <p className="text-sm text-muted-foreground">Notify when a class drops below 75% attendance.</p>
                            </div>
                            <Switch defaultChecked />
                        </div>
                        <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                                <Label className="text-base">Sync Status Notifications</Label>
                                <p className="text-sm text-muted-foreground">Alert if data hasn't synced for more than 24 hours.</p>
                            </div>
                            <Switch defaultChecked />
                        </div>
                    </CardContent>
                </Card>

                {/* Data Management */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Cloud className="h-5 w-5 text-emerald-600" />
                            Data Sync
                        </CardTitle>
                        <CardDescription>Manage connectivity and storage.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center justify-between p-4 border rounded-lg bg-emerald-50/50">
                            <div className="flex items-center gap-4">
                                <div className="h-10 w-10 bg-emerald-100 rounded-full flex items-center justify-center">
                                    <Cloud className="h-5 w-5 text-emerald-600" />
                                </div>
                                <div>
                                    <p className="font-medium text-slate-900">Cloud Sync Active</p>
                                    <p className="text-xs text-slate-500">Last synced: Just now</p>
                                </div>
                            </div>
                            <Button variant="outline" size="sm" className="border-emerald-200 text-emerald-700 hover:bg-emerald-100">
                                Force Sync
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
