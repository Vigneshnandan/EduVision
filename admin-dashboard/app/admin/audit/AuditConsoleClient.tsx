"use client"

import { useState } from "react"
import { AdminAuditLogEntry, DeviceTelemetryItem } from "@/lib/admin-audit"
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
    ShieldCheck,
    Smartphone,
    ShieldAlert,
    Search,
    Clock,
    UserCheck,
    Database,
    FileText,
    CheckCircle2,
    AlertTriangle,
    Download,
    Trash2,
    Activity,
    Layers,
    Lock
} from "lucide-react"

interface AuditConsoleClientProps {
    initialLogs: AdminAuditLogEntry[];
    telemetry: {
        devices: DeviceTelemetryItem[];
        versionCounts: Record<string, number>;
        latestVersion: string;
    };
}

export function AuditConsoleClient({ initialLogs, telemetry }: AuditConsoleClientProps) {
    const [activeTab, setActiveTab] = useState<"audit" | "devices" | "rls">("audit")
    const [searchTerm, setSearchTerm] = useState("")
    const [selectedActionFilter, setSelectedActionFilter] = useState("All")

    const filteredLogs = initialLogs.filter((log) => {
        const matchesSearch =
            log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
            log.admin_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
            log.target_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
            JSON.stringify(log.details).toLowerCase().includes(searchTerm.toLowerCase())

        const matchesAction = selectedActionFilter === "All" || log.action === selectedActionFilter
        return matchesSearch && matchesAction
    })

    const uniqueActions = Array.from(new Set(initialLogs.map(l => l.action)))

    const getActionBadge = (action: string) => {
        if (action.includes('purged') || action.includes('deleted')) {
            return (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-red-100 text-red-800 border border-red-200">
                    <Trash2 className="h-3 w-3" /> {action}
                </span>
            )
        }
        if (action.includes('export')) {
            return (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-purple-100 text-purple-800 border border-purple-200">
                    <Download className="h-3 w-3" /> {action}
                </span>
            )
        }
        if (action.includes('suspended') || action.includes('deactivated')) {
            return (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                    <AlertTriangle className="h-3 w-3" /> {action}
                </span>
            )
        }
        return (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                <CheckCircle2 className="h-3 w-3" /> {action}
            </span>
        )
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-6">
                <div>
                    <div className="flex items-center gap-2">
                        <span className="px-2.5 py-0.5 rounded text-xs font-bold uppercase tracking-wider bg-blue-100 text-blue-800 border border-blue-200">
                            Governance & Compliance
                        </span>
                        <span className="text-xs text-slate-500 font-medium">Phase 7 Security Framework</span>
                    </div>
                    <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight mt-1">
                        Security, Audit & Compliance Console
                    </h1>
                    <p className="text-slate-500 text-sm mt-0.5">
                        Immutable administrative audit logging, Android client build tracking, and RLS policy verification.
                    </p>
                </div>

                {/* Tab Switcher */}
                <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl border border-slate-200">
                    <Button
                        size="sm"
                        variant={activeTab === "audit" ? "default" : "ghost"}
                        onClick={() => setActiveTab("audit")}
                        className={activeTab === "audit" ? "bg-white text-slate-900 shadow-sm text-xs font-bold" : "text-xs text-slate-600"}
                    >
                        <ShieldCheck className="h-3.5 w-3.5 mr-1.5 text-blue-600" /> Audit Log ({initialLogs.length})
                    </Button>
                    <Button
                        size="sm"
                        variant={activeTab === "devices" ? "default" : "ghost"}
                        onClick={() => setActiveTab("devices")}
                        className={activeTab === "devices" ? "bg-white text-slate-900 shadow-sm text-xs font-bold" : "text-xs text-slate-600"}
                    >
                        <Smartphone className="h-3.5 w-3.5 mr-1.5 text-emerald-600" /> App Versions
                    </Button>
                    <Button
                        size="sm"
                        variant={activeTab === "rls" ? "default" : "ghost"}
                        onClick={() => setActiveTab("rls")}
                        className={activeTab === "rls" ? "bg-white text-slate-900 shadow-sm text-xs font-bold" : "text-xs text-slate-600"}
                    >
                        <Lock className="h-3.5 w-3.5 mr-1.5 text-purple-600" /> Access & RLS Logs
                    </Button>
                </div>
            </div>

            {/* TAB 1: Admin Audit Log (7.1) */}
            {activeTab === "audit" && (
                <div className="space-y-4">
                    {/* Filters bar */}
                    <div className="flex flex-col md:flex-row items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                        <div className="relative flex-1 w-full max-w-md">
                            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                            <Input
                                placeholder="Search by admin email, action, target, or details..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-9 text-xs"
                            />
                        </div>
                        <div className="flex items-center gap-2 w-full md:w-auto">
                            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider shrink-0">
                                Filter Action:
                            </span>
                            <select
                                value={selectedActionFilter}
                                onChange={(e) => setSelectedActionFilter(e.target.value)}
                                className="bg-slate-50 border border-slate-300 text-xs font-medium rounded-lg px-3 py-2 text-slate-800 focus:outline-none"
                            >
                                <option value="All">All Actions ({initialLogs.length})</option>
                                {uniqueActions.map((act) => (
                                    <option key={act} value={act}>
                                        {act}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Table */}
                    <Card className="border-slate-200 shadow-sm bg-white overflow-hidden">
                        <CardContent className="p-0">
                            <div className="overflow-x-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow className="bg-slate-50/70 text-xs text-slate-600 uppercase font-semibold">
                                            <TableHead>Timestamp</TableHead>
                                            <TableHead>Administrator</TableHead>
                                            <TableHead>Action</TableHead>
                                            <TableHead>Target</TableHead>
                                            <TableHead>Event Details</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {filteredLogs.map((log) => (
                                            <TableRow key={log.log_id} className="hover:bg-slate-50/60 transition-colors">
                                                <TableCell className="text-xs font-mono text-slate-500 whitespace-nowrap">
                                                    {new Date(log.created_at).toLocaleString()}
                                                </TableCell>
                                                <TableCell className="font-semibold text-slate-800 text-xs whitespace-nowrap">
                                                    <span className="inline-flex items-center gap-1.5">
                                                        <UserCheck className="h-3.5 w-3.5 text-blue-600" />
                                                        {log.admin_id}
                                                    </span>
                                                </TableCell>
                                                <TableCell className="whitespace-nowrap">
                                                    {getActionBadge(log.action)}
                                                </TableCell>
                                                <TableCell className="text-xs font-mono text-slate-600 whitespace-nowrap">
                                                    <span className="bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                                                        {log.target_type}: {log.target_id}
                                                    </span>
                                                </TableCell>
                                                <TableCell className="text-xs font-mono text-slate-500 max-w-md truncate">
                                                    {Object.keys(log.details).length > 0
                                                        ? JSON.stringify(log.details)
                                                        : "—"}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                        {filteredLogs.length === 0 && (
                                            <TableRow>
                                                <TableCell colSpan={5} className="text-center py-12 text-slate-400">
                                                    <ShieldCheck className="h-10 w-10 mx-auto text-slate-300 mb-2" />
                                                    <p className="font-semibold text-slate-700 text-sm">No Audit Logs Found</p>
                                                    <p className="text-xs text-slate-400 mt-0.5">Admin operations will appear here in real-time as actions occur.</p>
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* TAB 2: App Version & Device Telemetry (7.4) */}
            {activeTab === "devices" && (
                <div className="space-y-6">
                    {/* Top KPI Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <Card className="bg-white border-slate-200 shadow-sm">
                            <CardContent className="p-4 flex items-center gap-3">
                                <div className="h-10 w-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                                    <Smartphone className="h-5 w-5" />
                                </div>
                                <div>
                                    <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Active Devices Monitored</p>
                                    <h4 className="text-2xl font-black text-slate-900">{telemetry.devices.length}</h4>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="bg-white border-slate-200 shadow-sm">
                            <CardContent className="p-4 flex items-center gap-3">
                                <div className="h-10 w-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                                    <CheckCircle2 className="h-5 w-5" />
                                </div>
                                <div>
                                    <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Target Android Release</p>
                                    <h4 className="text-2xl font-black text-slate-900">{telemetry.latestVersion}</h4>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="bg-white border-slate-200 shadow-sm">
                            <CardContent className="p-4 flex items-center gap-3">
                                <div className="h-10 w-10 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
                                    <Activity className="h-5 w-5" />
                                </div>
                                <div>
                                    <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Build Variants</p>
                                    <h4 className="text-2xl font-black text-slate-900">
                                        {Object.keys(telemetry.versionCounts).length || 1} Active
                                    </h4>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Mobile Integration Contract Box */}
                    <Card className="border-blue-200 bg-blue-50/40 shadow-sm">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-bold text-blue-900 flex items-center gap-2">
                                <Smartphone className="h-4 w-4 text-blue-600" />
                                Android Device Sync Specification (Phase 7.4 Architecture)
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2 text-xs text-blue-800">
                            <p>
                                When the Android app submits batch attendance or heartbeats, the mobile client includes the following telemetry headers or fields:
                            </p>
                            <div className="font-mono bg-white p-3 rounded-lg border border-blue-200 text-[11px] text-slate-700 space-y-1">
                                <div><span className="text-slate-400">app_version:</span> &quot;1.2.4&quot; (BuildConfig.VERSION_NAME)</div>
                                <div><span className="text-slate-400">android_version:</span> &quot;14 (API 34)&quot; (Build.VERSION.RELEASE)</div>
                                <div><span className="text-slate-400">device_model:</span> &quot;Samsung Galaxy Tab A8&quot; (Build.MODEL)</div>
                                <div><span className="text-slate-400">device_id:</span> &quot;f0a1c389-...&quot; (Secure.ANDROID_ID)</div>
                            </div>
                            <p className="text-[11px] text-blue-700">
                                The `device_syncs` table upserts on `(school_id, device_id)` to keep real-time track of which schools need client updates.
                            </p>
                        </CardContent>
                    </Card>

                    {/* Devices Table */}
                    <Card className="border-slate-200 shadow-sm bg-white overflow-hidden">
                        <CardHeader className="border-b bg-slate-50/50 pb-3">
                            <CardTitle className="text-base font-bold text-slate-900">
                                Handheld Device & Version Inventory
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-slate-50/70 text-xs font-semibold text-slate-600 uppercase">
                                        <TableHead>Institution</TableHead>
                                        <TableHead>Device ID</TableHead>
                                        <TableHead>App Version</TableHead>
                                        <TableHead>OS / Model</TableHead>
                                        <TableHead>Last Sync</TableHead>
                                        <TableHead className="text-right">Status</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {telemetry.devices.map((d) => (
                                        <TableRow key={d.device_id}>
                                            <TableCell>
                                                <div className="font-bold text-slate-900 text-xs">{d.school_name}</div>
                                                <div className="font-mono text-[10px] text-slate-400">{d.school_code}</div>
                                            </TableCell>
                                            <TableCell className="font-mono text-xs text-slate-600">
                                                {d.device_id.slice(0, 12)}...
                                            </TableCell>
                                            <TableCell>
                                                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-bold ${
                                                    d.is_latest
                                                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                                        : 'bg-amber-50 text-amber-700 border border-amber-200'
                                                }`}>
                                                    {d.app_version}
                                                </span>
                                            </TableCell>
                                            <TableCell className="text-xs text-slate-600">
                                                {d.device_model || 'Android Tablet'} ({d.android_version || 'Android'})
                                            </TableCell>
                                            <TableCell className="text-xs text-slate-500 font-mono">
                                                {new Date(d.last_sync_at).toLocaleString()}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                {d.is_latest ? (
                                                    <span className="text-xs font-bold text-emerald-600">Up to Date</span>
                                                ) : (
                                                    <span className="text-xs font-bold text-amber-600">Update Required</span>
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                    {telemetry.devices.length === 0 && (
                                        <TableRow>
                                            <TableCell colSpan={6} className="text-center py-10 text-slate-400">
                                                <Smartphone className="h-8 w-8 mx-auto text-slate-300 mb-2" />
                                                <p className="font-semibold text-slate-700 text-sm">No Active Sync Telemetry</p>
                                                <p className="text-xs text-slate-400 mt-0.5">
                                                    Device builds will populate automatically as teacher mobile apps sync attendance.
                                                </p>
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* TAB 3: Access & RLS Denials (7.2) */}
            {activeTab === "rls" && (
                <div className="space-y-6">
                    <Card className="border-slate-200 shadow-sm bg-white">
                        <CardHeader className="border-b bg-slate-50/50">
                            <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                                <Lock className="h-4 w-4 text-purple-600" />
                                Security Access Telemetry & RLS Audit (Phase 7.2)
                            </CardTitle>
                            <CardDescription className="text-xs">
                                Verification of native Supabase infrastructure logging vs application security events.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="p-6 space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2">
                                    <div className="flex items-center gap-2 font-bold text-sm text-slate-900">
                                        <Database className="h-4 w-4 text-emerald-600" />
                                        PostgreSQL RLS Denial Engine (Code 42501)
                                    </div>
                                    <p className="text-xs text-slate-600 leading-relaxed">
                                        When an unauthenticated caller or a teacher from School A attempts to query or insert data for School B, or when a suspended school attempts to sync attendance, Postgres automatically rejects the statement with error code <code className="text-red-600 font-mono bg-red-50 px-1 py-0.5 rounded">42501</code> (insufficient_privilege).
                                    </p>
                                    <p className="text-xs text-slate-500">
                                        These denials are recorded in the Supabase PostgreSQL engine log telemetry stream with caller IP, timestamp, and query fingerprint.
                                    </p>
                                </div>

                                <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2">
                                    <div className="flex items-center gap-2 font-bold text-sm text-slate-900">
                                        <ShieldAlert className="h-4 w-4 text-blue-600" />
                                        Supabase Auth Audit Log (`auth.audit_log_entries`)
                                    </div>
                                    <p className="text-xs text-slate-600 leading-relaxed">
                                        Supabase natively captures every authentication attempt, failed credential submission, token refresh, and IP geolocation in <code className="font-mono text-blue-700 bg-blue-50 px-1 py-0.5 rounded">auth.audit_log_entries</code>.
                                    </p>
                                    <p className="text-xs text-slate-500">
                                        Per compliance guidelines, building a duplicate login attempt table is avoided to maintain a single source of truth for auth auditing.
                                    </p>
                                </div>
                            </div>

                            {/* Active Enforcement Verification */}
                            <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/40 space-y-2">
                                <h4 className="font-bold text-emerald-950 text-sm flex items-center gap-2">
                                    <CheckCircle2 className="h-4 w-4 text-emerald-600" /> Active Security Policies Verified
                                </h4>
                                <ul className="text-xs text-emerald-900 space-y-1.5 list-disc pl-5">
                                    <li><strong>Suspended School RLS Policy:</strong> Attendance sync inserts are blocked at the database engine level whenever `schools.status = &apos;suspended&apos;`.</li>
                                    <li><strong>Service Role Client Isolation:</strong> Admin cross-school aggregation queries utilize backend-only service credentials; mobile devices and regular teachers have strictly scoped tenant access.</li>
                                    <li><strong>Administrative Audit Trail:</strong> Every school creation, status suspension, teacher deactivation, and data export is logged with actor identification into `admin_audit_logs`.</li>
                                </ul>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}
        </div>
    )
}
