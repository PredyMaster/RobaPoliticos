-- ============================================================
-- 004_rpc_purchase_item.sql
-- RPC: comprar un item (arma o caja)
-- ============================================================

create or replace function public.purchase_item(
  p_item_type text,   -- 'weapon' | 'box'
  p_item_id   text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id      uuid := auth.uid();
  v_item_price   bigint;
  v_item_level   int;
  v_player_coins bigint;
  v_player_level int;
  v_already_owned boolean;
begin
  -- validar sesión
  if v_user_id is null then
    return jsonb_build_object('ok', false, 'error', 'not_authenticated');
  end if;

  -- validar tipo de item
  if p_item_type not in ('weapon', 'box') then
    return jsonb_build_object('ok', false, 'error', 'invalid_item_type');
  end if;

  -- obtener precio y nivel requerido del catálogo
  if p_item_type = 'weapon' then
    select price, unlock_level into v_item_price, v_item_level
    from public.weapons where id = p_item_id;
  else
    select price, unlock_level into v_item_price, v_item_level
    from public.boxes where id = p_item_id;
  end if;

  if not found then
    return jsonb_build_object('ok', false, 'error', 'item_not_found');
  end if;

  -- verificar que no lo tiene ya
  select exists(
    select 1 from public.player_inventory
    where user_id = v_user_id
      and item_type = p_item_type
      and item_id = p_item_id
  ) into v_already_owned;

  if v_already_owned then
    return jsonb_build_object('ok', false, 'error', 'already_owned');
  end if;

  -- leer nivel y monedas del jugador
  select w.current_coins, pr.level
  into v_player_coins, v_player_level
  from public.wallets w
  join public.profiles pr on pr.id = w.user_id
  where w.user_id = v_user_id;

  -- validar nivel mínimo
  if v_player_level < v_item_level then
    return jsonb_build_object('ok', false, 'error', 'level_too_low', 'required_level', v_item_level);
  end if;

  -- validar monedas suficientes
  if v_player_coins < v_item_price then
    return jsonb_build_object('ok', false, 'error', 'insufficient_coins', 'needed', v_item_price, 'have', v_player_coins);
  end if;

  -- descontar monedas
  update public.wallets
  set current_coins = current_coins - v_item_price,
      updated_at    = now()
  where user_id = v_user_id;

  -- añadir al inventario
  insert into public.player_inventory (user_id, item_type, item_id)
  values (v_user_id, p_item_type, p_item_id);

  return jsonb_build_object('ok', true, 'item_type', p_item_type, 'item_id', p_item_id);
end;
$$;
