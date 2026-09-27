import { createAdminServiceClient } from "@/lib/supabase-service"
import { createClient } from "@/lib/supabase-server"

export interface AdminAuditLogEntry {
    log_id: string;
    admin_id: string;
    action: string;
    target_type: string;
    target_id: string;
    details: Record<string, any>;
    ip_address?: string | null;
    created_at: string;
}

export async function logAdminAction(params: {
    action: string;
    targetType: string;
    targetId: string;
    details?: Record<string, any>;
    adminId?: string;
    ipAddress?: string;
}) {
    const supabase = createAdminServiceClient()

    let actor = params.adminId
    if (!actor) {
        try {
            const sessionClient = await createClient()
            const { data: { user } } = await sessionClient.auth.getUser()
            actor = user?.email || user?.id || 'Platform Admin'
        } catch {
            actor = 'Platform Admin'
        }
    }

    const { error } = await supabase
        .from('admin_audit_logs')
        .insert({
            admin_id: actor,
            action: params.action,
            target_type: params.targetType,
            target_id: params.targetId,
            details: params.details || {},
            ip_address: params.ipAddress || null
        })

    if (error) {
        const failureMessage = `[CRITICAL AUDIT LOG FAILURE] Could not persist audit log for action "${params.action}" on ${params.targetType}:${params.targetId}: ${error.message}`
        console.error(failureMessage)
        throw new Error(failureMessage)
    }
}

export async function getRecentAuditLogs(limit: number = 50): Promise<AdminAuditLogEntry[]> {
    try {
        const supabase = createAdminServiceClient()
        const { data, error } = await supabase
            .from('admin_audit_logs')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(limit)

        if (error || !data) return []

        return data.map((d: any) => ({
            log_id: String(d.log_id),
            admin_id: d.admin_id,
            action: d.action,
            target_type: d.target_type,
            target_id: d.target_id,
            details: d.details || {},
            ip_address: d.ip_address,
            created_at: d.created_at
        }))
    } catch {
        return []
    }
}

export interface DeviceTelemetryItem {
    school_id: string;
    school_name: string;
    school_code: string;
    device_id: string;
    app_version: string;
    android_version?: string;
    device_model?: string;
    last_sync_at: string;
    is_latest: boolean;
}

export async function getDeviceTelemetry(): Promise<{
    devices: DeviceTelemetryItem[];
    versionCounts: Record<string, number>;
    latestVersion: string;
}> {
    const supabase = createAdminServiceClient()
    const latestVersion = "v1.2.4" // Platform baseline target

    // 1. Fetch schools for mapping
    const { data: schoolsData } = await supabase
        .from('schools')
        .select('school_id, school_name, school_code')

    const schoolMap: Record<string, { name: string; code: string }> = {}
    schoolsData?.forEach((s: any) => {
        schoolMap[String(s.school_id)] = { name: s.school_name, code: s.school_code }
    })

    // 2. Fetch device sync records
    const { data: deviceSyncs, error } = await supabase
        .from('device_syncs')
        .select('*')
        .order('last_sync_at', { ascending: false })

    if (error || !deviceSyncs || deviceSyncs.length === 0) {
        // Fallback or empty state
        return { devices: [], versionCounts: {}, latestVersion }
    }

    const versionCounts: Record<string, number> = {}

    const devices: DeviceTelemetryItem[] = deviceSyncs.map((d: any) => {
        const sid = String(d.school_id)
        const v = d.app_version || 'Unknown'
        versionCounts[v] = (versionCounts[v] || 0) + 1

        return {
            school_id: sid,
            school_name: schoolMap[sid]?.name || `School ${sid}`,
            school_code: schoolMap[sid]?.code || 'N/A',
            device_id: d.device_id,
            app_version: v,
            android_version: d.android_version,
            device_model: d.device_model,
            last_sync_at: d.last_sync_at,
            is_latest: v === latestVersion
        }
    })

    return { devices, versionCounts, latestVersion }
}
