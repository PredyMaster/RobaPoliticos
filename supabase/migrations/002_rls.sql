-- ============================================================
-- 002_rls.sql
-- Row Level Security para todas las tablas de jugador
-- ============================================================

-- ── profiles ────────────────────────────────────────────────
alter table profiles enable row level security;

create policy "profiles: lectura propia"
  on profiles for select
  using (auth.uid() = id);

create policy "profiles: actualización propia"
  on profiles for update
  using (auth.uid() = id);

-- ── wallets ─────────────────────────────────────────────────
alter table wallets enable row level security;

create policy "wallets: lectura propia"
  on wallets for select
  using (auth.uid() = user_id);

-- wallets solo se modifica por RPCs (security definer), nunca directamente

-- ── weapons (catálogo global: lectura pública) ───────────────
alter table weapons enable row level security;

create policy "weapons: lectura pública"
  on weapons for select
  using (true);

-- ── boxes (catálogo global: lectura pública) ────────────────
alter table boxes enable row level security;

create policy "boxes: lectura pública"
  on boxes for select
  using (true);

-- ── player_inventory ────────────────────────────────────────
alter table player_inventory enable row level security;

create policy "inventory: lectura propia"
  on player_inventory for select
  using (auth.uid() = user_id);

-- inserts solo por RPC purchase_item (security definer)

-- ── player_equipment ────────────────────────────────────────
alter table player_equipment enable row level security;

create policy "equipment: lectura propia"
  on player_equipment for select
  using (auth.uid() = user_id);

-- updates solo por RPC equip_item (security definer)

-- ── runs ────────────────────────────────────────────────────
alter table runs enable row level security;

create policy "runs: lectura propia"
  on runs for select
  using (auth.uid() = user_id);

-- inserts solo por RPC submit_run (security definer)

-- ── mission_progress ────────────────────────────────────────
alter table mission_progress enable row level security;

create policy "missions: lectura propia"
  on mission_progress for select
  using (auth.uid() = user_id);

-- ── leaderboard_weekly (lectura pública, escritura por RPC) ──
alter table leaderboard_weekly enable row level security;

create policy "leaderboard: lectura pública"
  on leaderboard_weekly for select
  using (true);

-- inserts/updates solo por RPC submit_run (security definer)
