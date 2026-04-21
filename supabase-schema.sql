-- ═══════════════════════════════════════════════════════════════
-- FitLab — Supabase Schema
-- Run this in Supabase Dashboard → SQL Editor → New Query
-- ═══════════════════════════════════════════════════════════════

-- Enable UUID generation
create extension if not exists "uuid-ossp";

-- ── Users profile (extends Supabase auth.users) ──────────────
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  gender text default 'female' check (gender in ('female', 'male', 'neutral')),
  base_photo_url text,
  show_suggestions boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', new.email));
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ── Garments (wardrobe items) ────────────────────────────────
create table public.garments (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  file_path text not null,
  img_hash text not null,
  analysis jsonb not null default '{}',
  season text,
  weather_tags text[] default '{}',
  is_affiliate boolean default false,
  affiliate_url text,
  affiliate_brand text,
  affiliate_price decimal(10,2),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Index for fast lookups
create index idx_garments_user on public.garments(user_id);
create index idx_garments_hash on public.garments(user_id, img_hash);

-- ── Try-on results (history) ─────────────────────────────────
create table public.tryon_results (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  render_url text not null,
  garment_ids uuid[] not null,
  cache_key text,
  gender text default 'female',
  morphology text default 'X',
  has_affiliate boolean default false,
  created_at timestamptz default now()
);

create index idx_tryon_user on public.tryon_results(user_id);
create index idx_tryon_cache on public.tryon_results(cache_key);

-- ── Row Level Security ───────────────────────────────────────
-- Users can only see/edit their own data

alter table public.profiles enable row level security;
alter table public.garments enable row level security;
alter table public.tryon_results enable row level security;

-- Profiles: users see only their own
create policy "Users view own profile"
  on public.profiles for select using (auth.uid() = id);
create policy "Users update own profile"
  on public.profiles for update using (auth.uid() = id);

-- Garments: users see only their own
create policy "Users view own garments"
  on public.garments for select using (auth.uid() = user_id);
create policy "Users insert own garments"
  on public.garments for insert with check (auth.uid() = user_id);
create policy "Users update own garments"
  on public.garments for update using (auth.uid() = user_id);
create policy "Users delete own garments"
  on public.garments for delete using (auth.uid() = user_id);

-- Tryon results: users see only their own
create policy "Users view own tryons"
  on public.tryon_results for select using (auth.uid() = user_id);
create policy "Users insert own tryons"
  on public.tryon_results for insert with check (auth.uid() = user_id);

-- ── Storage buckets ──────────────────────────────────────────
-- Run these in SQL Editor too

insert into storage.buckets (id, name, public)
values 
  ('garments', 'garments', true),
  ('renders', 'renders', true),
  ('base-models', 'base-models', true)
on conflict (id) do nothing;

-- Storage policies: authenticated users can upload to their own folder
create policy "Users upload garments"
  on storage.objects for insert
  with check (bucket_id = 'garments' and auth.role() = 'authenticated');

create policy "Public read garments"
  on storage.objects for select
  using (bucket_id = 'garments');

create policy "Users upload renders"
  on storage.objects for insert
  with check (bucket_id = 'renders' and auth.role() = 'authenticated');

create policy "Public read renders"
  on storage.objects for select
  using (bucket_id = 'renders');

create policy "Users upload base models"
  on storage.objects for insert
  with check (bucket_id = 'base-models' and auth.role() = 'authenticated');

create policy "Public read base models"
  on storage.objects for select
  using (bucket_id = 'base-models');
