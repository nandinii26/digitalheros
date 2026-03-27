-- Birdie for Good schema
-- Run in Supabase SQL Editor for production persistence.

create extension if not exists "pgcrypto";

create table if not exists profiles (
  id uuid primary key default gen_random_uuid(),
  email text unique not null,
  full_name text not null,
  role text not null check (role in ('subscriber','admin')) default 'subscriber',
  created_at timestamptz not null default now()
);

create table if not exists charities (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text not null,
  image_url text,
  featured boolean not null default false,
  tags text[] not null default '{}',
  events text[] not null default '{}',
  created_at timestamptz not null default now()
);

create table if not exists subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  plan text not null check (plan in ('monthly','yearly')),
  status text not null check (status in ('active','inactive','lapsed','cancelled')),
  renewal_date date not null,
  charity_id uuid not null references charities(id),
  charity_percent numeric(5,2) not null check (charity_percent >= 10 and charity_percent <= 100),
  created_at timestamptz not null default now()
);

create table if not exists stableford_scores (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  score integer not null check (score >= 1 and score <= 45),
  score_date date not null,
  created_at timestamptz not null default now()
);

create table if not exists draws (
  id uuid primary key default gen_random_uuid(),
  month_key text not null,
  mode text not null check (mode in ('random','algorithmic')),
  numbers integer[] not null,
  is_simulation boolean not null default false,
  published boolean not null default false,
  prize_pool_total numeric(12,2) not null,
  jackpot_carry_in numeric(12,2) not null default 0,
  jackpot_carry_out numeric(12,2) not null default 0,
  executed_at timestamptz not null default now(),
  unique (month_key, published)
);

create table if not exists winners (
  id uuid primary key default gen_random_uuid(),
  draw_id uuid not null references draws(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  tier integer not null check (tier in (3,4,5)),
  matches integer not null,
  amount numeric(12,2) not null,
  status text not null check (status in ('pending','approved','rejected')) default 'pending',
  payout_status text not null check (payout_status in ('pending','paid')) default 'pending',
  proof_url text,
  reviewed_by uuid references profiles(id),
  reviewed_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists idx_scores_user_date on stableford_scores(user_id, score_date desc);
create index if not exists idx_subscriptions_user on subscriptions(user_id);
create index if not exists idx_winners_user on winners(user_id);
