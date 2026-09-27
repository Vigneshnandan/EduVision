"use client"

import { useState } from "react"
import { editSchoolAction, changeSchoolStatusAction, updateSchoolSubscriptionAction } from "../actions"
import { exportSchoolDataAction, purgeSchoolDataAction } from "./privacy-actions"
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Shield, Users, School, GraduationCap, Clock, AlertTriangle, CheckCircle2, Lock, Save, Loader2, CreditCard, Sparkles, Calendar, Download, Trash2, FileJson, AlertCircle } from "lucide-react"

interface SchoolDetailClientProps {
    school: any
}

export function SchoolDetailClient({ school }: SchoolDetailClientProps) {
    const [status, setStatus] = useState<'trial' | 'active' | 'suspended'>(school.status || 'trial')
    const [planTier, setPlanTier] = useState<'free' | 'paid'>(school.plan_tier || 'free')
    const [planRenewsAt, setPlanRenewsAt] = useState<string>(school.plan_renews_at || '')
    const [isSaving, setIsSaving] = useState(false)
    const [isChangingStatus, setIsChangingStatus] = useState(false)
    const [isSavingPlan, setIsSavingPlan] = useState(false)
    const [isExporting, setIsExporting] = useState(false)
    const [confirmCodeInput, setConfirmCodeInput] = useState('')
    const [isPurging, setIsPurging] = useState(false)

    const handleExportData = async () => {
        setIsExporting(true)
        try {
            const data = await exportSchoolDataAction(String(school.school_id))
            const jsonStr = JSON.stringify(data, null, 2)
            const blob = new Blob([jsonStr], { type: "application/json" })
            const url = URL.createObjectURL(blob)
            const a = document.createElement("a")
            a.href = url
            a.download = `eduvision_export_${school.school_code || 'school'}_${new Date().toISOString().slice(0, 10)}.json`
            document.body.appendChild(a)
            a.click()
            document.body.removeChild(a)
            URL.revokeObjectURL(url)
        } catch (err: any) {
            alert(err.message || "Failed to export school data")
        } finally {
            setIsExporting(false)
        }
    }

    const handlePurgeData = async () => {
        if (!confirm(`WARNING: Are you absolutely certain you want to permanently purge all data for ${school.school_name}? This action cannot be undone.`)) {
            return
        }

        setIsPurging(true)
        try {
            await purgeSchoolDataAction(String(school.school_id), confirmCodeInput, school.school_code)
            alert("School records permanently purged.")
        } catch (err: any) {
            alert(err.message || "Failed to purge school data")
            setIsPurging(false)
        }
    }

    const handleSavePlan = async () => {
        setIsSavingPlan(true)
        try {
            await updateSchoolSubscriptionAction(String(school.school_id), planTier, planRenewsAt || null)
            alert("Subscription plan and billing details updated successfully!")
        } catch (err: any) {
            alert(err.message || "Failed to update subscription")
        } finally {
            setIsSavingPlan(false)
        }
    }

    const handleSaveDetails = async (formData: FormData) => {
        setIsSaving(true)
        try {
            await editSchoolAction(String(school.school_id), formData)
            alert("School profile updated successfully!")
        } catch (err: any) {
            alert(err.message || "Failed to update school")
        } finally {
            setIsSaving(false)
        }
    }

    const handleStatusChange = async (newStatus: 'trial' | 'active' | 'suspended') => {
        if (newStatus === 'suspended') {
            const confirmed = confirm(
                "Are you sure you want to SUSPEND this school?\n\nSuspending will block all attendance sync writes from teacher devices for this institution immediately."
            )
            if (!confirmed) return
        }

        setIsChangingStatus(true)
        try {
            await changeSchoolStatusAction(String(school.school_id), newStatus)
            setStatus(newStatus)
        } catch (err: any) {
            alert(err.message || "Failed to change status")
        } finally {
            setIsChangingStatus(false)
        }
    }

    return (
        <div className="space-y-6">
            {/* Quick Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="bg-white border-slate-200">
                    <CardContent className="p-4 flex items-center gap-3">
                        <div className="h-10 w-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                            <Users className="h-5 w-5" />
                        </div>
                        <div>
                            <p className="text-[11px] font-semibold text-slate-500 uppercase">Teachers</p>
                            <h4 className="text-xl font-bold text-slate-900">{school.teacher_count}</h4>
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-white border-slate-200">
                    <CardContent className="p-4 flex items-center gap-3">
                        <div className="h-10 w-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                            <GraduationCap className="h-5 w-5" />
                        </div>
                        <div>
                            <p className="text-[11px] font-semibold text-slate-500 uppercase">Students</p>
                            <h4 className="text-xl font-bold text-slate-900">{school.student_count}</h4>
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-white border-slate-200">
                    <CardContent className="p-4 flex items-center gap-3">
                        <div className="h-10 w-10 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
                            <School className="h-5 w-5" />
                        </div>
                        <div>
                            <p className="text-[11px] font-semibold text-slate-500 uppercase">Classes</p>
                            <h4 className="text-xl font-bold text-slate-900">{school.class_count}</h4>
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-white border-slate-200">
                    <CardContent className="p-4 flex items-center gap-3">
                        <div className="h-10 w-10 rounded-lg bg-slate-50 text-slate-600 flex items-center justify-center">
                            <Clock className="h-5 w-5" />
                        </div>
                        <div>
                            <p className="text-[11px] font-semibold text-slate-500 uppercase">Last Sync</p>
                            <h4 className="text-xs font-bold text-slate-900 font-mono mt-0.5">{school.last_activity || "None"}</h4>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Status Governance Card */}
            <Card className="border-slate-200 shadow-sm">
                <CardHeader className="pb-3 border-b bg-slate-50/50">
                    <div className="flex items-center justify-between">
                        <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                            <Shield className="h-4 w-4 text-blue-600" />
                            Account Status & Access Enforcement
                        </CardTitle>
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider ${
                            status === 'active' 
                                ? 'bg-emerald-100 text-emerald-800' 
                                : status === 'trial' 
                                ? 'bg-blue-100 text-blue-800' 
                                : 'bg-red-100 text-red-800'
                        }`}>
                            Current: {status}
                        </span>
                    </div>
                    <CardDescription className="text-xs">
                        Change the operational status of this school across the platform.
                    </CardDescription>
                </CardHeader>
                <CardContent className="p-5 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <button
                            type="button"
                            onClick={() => handleStatusChange('active')}
                            disabled={isChangingStatus}
                            className={`p-4 rounded-xl border text-left transition-all ${
                                status === 'active' 
                                    ? 'border-emerald-500 bg-emerald-50/50 ring-2 ring-emerald-200' 
                                    : 'border-slate-200 hover:border-slate-300 bg-white'
                            }`}
                        >
                            <div className="flex items-center gap-2 font-bold text-sm text-emerald-800">
                                <CheckCircle2 className="h-4 w-4" /> Active Production
                            </div>
                            <p className="text-xs text-slate-500 mt-1">
                                Full operational access. Teachers can take attendance and sync offline records anytime.
                            </p>
                        </button>

                        <button
                            type="button"
                            onClick={() => handleStatusChange('trial')}
                            disabled={isChangingStatus}
                            className={`p-4 rounded-xl border text-left transition-all ${
                                status === 'trial' 
                                    ? 'border-blue-500 bg-blue-50/50 ring-2 ring-blue-200' 
                                    : 'border-slate-200 hover:border-slate-300 bg-white'
                            }`}
                        >
                            <div className="flex items-center gap-2 font-bold text-sm text-blue-800">
                                <Clock className="h-4 w-4" /> Trial Deployment
                            </div>
                            <p className="text-xs text-slate-500 mt-1">
                                Evaluation tier for pilot schools testing device face recognition capabilities.
                            </p>
                        </button>

                        <button
                            type="button"
                            onClick={() => handleStatusChange('suspended')}
                            disabled={isChangingStatus}
                            className={`p-4 rounded-xl border text-left transition-all ${
                                status === 'suspended' 
                                    ? 'border-red-500 bg-red-50/50 ring-2 ring-red-200' 
                                    : 'border-slate-200 hover:border-slate-300 bg-white'
                            }`}
                        >
                            <div className="flex items-center gap-2 font-bold text-sm text-red-800">
                                <Lock className="h-4 w-4" /> Suspended
                            </div>
                            <p className="text-xs text-slate-500 mt-1">
                                <strong>Blocks cloud sync writes.</strong> Mobile uploads will be rejected at database level.
                            </p>
                        </button>
                    </div>

                    {status === 'suspended' && (
                        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-800 flex items-start gap-2">
                            <AlertTriangle className="h-4 w-4 text-red-600 mt-0.5 shrink-0" />
                            <div>
                                <span className="font-bold">Active Enforcement:</span> This school is currently suspended. Database Row-Level Security policies are actively rejecting attendance insertions for this school ID.
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Commercial Plan Tier & Subscription (Phase 6) */}
            <Card className="shadow-sm border-slate-200">
                <CardHeader className="pb-3 border-b bg-slate-50/50">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div>
                            <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                                <CreditCard className="h-4 w-4 text-emerald-600" /> Commercial Licensing & Subscription
                            </CardTitle>
                            <CardDescription className="text-xs">
                                Configure plan tier (Free vs Paid) and subscription renewal dates manually for this institution.
                            </CardDescription>
                        </div>
                        <div>
                            {planTier === 'paid' ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                                    <Sparkles className="h-3 w-3" /> Paid Tier
                                </span>
                            ) : (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200">
                                    Free Community Tier
                                </span>
                            )}
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-5 space-y-5">
                    {/* Tier Selection Radio Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div
                            onClick={() => setPlanTier('free')}
                            className={`cursor-pointer rounded-xl border p-4 transition-all ${
                                planTier === 'free'
                                    ? 'border-blue-500 bg-blue-50/30 ring-2 ring-blue-500/20'
                                    : 'border-slate-200 hover:border-slate-300 bg-white'
                            }`}
                        >
                            <div className="flex items-center justify-between">
                                <h4 className="font-bold text-slate-900 text-sm">Free Community Tier</h4>
                                <input
                                    type="radio"
                                    name="planTierRadio"
                                    checked={planTier === 'free'}
                                    onChange={() => setPlanTier('free')}
                                    className="h-4 w-4 text-blue-600"
                                />
                            </div>
                            <p className="text-xs text-slate-500 mt-1">
                                Essential attendance recording and basic school dashboard for standard rural schools.
                            </p>
                            <div className="mt-3 text-[11px] text-slate-600 space-y-1">
                                <div>• Core daily mobile sync</div>
                                <div>• Standard class-wise breakdown</div>
                                <div>• Basic web roster access</div>
                            </div>
                        </div>

                        <div
                            onClick={() => setPlanTier('paid')}
                            className={`cursor-pointer rounded-xl border p-4 transition-all ${
                                planTier === 'paid'
                                    ? 'border-emerald-500 bg-emerald-50/30 ring-2 ring-emerald-500/20'
                                    : 'border-slate-200 hover:border-slate-300 bg-white'
                            }`}
                        >
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-1.5">
                                    <h4 className="font-bold text-slate-900 text-sm">Paid / Institutional Tier</h4>
                                    <span className="text-[10px] uppercase font-bold bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded">
                                        Commercial
                                    </span>
                                </div>
                                <input
                                    type="radio"
                                    name="planTierRadio"
                                    checked={planTier === 'paid'}
                                    onChange={() => setPlanTier('paid')}
                                    className="h-4 w-4 text-emerald-600"
                                />
                            </div>
                            <p className="text-xs text-slate-500 mt-1">
                                Full institutional compliance suite, official government reporting, and priority quota.
                            </p>
                            <div className="mt-3 text-[11px] text-emerald-700 space-y-1 font-medium">
                                <div>✓ Government Mid-Day Meal (MDM) daily reports</div>
                                <div>✓ Form 9A Monthly Register PDF / CSV official export</div>
                                <div>✓ Unlimited teacher devices & priority telemetry sync</div>
                            </div>
                        </div>
                    </div>

                    {/* Renewal Date Field */}
                    <div className="border-t pt-4 grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
                        <div className="space-y-1.5">
                            <Label htmlFor="plan_renews_at" className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                                <Calendar className="h-3.5 w-3.5 text-slate-500" /> Subscription Renewal Date
                            </Label>
                            <Input
                                id="plan_renews_at"
                                type="date"
                                value={planRenewsAt}
                                onChange={(e) => setPlanRenewsAt(e.target.value)}
                                className="text-sm bg-white"
                            />
                            <p className="text-[11px] text-slate-400">
                                Date when the current institutional licensing period expires or renews.
                            </p>
                        </div>

                        <div className="flex flex-wrap items-center gap-2 pt-2 md:pt-4">
                            <span className="text-xs text-slate-500 mr-1">Quick Set:</span>
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                className="text-xs h-7"
                                onClick={() => {
                                    const d = new Date()
                                    d.setMonth(d.getMonth() + 6)
                                    setPlanRenewsAt(d.toISOString().split('T')[0])
                                }}
                            >
                                +6 Months
                            </Button>
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                className="text-xs h-7"
                                onClick={() => {
                                    const d = new Date()
                                    d.setFullYear(d.getFullYear() + 1)
                                    setPlanRenewsAt(d.toISOString().split('T')[0])
                                }}
                            >
                                +1 Year
                            </Button>
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                className="text-xs h-7 text-slate-400 hover:text-slate-700"
                                onClick={() => setPlanRenewsAt('')}
                            >
                                Clear Date
                            </Button>
                        </div>
                    </div>
                </CardContent>
                <CardFooter className="flex justify-end border-t py-3 bg-slate-50/50">
                    <Button
                        type="button"
                        onClick={handleSavePlan}
                        disabled={isSavingPlan}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-sm"
                    >
                        {isSavingPlan ? <Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> : <Save className="h-4 w-4 mr-1.5" />}
                        Save Subscription Tier
                    </Button>
                </CardFooter>
            </Card>

            {/* Edit School Profile Form */}
            <form action={handleSaveDetails}>
                <Card className="shadow-sm border-slate-200">
                    <CardHeader className="pb-3 border-b bg-slate-50/50">
                        <CardTitle className="text-base font-bold text-slate-900">
                            Edit Institutional Information
                        </CardTitle>
                        <CardDescription className="text-xs">
                            Update naming, identification code, contact details, and policy settings.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="p-5 space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <Label htmlFor="school_name">Official Name *</Label>
                                <Input
                                    id="school_name"
                                    name="school_name"
                                    defaultValue={school.school_name}
                                    required
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label htmlFor="school_code">Institutional Code *</Label>
                                <Input
                                    id="school_code"
                                    name="school_code"
                                    defaultValue={school.school_code}
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <Label htmlFor="address">Address / District</Label>
                            <Input
                                id="address"
                                name="address"
                                defaultValue={school.address || ""}
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <Label htmlFor="contact_email">Headmaster / Admin Email</Label>
                                <Input
                                    id="contact_email"
                                    name="contact_email"
                                    type="email"
                                    defaultValue={school.contact_email || ""}
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label htmlFor="contact_phone">Contact Phone</Label>
                                <Input
                                    id="contact_phone"
                                    name="contact_phone"
                                    defaultValue={school.contact_phone || ""}
                                />
                            </div>
                        </div>

                        <div className="space-y-1.5 pt-2">
                            <Label htmlFor="threshold">At-Risk Attendance Threshold (%)</Label>
                            <Input
                                id="threshold"
                                name="threshold"
                                type="number"
                                min="1"
                                max="100"
                                defaultValue={school.at_risk_threshold_pct ?? 75}
                            />
                            <p className="text-xs text-slate-400">Default is 75%. Students below this threshold trigger alerts.</p>
                        </div>
                    </CardContent>
                    <CardFooter className="flex justify-end border-t py-4 bg-slate-50/50">
                        <Button type="submit" disabled={isSaving} className="bg-blue-600 hover:bg-blue-700">
                            {isSaving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                            Save School Details
                        </Button>
                    </CardFooter>
                </Card>
            </form>

            {/* Privacy, Compliance & Data Subject Tooling (Phase 7.3) */}
            <Card className="shadow-sm border-slate-200 overflow-hidden">
                <CardHeader className="pb-3 border-b bg-slate-50/50">
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                                <Shield className="h-4 w-4 text-purple-600" /> Data Privacy & Compliance Tooling
                            </CardTitle>
                            <CardDescription className="text-xs">
                                Fulfill DPDP / GDPR Data Subject Access Requests (DSAR) and permanent tenant offboarding.
                            </CardDescription>
                        </div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-purple-700 bg-purple-100 px-2 py-0.5 rounded">
                            DPDP / GDPR Tooling
                        </span>
                    </div>
                </CardHeader>
                <CardContent className="p-5 space-y-6">
                    {/* Tool 1: Full School Data Export */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl border border-slate-200 bg-white">
                        <div className="space-y-1">
                            <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                                <FileJson className="h-4 w-4 text-blue-600" /> Complete Institutional Data Export
                            </h4>
                            <p className="text-xs text-slate-500">
                                Download a verified JSON export containing this school&apos;s full metadata, registered classes, staff list, and complete historical attendance logs.
                            </p>
                        </div>
                        <Button
                            type="button"
                            onClick={handleExportData}
                            disabled={isExporting}
                            variant="outline"
                            className="shrink-0 text-xs font-semibold border-slate-300 hover:bg-slate-50"
                        >
                            {isExporting ? <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> : <Download className="h-3.5 w-3.5 mr-1.5 text-blue-600" />}
                            Export School Archive (JSON)
                        </Button>
                    </div>

                    {/* Tool 2: Danger Zone Permanent Purge */}
                    <div className="p-4 rounded-xl border border-red-200 bg-red-50/40 space-y-4">
                        <div className="flex items-start gap-2.5">
                            <AlertCircle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
                            <div className="space-y-1">
                                <h4 className="font-bold text-red-900 text-sm">
                                    Permanent Data Purge (Right to Erasure / Tenant Offboarding)
                                </h4>
                                <p className="text-xs text-red-700">
                                    Irreversibly deletes all attendance records, student rosters, classes, and credentials associated with this institution. To prevent accidental loss, type the school code <span className="font-mono font-bold select-all bg-red-100 px-1 py-0.5 rounded text-red-900">{school.school_code}</span> below to confirm.
                                </p>
                            </div>
                        </div>

                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-2">
                            <Input
                                placeholder={`Type "${school.school_code}" to confirm`}
                                value={confirmCodeInput}
                                onChange={(e) => setConfirmCodeInput(e.target.value)}
                                className="bg-white border-red-300 font-mono text-xs max-w-sm"
                            />
                            <Button
                                type="button"
                                onClick={handlePurgeData}
                                disabled={confirmCodeInput.trim().toUpperCase() !== school.school_code.trim().toUpperCase() || isPurging}
                                className="bg-red-600 hover:bg-red-700 text-white text-xs font-bold disabled:opacity-40 shrink-0"
                            >
                                {isPurging ? <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5 mr-1.5" />}
                                Permanently Purge Institution
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
