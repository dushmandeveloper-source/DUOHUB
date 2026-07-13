-- Migration 13: GPS location sharing for profiles.
-- Run once in the Supabase SQL Editor (after migration-12).

alter table profiles add column if not exists share_location boolean not null default false;
alter table profiles add column if not exists lat double precision;
alter table profiles add column if not exists lng double precision;
alter table profiles add column if not exists location_accuracy double precision;
alter table profiles add column if not exists location_updated_at timestamptz;
