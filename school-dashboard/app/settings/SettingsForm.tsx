"use client"

import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Shield, Cloud, Save, CheckCircle, CreditCard, Sparkles } from "lucide-react"
import { updateSchoolSettings, forceSync } from "./actions"
import { useState } from "react"

export function SettingsForm({ school }: { school: any }) {
    const [isSaving, setIsSaving] = useState(false)
    const [isSyncing, setIsSyncing] = useState(false)
    const [syncSuccess, setSyncSuccess] = useState(false)

    const handleSave = async (formData: FormData) => {
        setIsSaving(true)
        try {
            await updateSchoolSettings(formData)
            alert("Settings saved successfully!")
        } catch (error) {
            alert("Failed to save settings.")
        } finally {
            setIsSaving(false)
        }
    }

    const handleForceSync = async () => {
        setIsSyncing(true)
        setSyncSuccess(false)
        try {
            await forceSync()
            setSyncSuccess(true)
        } catch (error) {
            alert("Sync failed.")
        } finally {
            setIsSyncing(false)
        }
    }

    return (
        <div className="grid grid-cols-1 gap-6">
            {/* Commercial Plan & Subscription Status (Phase 6.3) */}
            <Card className="border-slate-200 shadow-sm">
                <CardHeader>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div>
                            <CardTitle className="flex items-center gap-2">
                                <CreditCard className="h-5 w-5 text-blue-600" />
                                Institutional Subscription & Plan Tier
                            </CardTitle>
                            <CardDescription className="text-xs">Current commercial plan tier and entitlement status.</CardDescription>
                        </div>
                        {school.plan_tier === 'paid' ? (
                            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                                <Sparkles className="h-3.5 w-3.5" /> Paid Tier Active
                            </span>
                        ) : (
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                                Free Community Tier
                            </span>
                        )}
                    </div>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-1">
                            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Plan License</p>
                            <h4 className="text-base font-bold text-slate-900">
                                {school.plan_tier === 'paid' ? 'Institutional / Enterprise Plan' : 'Free Community Plan'}
                            </h4>
                            <p className="text-xs text-slate-500 mt-1">
                                {school.plan_tier === 'paid'
                                    ? 'Unrestricted access to all MDM reports, Form 9A exports, and priority cloud sync.'
                                    : 'Core daily attendance recording and basic school dashboard view.'}
                            </p>
                        </div>

                        <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-1">
                            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Renewal Date</p>
                            <h4 className="text-base font-bold text-slate-900">
                                {school.plan_renews_at || 'No expiration set'}
                            </h4>
                            <p className="text-xs text-slate-500 mt-1">
                                Managed centrally by the State Education Directorate admin console.
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <form action={handleSave}>
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Shield className="h-5 w-5 text-blue-600" />
                            School Configuration
                        </CardTitle>
                        <CardDescription>Update basic information and policies about your institution.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <Label htmlFor="name">School Name</Label>
                                <Input id="name" name="name" defaultValue={school.school_name || school.name || ""} required />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="code">School Code</Label>
                                <Input id="code" name="code" defaultValue={school.school_code || school.code || ""} required />
                            </div>
                            <div className="space-y-2 md:col-span-2">
                                <Label htmlFor="address">Address / District</Label>
                                <Input id="address" name="address" defaultValue={school.address} required />
                            </div>
                            <div className="space-y-2 md:col-span-2">
                                <Label htmlFor="threshold">At-Risk Attendance Threshold (%)</Label>
                                <Input 
                                    id="threshold" 
                                    name="threshold" 
                                    type="number" 
                                    min="1" 
                                    max="100" 
                                    defaultValue={school.at_risk_threshold_pct ?? 75} 
                                    required 
                                />
                                <p className="text-sm text-muted-foreground">Students dropping below this percentage will be flagged as at-risk.</p>
                            </div>
                        </div>
                    </CardContent>
                    <CardFooter>
                        <Button type="submit" disabled={isSaving}>
                            <Save className="h-4 w-4 mr-2" />
                            {isSaving ? "Saving..." : "Save Settings"}
                        </Button>
                    </CardFooter>
                </Card>
            </form>

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
                                <p className="font-medium text-slate-900">Cloud Sync Interface</p>
                                <p className="text-xs text-slate-500">Trigger a manual synchronization of offline data.</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            {syncSuccess && <span className="text-sm text-emerald-600 font-medium flex items-center"><CheckCircle className="h-4 w-4 mr-1" /> Synced</span>}
                            <Button variant="outline" size="sm" className="border-emerald-200 text-emerald-700 hover:bg-emerald-100" onClick={handleForceSync} disabled={isSyncing}>
                                {isSyncing ? "Syncing..." : "Force Sync"}
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
