-- ============================================================
-- 009_seed_boxes.sql
-- Datos iniciales de cajas
-- Orden: id, name, description, price, unlock_level,
--        width, height, speed, acceleration,
--        magnet_power, multiplier, visual_asset
-- ============================================================

insert into public.boxes values
(
  'small_box',
  'Caja pequeña',
  'La caja básica. Pequeña y difícil de acertar.',
  0, 1,
  160, 100, 220, 0, 0, 1.0,
  'box_small'
),
(
  'wide_box',
  'Caja ancha',
  'Más superficie para atrapar monedas. Mucho más fácil.',
  300, 1,
  280, 100, 220, 0, 0, 1.0,
  'box_wide'
),
(
  'fast_box',
  'Caja rápida',
  'Se mueve más deprisa. Mejor para monedas laterales.',
  800, 2,
  200, 100, 380, 40, 0, 1.0,
  'box_fast'
),
(
  'magnet_box',
  'Caja imán',
  'Atrae las monedas cercanas hacia ella.',
  2000, 4,
  220, 110, 260, 0, 180, 1.0,
  'box_magnet'
),
(
  'golden_box',
  'Caja dorada',
  'Multiplica el valor de cada moneda recogida.',
  6000, 6,
  220, 110, 260, 0, 0, 1.8,
  'box_golden'
),
(
  'premium_box',
  'Caja premium',
  'Grande, rápida y con un pequeño efecto de atracción.',
  20000, 9,
  340, 120, 340, 30, 80, 1.5,
  'box_premium'
)
on conflict (id) do update
  set name         = excluded.name,
      description  = excluded.description,
      price        = excluded.price,
      unlock_level = excluded.unlock_level,
      width        = excluded.width,
      height       = excluded.height,
      speed        = excluded.speed,
      acceleration = excluded.acceleration,
      magnet_power = excluded.magnet_power,
      multiplier   = excluded.multiplier,
      visual_asset = excluded.visual_asset;
