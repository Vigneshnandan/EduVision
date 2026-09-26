"use client"

import { useState } from "react"
import { editSchoolAction, changeSchoolStatusAction } from "../actions"
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Shield, Users, School, GraduationCap, Clock, AlertTriangle, CheckCircle2, Lock, Save, Loader2 } from "lucide-react"

interface SchoolDetailClientProps {
    school: any
}

export function SchoolDetailClient({ school }: SchoolDetailClientProps) {
    const [status, setStatus] = useState<'trial' | 'active' | 'suspended'>(school.status || 'trial')
    const [isSaving, setIsSaving] = useState(false)
    const [isChangingStatus, setIsChangingStatus] = useState(false)

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
        </div>
    )
}
