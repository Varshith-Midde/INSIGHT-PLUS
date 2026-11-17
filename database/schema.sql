-- Optional Supabase/PostgreSQL schema. Active MVP rooms currently run in server memory.
create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key default gen_random_uuid(),
  display_name text not null check (char_length(display_name) between 2 and 24),
  avatar_url text,
  created_at timestamptz not null default now()
);

create table if not exists public.game_rooms (
  id uuid primary key default gen_random_uuid(),
  room_code text unique not null,
  host_profile_id uuid references public.profiles(id) on delete set null,
  mode text not null,
  status text not null default 'waiting',
  created_at timestamptz not null default now()
);

create table if not exists public.room_players (
  room_id uuid references public.game_rooms(id) on delete cascade,
  profile_id uuid references public.profiles(id) on delete cascade,
  score integer not null default 0,
  joined_at timestamptz not null default now(),
  primary key (room_id, profile_id)
);

create table if not exists public.questions (
  id text primary key,
  mode text not null,
  prompt text not null,
  is_active boolean not null default true
);

create table if not exists public.round_answers (
  id uuid primary key default gen_random_uuid(),
  room_id uuid references public.game_rooms(id) on delete cascade,
  round_number integer not null,
  profile_id uuid references public.profiles(id) on delete cascade,
  answer_text text not null check (char_length(answer_text) <= 240),
  votes integer not null default 0,
  created_at timestamptz not null default now()
);

-- Configure Row Level Security and policies before exposing these tables to clients.
