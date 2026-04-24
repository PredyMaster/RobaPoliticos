-- ============================================================
-- 001_tables.sql
-- Esquema principal de tablas
-- ============================================================

-- ── profiles ────────────────────────────────────────────────
create table if not exists profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  username    text not null,
  avatar_url  text,
  level       int  not null default 1,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- ── wallets ─────────────────────────────────────────────────
create table if not exists wallets (
  user_id       uuid primary key references profiles(id) on delete cascade,
  total_score   bigint not null default 0,
  current_coins bigint not null default 0,
  premium_gems  bigint not null default 0,
  updated_at    timestamptz not null default now()
);

-- ── weapons (catálogo global, solo lectura para jugadores) ──
create table if not exists weapons (
  id                  text  primary key,
  name                text  not null,
  description         text  not null default '',
  price               bigint not null default 0,
  unlock_level        int   not null default 1,
  coins_per_hit       int   not null default 1,
  force               float not null default 300,
  cooldown            float not null default 0.5,
  critical_chance     float not null default 0.05,
  critical_multiplier float not null default 2.0,
  spread              float not null default 0.3,
  rarity_bonus        float not null default 0,
  visual_asset        text  not null default '',
  sound_effect        text  not null default ''
);

-- ── boxes (catálogo global, solo lectura para jugadores) ────
create table if not exists boxes (
  id           text  primary key,
  name         text  not null,
  description  text  not null default '',
  price        bigint not null default 0,
  unlock_level int   not null default 1,
  width        float not null default 200,
  height       float not null default 120,
  speed        float not null default 250,
  acceleration float not null default 0,
  magnet_power float not null default 0,
  multiplier   float not null default 1.0,
  visual_asset text  not null default ''
);

-- ── player_inventory ────────────────────────────────────────
create table if not exists player_inventory (
  id           uuid   primary key default gen_random_uuid(),
  user_id      uuid   not null references profiles(id) on delete cascade,
  item_type    text   not null,    -- 'weapon' | 'box'
  item_id      text   not null,
  purchased_at timestamptz not null default now(),
  unique(user_id, item_type, item_id)
);

-- ── player_equipment ────────────────────────────────────────
create table if not exists player_equipment (
  user_id            uuid primary key references profiles(id) on delete cascade,
  equipped_weapon_id text references weapons(id),
  equipped_box_id    text references boxes(id),
  updated_at         timestamptz not null default now()
);

-- ── runs (historial de partidas) ────────────────────────────
create table if not exists runs (
  id                 uuid    primary key default gen_random_uuid(),
  user_id            uuid    not null references profiles(id) on delete cascade,
  score_gained       bigint  not null default 0,
  coins_collected    int     not null default 0,
  coins_lost         int     not null default 0,
  hits               int     not null default 0,
  critical_hits      int     not null default 0,
  max_combo          int     not null default 0,
  duration_seconds   int     not null default 0,
  equipped_weapon_id text,
  equipped_box_id    text,
  suspicious         boolean not null default false,
  created_at         timestamptz not null default now()
);

-- ── mission_progress ────────────────────────────────────────
create table if not exists mission_progress (
  id          uuid  primary key default gen_random_uuid(),
  user_id     uuid  not null references profiles(id) on delete cascade,
  mission_id  text  not null,
  progress    int   not null default 0,
  completed   boolean not null default false,
  claimed     boolean not null default false,
  date_key    date,
  updated_at  timestamptz not null default now(),
  unique(user_id, mission_id, date_key)
);

-- ── leaderboard_weekly ──────────────────────────────────────
create table if not exists leaderboard_weekly (
  user_id      uuid   not null references profiles(id) on delete cascade,
  weekly_score bigint not null default 0,
  week_start   date   not null,
  primary key(user_id, week_start)
);
