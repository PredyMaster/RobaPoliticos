-- ============================================================
-- 006_rpc_submit_run.sql
-- RPC: guardar resultado de una partida + anti-cheat básico
-- ============================================================

create or replace function public.submit_run(
  p_score_gained       bigint,
  p_coins_collected    int,
  p_coins_lost         int,
  p_hits               int,
  p_critical_hits      int,
  p_max_combo          int,
  p_duration_seconds   int,
  p_equipped_weapon_id text,
  p_equipped_box_id    text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id          uuid := auth.uid();
  v_weapon_owned     boolean;
  v_box_owned        boolean;
  v_max_coins_per_hit int;
  v_max_allowed_coins bigint;
  v_max_coins_rate    int  := 60;   -- monedas máximas por segundo (límite anti-cheat)
  v_suspicious        boolean := false;
  v_new_total_score   bigint;
  v_new_coins         bigint;
  v_week_start        date;
  v_player_level      int;
begin
  if v_user_id is null then
    return jsonb_build_object('ok', false, 'error', 'not_authenticated');
  end if;

  -- validar valores no negativos
  if p_score_gained < 0 or p_coins_collected < 0 or p_coins_lost < 0
     or p_hits < 0 or p_duration_seconds <= 0 then
    return jsonb_build_object('ok', false, 'error', 'invalid_values');
  end if;

  -- validar que el arma equipada pertenece al jugador
  select exists(
    select 1 from public.player_inventory
    where user_id = v_user_id
      and item_type = 'weapon'
      and item_id = p_equipped_weapon_id
  ) into v_weapon_owned;

  if not v_weapon_owned then
    return jsonb_build_object('ok', false, 'error', 'weapon_not_owned');
  end if;

  -- validar que la caja equipada pertenece al jugador
  select exists(
    select 1 from public.player_inventory
    where user_id = v_user_id
      and item_type = 'box'
      and item_id = p_equipped_box_id
  ) into v_box_owned;

  if not v_box_owned then
    return jsonb_build_object('ok', false, 'error', 'box_not_owned');
  end if;

  -- anti-cheat: coins no pueden superar tasa máxima por tiempo
  v_max_allowed_coins := v_max_coins_rate * p_duration_seconds;
  if p_coins_collected > v_max_allowed_coins then
    v_suspicious := true;
  end if;

  -- anti-cheat: hits mínimos requeridos según duración y cooldown mínimo (0.3s)
  if p_hits > 0 and p_duration_seconds < (p_hits * 0.3)::int then
    v_suspicious := true;
  end if;

  -- anti-cheat: critical_hits no puede superar hits totales
  if p_critical_hits > p_hits then
    v_suspicious := true;
  end if;

  -- insertar run (con flag de sospecha si procede)
  insert into public.runs (
    user_id, score_gained, coins_collected, coins_lost,
    hits, critical_hits, max_combo, duration_seconds,
    equipped_weapon_id, equipped_box_id, suspicious
  ) values (
    v_user_id, p_score_gained, p_coins_collected, p_coins_lost,
    p_hits, p_critical_hits, p_max_combo, p_duration_seconds,
    p_equipped_weapon_id, p_equipped_box_id, v_suspicious
  );

  -- si es sospechosa, no actualizamos puntuaciones
  if v_suspicious then
    return jsonb_build_object('ok', false, 'error', 'suspicious_run', 'run_saved', true);
  end if;

  -- actualizar wallet y obtener nuevo total
  update public.wallets
  set current_coins = current_coins + p_coins_collected,
      total_score   = total_score   + p_score_gained,
      updated_at    = now()
  where user_id = v_user_id
  returning total_score, current_coins into v_new_total_score, v_new_coins;

  -- recalcular nivel: floor(sqrt(total_score / 100)) + 1
  v_player_level := floor(sqrt(v_new_total_score::float / 100))::int + 1;

  update public.profiles
  set level      = v_player_level,
      updated_at = now()
  where id = v_user_id;

  -- actualizar ranking semanal
  v_week_start := date_trunc('week', current_date)::date;

  insert into public.leaderboard_weekly (user_id, weekly_score, week_start)
  values (v_user_id, p_score_gained, v_week_start)
  on conflict (user_id, week_start)
  do update set weekly_score = leaderboard_weekly.weekly_score + excluded.weekly_score;

  -- actualizar progreso de misiones activas
  -- (misiones diarias vinculadas a la fecha actual)
  update public.mission_progress
  set progress   = progress + p_hits,
      updated_at = now()
  where user_id  = v_user_id
    and mission_id = 'daily_hits'
    and date_key   = current_date
    and not completed;

  update public.mission_progress
  set progress   = progress + p_coins_collected,
      updated_at = now()
  where user_id  = v_user_id
    and mission_id = 'daily_coins'
    and date_key   = current_date
    and not completed;

  -- marcar misiones completadas si alcanzan el objetivo
  update public.mission_progress mp
  set completed  = true,
      updated_at = now()
  from (
    select mp2.id, mp2.mission_id
    from public.mission_progress mp2
    join public.missions_catalog mc on mc.id = mp2.mission_id
    where mp2.user_id = v_user_id
      and not mp2.completed
      and mp2.progress >= mc.goal
  ) sub
  where mp.id = sub.id;

  return jsonb_build_object(
    'ok',             true,
    'new_total_score', v_new_total_score,
    'new_coins',       v_new_coins,
    'new_level',       v_player_level
  );
end;
$$;
