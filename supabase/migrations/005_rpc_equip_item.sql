-- ============================================================
-- 005_rpc_equip_item.sql
-- RPC: equipar un item que ya está en el inventario
-- ============================================================

create or replace function public.equip_item(
  p_item_type text,   -- 'weapon' | 'box'
  p_item_id   text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_owned   boolean;
begin
  if v_user_id is null then
    return jsonb_build_object('ok', false, 'error', 'not_authenticated');
  end if;

  if p_item_type not in ('weapon', 'box') then
    return jsonb_build_object('ok', false, 'error', 'invalid_item_type');
  end if;

  -- verificar que el jugador tiene el item
  select exists(
    select 1 from public.player_inventory
    where user_id = v_user_id
      and item_type = p_item_type
      and item_id = p_item_id
  ) into v_owned;

  if not v_owned then
    return jsonb_build_object('ok', false, 'error', 'not_owned');
  end if;

  -- actualizar equipamiento
  if p_item_type = 'weapon' then
    update public.player_equipment
    set equipped_weapon_id = p_item_id,
        updated_at          = now()
    where user_id = v_user_id;
  else
    update public.player_equipment
    set equipped_box_id = p_item_id,
        updated_at      = now()
    where user_id = v_user_id;
  end if;

  return jsonb_build_object('ok', true, 'item_type', p_item_type, 'item_id', p_item_id);
end;
$$;
