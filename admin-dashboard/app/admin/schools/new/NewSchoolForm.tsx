"use client"

import { useState } from "react"
import { createSchoolAction } from "../actions"
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Link from "next/link"
import { Building2, Sparkles, UserCheck, Key, Eye, EyeOff, RefreshCw, Loader2, Shield } from "lucide-react"

function generateRandomPassword() {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%"
    let pass = ""
    for (let i = 0; i < 10; i++) {
        pass += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return pass
}

export function NewSchoolForm() {
    const [schoolName, setSchoolName] = useState("")
    const [contactEmail, setContactEmail] = useState("")
    const [adminName, setAdminName] = useState("")
    const [adminEmail, setAdminEmail] = useState("")
    const [adminPassword, setAdminPassword] = useState("AdminPass@2026")
    const [showPassword, setShowPassword] = useState(false)
    const [isSubmitting, setIsSubmitting] = useState(false)

    const handleSchoolNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value
        setSchoolName(val)
        if (!adminName || adminName === `${schoolName} Admin`) {
            setAdminName(val ? `${val} Admin` : "")
        }
    }

    const handleContactEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value
        setContactEmail(val)
        if (!adminEmail || adminEmail === contactEmail) {
            setAdminEmail(val)
        }
    }

    const handleRegeneratePassword = () => {
        setAdminPassword(generateRandomPassword())
    }

    return (
        <form 
            action={async (formData) => {
                setIsSubmitting(true)
                try {
                    await createSchoolAction(formData)
                } catch (err: any) {
                    alert(err.message || "Failed to register school")
                    setIsSubmitting(false)
                }
            }} 
            className="space-y-6"
        >
            {/* Card 1: School Profile */}
            <Card className="shadow-sm border-slate-200">
                <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                        <Building2 className="h-5 w-5 text-blue-600" />
                        Institutional Profile & Licensing
                    </CardTitle>
                    <CardDescription>
                        Enter basic school details. A unique institutional code will be assigned automatically if omitted.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="school_name">Official School Name *</Label>
                        <Input
                            id="school_name"
                            name="school_name"
                            value={schoolName}
                            onChange={handleSchoolNameChange}
                            placeholder="e.g. Government Girls High School"
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <Label htmlFor="school_code">Institutional Code (Optional)</Label>
                            <span className="text-[11px] text-blue-600 flex items-center gap-1 font-medium">
                                <Sparkles className="h-3 w-3" /> Auto-generated if left blank
                            </span>
                        </div>
                        <Input
                            id="school_code"
                            name="school_code"
                            placeholder="e.g. GGHS-1049 (or leave blank)"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="address">Address / Block / District</Label>
                        <Input
                            id="address"
                            name="address"
                            placeholder="e.g. Sector 4, North District, Jaipur"
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                        <div className="space-y-2">
                            <Label htmlFor="contact_email">Official / Contact Email</Label>
                            <Input
                                id="contact_email"
                                name="contact_email"
                                type="email"
                                value={contactEmail}
                                onChange={handleContactEmailChange}
                                placeholder="principal@gghs.edu.in"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="contact_phone">Contact Number</Label>
                            <Input
                                id="contact_phone"
                                name="contact_phone"
                                placeholder="+91 98765 43210"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                        <div className="space-y-2">
                            <Label htmlFor="status">Governance Status</Label>
                            <select
                                id="status"
                                name="status"
                                defaultValue="trial"
                                className="w-full h-10 px-3 py-2 border rounded-md text-sm bg-white border-input"
                            >
                                <option value="trial">Trial Deployment (Pilot evaluation)</option>
                                <option value="active">Active Production (Authorized for live sync)</option>
                            </select>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="plan_tier">Commercial Plan Tier</Label>
                            <select
                                id="plan_tier"
                                name="plan_tier"
                                defaultValue="free"
                                className="w-full h-10 px-3 py-2 border rounded-md text-sm bg-white border-input font-medium"
                            >
                                <option value="free">Free Community Tier</option>
                                <option value="paid">Paid / Institutional Tier (Full Enterprise Suite)</option>
                            </select>
                        </div>
                    </div>

                    <div className="space-y-2 pt-2">
                        <Label htmlFor="plan_renews_at">Subscription Renewal Date (Optional)</Label>
                        <Input
                            id="plan_renews_at"
                            name="plan_renews_at"
                            type="date"
                            className="bg-white"
                        />
                    </div>
                </CardContent>
            </Card>

            {/* Card 2: Initial Administrator Account Credentials */}
            <Card className="shadow-sm border-blue-200 bg-blue-50/20">
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <CardTitle className="text-lg flex items-center gap-2 text-slate-900">
                            <Shield className="h-5 w-5 text-blue-600" />
                            School Administrator Account (Initial Login)
                        </CardTitle>
                        <span className="text-[11px] font-semibold uppercase tracking-wider bg-blue-100 text-blue-800 px-2.5 py-0.5 rounded-full">
                            School Admin Credentials
                        </span>
                    </div>
                    <CardDescription className="text-slate-600">
                        EduVision will automatically create the primary administrator account in Supabase Auth. These credentials are used to sign in to the <strong>School Dashboard</strong> and the <strong>EduVision Android App</strong>.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="admin_name">Administrator Full Name</Label>
                        <Input
                            id="admin_name"
                            name="admin_name"
                            value={adminName}
                            onChange={(e) => setAdminName(e.target.value)}
                            placeholder="e.g. Dr. Ramesh Gupta (Principal)"
                            required
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="admin_email">Login ID / Email Address *</Label>
                            <Input
                                id="admin_email"
                                name="admin_email"
                                type="email"
                                value={adminEmail}
                                onChange={(e) => setAdminEmail(e.target.value)}
                                placeholder="principal@gghs.edu.in"
                                required
                            />
                            <p className="text-[11px] text-slate-500">
                                This will be the username for logging into both web & mobile app.
                            </p>
                        </div>

                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <Label htmlFor="admin_password">Initial Password *</Label>
                                <button
                                    type="button"
                                    onClick={handleRegeneratePassword}
                                    className="text-[11px] text-blue-600 hover:text-blue-800 flex items-center gap-1 font-medium"
                                >
                                    <RefreshCw className="h-3 w-3" /> Auto-generate
                                </button>
                            </div>
                            <div className="relative">
                                <Input
                                    id="admin_password"
                                    name="admin_password"
                                    type={showPassword ? "text" : "password"}
                                    value={adminPassword}
                                    onChange={(e) => setAdminPassword(e.target.value)}
                                    placeholder="Enter initial password"
                                    className="pr-10 bg-white font-mono text-sm"
                                    required
                                    minLength={6}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
                                >
                                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </button>
                            </div>
                            <p className="text-[11px] text-slate-500">
                                Minimum 6 characters. You will be able to copy these credentials once created.
                            </p>
                        </div>
                    </div>
                </CardContent>
                <CardFooter className="flex justify-between border-t py-4 bg-slate-50/70">
                    <Link href="/admin/schools">
                        <Button type="button" variant="outline" disabled={isSubmitting}>Cancel</Button>
                    </Link>
                    <Button type="submit" disabled={isSubmitting} className="bg-blue-600 hover:bg-blue-700">
                        {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Register School & Provision Admin
                    </Button>
                </CardFooter>
            </Card>
        </form>
    )
}
