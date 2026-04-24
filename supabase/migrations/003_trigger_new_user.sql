-- ============================================================
-- 003_trigger_new_user.sql
-- Trigger: al crear usuario → perfil + wallet + items iniciales
-- ============================================================

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_username text;
begin
  -- usar metadato 'username' si viene del registro, si no, parte del email
  v_username := coalesce(
    new.raw_user_meta_data->>'username',
    split_part(new.email, '@', 1)
  );

  -- perfil
  insert into public.profiles (id, username, avatar_url, level)
  values (new.id, v_username, null, 1);

  -- wallet vacía
  insert into public.wallets (user_id, total_score, current_coins, premium_gems)
  values (new.id, 0, 100, 0);   -- 100 monedas de bienvenida

  -- inventario inicial: arma básica y caja básica
  insert into public.player_inventory (user_id, item_type, item_id)
  values
    (new.id, 'weapon', 'hand_basic'),
    (new.id, 'box',    'small_box');

  -- equipamiento inicial
  insert into public.player_equipment (user_id, equipped_weapon_id, equipped_box_id)
  values (new.id, 'hand_basic', 'small_box');

  return new;
end;
$$;

-- disparar en cada INSERT en auth.users
create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
