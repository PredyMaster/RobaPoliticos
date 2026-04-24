-- ============================================================
-- 008_seed_weapons.sql
-- Datos iniciales de armas
-- Orden: id, name, description, price, unlock_level,
--        coins_per_hit, force, cooldown, critical_chance,
--        critical_multiplier, spread, rarity_bonus,
--        visual_asset, sound_effect
-- ============================================================

insert into public.weapons values
(
  'hand_basic',
  'Mano básica',
  'La técnica clásica. Barata pero efectiva para empezar.',
  0, 1,
  3, 280, 0.4, 0.04, 1.8, 0.25, 0.0,
  'weapon_hand_basic', 'sfx_hit_hand'
),
(
  'flip_flop',
  'Chancla',
  'Rápida como un rayo y más dolorosa de lo que parece.',
  150, 1,
  5, 320, 0.35, 0.06, 2.0, 0.3, 0.0,
  'weapon_flip_flop', 'sfx_hit_flip_flop'
),
(
  'hammer',
  'Martillo',
  'Golpe contundente. Las monedas salen disparadas con fuerza.',
  500, 2,
  8, 480, 0.6, 0.08, 2.2, 0.2, 0.05,
  'weapon_hammer', 'sfx_hit_hammer'
),
(
  'baseball_bat',
  'Bate de béisbol',
  'Swing lateral amplio. Las monedas salen en abanico.',
  1200, 3,
  10, 420, 0.55, 0.1, 2.3, 0.6, 0.08,
  'weapon_baseball_bat', 'sfx_hit_bat'
),
(
  'boxing_glove',
  'Guante de boxeo',
  'Máximo knockback. Alta probabilidad de crítico.',
  2500, 4,
  12, 560, 0.65, 0.15, 2.5, 0.35, 0.1,
  'weapon_boxing_glove', 'sfx_hit_glove'
),
(
  'money_gun',
  'Pistola de billetes',
  'Dispara monedas en línea recta. Precisión máxima.',
  5000, 5,
  15, 700, 0.3, 0.12, 2.4, 0.1, 0.15,
  'weapon_money_gun', 'sfx_hit_gun'
),
(
  'golden_mallet',
  'Mazo dorado',
  'Golpe pesado con alta probabilidad de monedas raras.',
  12000, 7,
  18, 520, 0.8, 0.18, 2.8, 0.45, 0.35,
  'weapon_golden_mallet', 'sfx_hit_mallet'
),
(
  'money_bazooka',
  'Bazooka de dinero',
  'Explosión de monedas. Cooldown alto pero devastador.',
  30000, 10,
  30, 900, 1.4, 0.25, 3.5, 0.8, 0.4,
  'weapon_money_bazooka', 'sfx_hit_bazooka'
)
on conflict (id) do update
  set name                = excluded.name,
      description         = excluded.description,
      price               = excluded.price,
      unlock_level        = excluded.unlock_level,
      coins_per_hit       = excluded.coins_per_hit,
      force               = excluded.force,
      cooldown            = excluded.cooldown,
      critical_chance     = excluded.critical_chance,
      critical_multiplier = excluded.critical_multiplier,
      spread              = excluded.spread,
      rarity_bonus        = excluded.rarity_bonus,
      visual_asset        = excluded.visual_asset,
      sound_effect        = excluded.sound_effect;
