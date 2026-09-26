-- Migration: Phase 7 Security, Audit & Compliance
-- 7.1 Admin Audit Log table
create table if not exists public.admin_audit_logs (
    log_id uuid primary key default gen_random_uuid(),
    admin_id text not null, -- User identifier or email of administrator
    action text not null,   -- e.g. 'school_created', 'school_suspended', 'teacher_deactivated', 'data_exported', 'school_data_purged'
    target_type text not null, -- 'school', 'teacher', 'platform', 'compliance'
    target_id text not null,   -- e.g. school_id or teacher_id
    details jsonb default '{}'::jsonb,
    ip_address text,
    created_at timestamptz default now()
);

alter table public.admin_audit_logs enable row level security;

-- 7.4 App-version tracking
-- Option A: app_version directly attached to attendance events
alter table public.attendance
    add column if not exists app_version text;

-- Option B: device_syncs table for device health & active build tracking
create table if not exists public.device_syncs (
    sync_id uuid primary key default gen_random_uuid(),
    school_id bigint references public.schools(school_id) on delete cascade,
    device_id text not null,
    app_version text not null,
    android_version text,
    device_model text,
    last_sync_at timestamptz default now(),
    unique(school_id, device_id)
);

alter table public.device_syncs enable row level security;
