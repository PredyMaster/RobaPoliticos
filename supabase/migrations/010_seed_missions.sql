-- ============================================================
-- 010_seed_missions.sql
-- Catálogo de misiones (diarias, semanales y logros)
-- ============================================================

insert into public.missions_catalog
  (id, name, description, mission_type, goal, reward_coins, reward_gems)
values
-- ── Misiones diarias ────────────────────────────────────────
('daily_coins',      'Recolector',        'Recoge 500 monedas en partidas de hoy.',         'daily',       500,  150, 0),
('daily_hits',       'Golpeador',         'Da 50 golpes válidos en partidas de hoy.',        'daily',        50,  100, 0),
('daily_combos',     'Combero',           'Consigue un combo x10 en cualquier partida.',     'daily',        10,   80, 0),
('daily_games',      'Jugador constante', 'Juega 3 partidas hoy.',                           'daily',         3,   60, 0),
('daily_crits',      'Golpe crítico',     'Consigue 5 golpes críticos hoy.',                 'daily',         5,  120, 0),
('daily_gold_coins', 'Coleccionista',     'Recoge 20 monedas doradas en partidas de hoy.',   'daily',        20,  200, 0),

-- ── Misiones semanales ──────────────────────────────────────
('weekly_coins',     'Acumulador',        'Recoge 5000 monedas esta semana.',                'weekly',     5000,  800, 0),
('weekly_hits',      'Imparable',         'Da 500 golpes válidos esta semana.',              'weekly',      500,  600, 0),
('weekly_games',     'Dedicado',          'Juega 20 partidas esta semana.',                  'weekly',       20,  500, 0),
('weekly_combo_20',  'Maestro del combo', 'Consigue un combo x20 esta semana.',              'weekly',       20, 1000, 1),
('weekly_purchase',  'Comprador',         'Compra al menos 1 mejora esta semana.',           'weekly',        1,  300, 0),

-- ── Logros permanentes ──────────────────────────────────────
('ach_100_games',    '¡Adicto!',          'Juega 100 partidas.',                             'achievement', 100, 2000, 5),
('ach_50k_coins',    'Rico',              'Recoge 50.000 monedas en total.',                 'achievement', 50000, 3000, 5),
('ach_combo_50',     'Leyenda del combo', 'Consigue un combo x50 en cualquier partida.',     'achievement',    50, 5000, 10),
('ach_all_weapons',  'Arsenal completo',  'Compra todas las armas.',                         'achievement',     8, 8000, 15),
('ach_all_boxes',    'Coleccionista',     'Compra todas las cajas.',                         'achievement',     6, 5000, 10)
on conflict (id) do update
  set name         = excluded.name,
      description  = excluded.description,
      mission_type = excluded.mission_type,
      goal         = excluded.goal,
      reward_coins = excluded.reward_coins,
      reward_gems  = excluded.reward_gems;
