-- Migration: Phase 6 Commercialization Features (Plan Tiers & Subscription Renewal)
-- 6.1 Add plan_tier and plan_renews_at to public.schools

alter table public.schools
    add column if not exists plan_tier text not null default 'free'
        check (plan_tier in ('free', 'paid')),
    add column if not exists plan_renews_at date;
