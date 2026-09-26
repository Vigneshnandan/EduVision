import { getRecentAuditLogs, getDeviceTelemetry } from "@/lib/admin-audit"
import { AuditConsoleClient } from "./AuditConsoleClient"

export const metadata = {
    title: "Security, Audit & Compliance — Platform Governance",
    description: "Administrative audit trail, device version distribution, and RLS policy verification."
}

export const revalidate = 0

export default async function AdminAuditPage() {
    const [logs, telemetry] = await Promise.all([
        getRecentAuditLogs(100),
        getDeviceTelemetry()
    ])

    return (
        <AuditConsoleClient
            initialLogs={logs}
            telemetry={telemetry}
        />
    )
}
