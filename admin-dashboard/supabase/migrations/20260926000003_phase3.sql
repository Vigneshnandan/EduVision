-- Migration: Phase 3 Attendance Correction Reason
alter table public.attendance add column if not exists correction_reason text;
