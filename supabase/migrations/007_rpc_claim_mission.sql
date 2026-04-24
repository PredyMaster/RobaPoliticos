-- ============================================================
-- 007_rpc_claim_mission.sql
-- RPC: reclamar recompensa de una misión completada
-- ============================================================

-- tabla catálogo de misiones (para consultar recompensas)
create table if not exists public.missions_catalog (
  id          text   primary key,
  name        text   not null,
  description text   not null default '',
  mission_type text  not null default 'daily',  -- 'daily' | 'weekly' | 'achievement'
  goal        int    not null default 1,
  reward_coins bigint not null default 0,
  reward_gems  bigint not null default 0
);

alter table missions_catalog enable row level security;

create policy "missions_catalog: lectura pública"
  on missions_catalog for select
  using (true);

-- ── RPC claim_mission_reward ─────────────────────────────────
create or replace function public.claim_mission_reward(
  p_mission_id text,
  p_date_key   date default current_date
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id       uuid := auth.uid();
  v_completed     boolean;
  v_claimed       boolean;
  v_reward_coins  bigint;
  v_reward_gems   bigint;
begin
  if v_user_id is null then
    return jsonb_build_object('ok', false, 'error', 'not_authenticated');
  end if;

  -- comprobar estado de la misión del jugador
  select mp.completed, mp.claimed
  into v_completed, v_claimed
  from public.mission_progress mp
  where mp.user_id   = v_user_id
    and mp.mission_id = p_mission_id
    and (mp.date_key = p_date_key or mp.date_key is null)
  limit 1;

  if not found then
    return jsonb_build_object('ok', false, 'error', 'mission_not_found');
  end if;

  if not v_completed then
    return jsonb_build_object('ok', false, 'error', 'not_completed');
  end if;

  if v_claimed then
    return jsonb_build_object('ok', false, 'error', 'already_claimed');
  end if;

  -- leer recompensa del catálogo
  select reward_coins, reward_gems
  into v_reward_coins, v_reward_gems
  from public.missions_catalog
  where id = p_mission_id;

  if not found then
    return jsonb_build_object('ok', false, 'error', 'catalog_entry_not_found');
  end if;

  -- entregar recompensa
  update public.wallets
  set current_coins = current_coins + v_reward_coins,
      premium_gems  = premium_gems  + v_reward_gems,
      updated_at    = now()
  where user_id = v_user_id;

  -- marcar como reclamada
  update public.mission_progress
  set claimed    = true,
      updated_at = now()
  where user_id   = v_user_id
    and mission_id = p_mission_id
    and (date_key = p_date_key or date_key is null);

  return jsonb_build_object(
    'ok',           true,
    'reward_coins', v_reward_coins,
    'reward_gems',  v_reward_gems
  );
end;
$$;
