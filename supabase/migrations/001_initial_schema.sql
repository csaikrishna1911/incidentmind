-- ============================================================
-- IncidentMind: Initial Database Schema
-- Migration: 001_initial_schema.sql
-- Created:  2026-09-27
--
-- Run this in: Supabase Dashboard → SQL Editor → New Query
-- ============================================================

-- --------------------------------------------------------
-- 1. INCIDENTS TABLE
-- --------------------------------------------------------
create table if not exists incidents (
  id          uuid primary key default gen_random_uuid(),
  title       text not null,
  service     text not null,
  severity    text not null check (severity in ('P1', 'P2', 'P3', 'P4')),
  status      text not null default 'open' check (status in ('open', 'investigating', 'resolved')),
  description text,
  created_by  text,
  created_at  timestamptz not null default now(),
  resolved_at timestamptz
);

-- --------------------------------------------------------
-- 2. MESSAGES TABLE
-- --------------------------------------------------------
create table if not exists messages (
  id          uuid primary key default gen_random_uuid(),
  incident_id uuid not null references incidents(id) on delete cascade,
  user_id     text,
  user_name   text not null,
  message     text not null,
  created_at  timestamptz not null default now()
);

-- Index for fast lookups: "get all messages for an incident, sorted by time"
create index if not exists idx_messages_incident_created
  on messages (incident_id, created_at);

-- --------------------------------------------------------
-- 3. POSTMORTEMS TABLE
-- --------------------------------------------------------
create table if not exists postmortems (
  id              uuid primary key default gen_random_uuid(),
  incident_id     uuid not null unique references incidents(id) on delete cascade,
  root_cause      text,
  what_worked     text,
  what_failed     text,
  lessons_learned text,
  created_by      text,
  created_at      timestamptz not null default now()
);

-- ============================================================
-- 4. ROW LEVEL SECURITY (RLS)
--
-- RLS is ENABLED on all tables. The policies below are
-- DEVELOPMENT-ONLY — they allow full read/write access via
-- the publishable (anon) key. Replace these with proper
-- auth-based policies before going to production.
-- ============================================================

-- --- incidents ---
alter table incidents enable row level security;

create policy "DEV_ONLY: Allow all reads on incidents"
  on incidents for select using (true);

create policy "DEV_ONLY: Allow all inserts on incidents"
  on incidents for insert with check (true);

create policy "DEV_ONLY: Allow all updates on incidents"
  on incidents for update using (true) with check (true);

create policy "DEV_ONLY: Allow all deletes on incidents"
  on incidents for delete using (true);

-- --- messages ---
alter table messages enable row level security;

create policy "DEV_ONLY: Allow all reads on messages"
  on messages for select using (true);

create policy "DEV_ONLY: Allow all inserts on messages"
  on messages for insert with check (true);

create policy "DEV_ONLY: Allow all updates on messages"
  on messages for update using (true) with check (true);

create policy "DEV_ONLY: Allow all deletes on messages"
  on messages for delete using (true);

-- --- postmortems ---
alter table postmortems enable row level security;

create policy "DEV_ONLY: Allow all reads on postmortems"
  on postmortems for select using (true);

create policy "DEV_ONLY: Allow all inserts on postmortems"
  on postmortems for insert with check (true);

create policy "DEV_ONLY: Allow all updates on postmortems"
  on postmortems for update using (true) with check (true);

create policy "DEV_ONLY: Allow all deletes on postmortems"
  on postmortems for delete using (true);

-- ============================================================
-- 5. REALTIME
--
-- Add messages and incidents to Supabase Realtime so that
-- multiple team members can collaborate live in an incident room.
-- ============================================================

alter publication supabase_realtime add table messages;
alter publication supabase_realtime add table incidents;
