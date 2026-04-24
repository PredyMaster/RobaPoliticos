import type { MissionCatalogEntry } from '../types/economy'

// Espejo local del catálogo SQL (010_seed_missions.sql)
// Se usa para mostrar info en UI sin una query extra

export const MISSIONS_CATALOG: MissionCatalogEntry[] = [
  // ── Diarias ──────────────────────────────────────────────
  { id: 'daily_coins',      name: 'Recolector',        description: 'Recoge 500 monedas en partidas de hoy.',         missionType: 'daily',       goal: 500,   rewardCoins: 150,  rewardGems: 0  },
  { id: 'daily_hits',       name: 'Golpeador',          description: 'Da 50 golpes válidos en partidas de hoy.',        missionType: 'daily',       goal: 50,    rewardCoins: 100,  rewardGems: 0  },
  { id: 'daily_combos',     name: 'Combero',            description: 'Consigue un combo x10 en cualquier partida.',    missionType: 'daily',       goal: 10,    rewardCoins: 80,   rewardGems: 0  },
  { id: 'daily_games',      name: 'Jugador constante',  description: 'Juega 3 partidas hoy.',                          missionType: 'daily',       goal: 3,     rewardCoins: 60,   rewardGems: 0  },
  { id: 'daily_crits',      name: 'Golpe crítico',      description: 'Consigue 5 golpes críticos hoy.',                missionType: 'daily',       goal: 5,     rewardCoins: 120,  rewardGems: 0  },
  { id: 'daily_gold_coins', name: 'Coleccionista',      description: 'Recoge 20 monedas doradas en partidas de hoy.',  missionType: 'daily',       goal: 20,    rewardCoins: 200,  rewardGems: 0  },

  // ── Semanales ────────────────────────────────────────────
  { id: 'weekly_coins',     name: 'Acumulador',         description: 'Recoge 5000 monedas esta semana.',               missionType: 'weekly',      goal: 5000,  rewardCoins: 800,  rewardGems: 0  },
  { id: 'weekly_hits',      name: 'Imparable',          description: 'Da 500 golpes válidos esta semana.',             missionType: 'weekly',      goal: 500,   rewardCoins: 600,  rewardGems: 0  },
  { id: 'weekly_games',     name: 'Dedicado',           description: 'Juega 20 partidas esta semana.',                 missionType: 'weekly',      goal: 20,    rewardCoins: 500,  rewardGems: 0  },
  { id: 'weekly_combo_20',  name: 'Maestro del combo',  description: 'Consigue un combo x20 esta semana.',             missionType: 'weekly',      goal: 20,    rewardCoins: 1000, rewardGems: 1  },
  { id: 'weekly_purchase',  name: 'Comprador',          description: 'Compra al menos 1 mejora esta semana.',          missionType: 'weekly',      goal: 1,     rewardCoins: 300,  rewardGems: 0  },

  // ── Logros permanentes ───────────────────────────────────
  { id: 'ach_100_games',    name: '¡Adicto!',           description: 'Juega 100 partidas.',                            missionType: 'achievement', goal: 100,   rewardCoins: 2000, rewardGems: 5  },
  { id: 'ach_50k_coins',    name: 'Rico',               description: 'Recoge 50.000 monedas en total.',                missionType: 'achievement', goal: 50000, rewardCoins: 3000, rewardGems: 5  },
  { id: 'ach_combo_50',     name: 'Leyenda del combo',  description: 'Consigue un combo x50 en cualquier partida.',   missionType: 'achievement', goal: 50,    rewardCoins: 5000, rewardGems: 10 },
  { id: 'ach_all_weapons',  name: 'Arsenal completo',   description: 'Compra todas las armas.',                        missionType: 'achievement', goal: 8,     rewardCoins: 8000, rewardGems: 15 },
  { id: 'ach_all_boxes',    name: 'Coleccionista',      description: 'Compra todas las cajas.',                        missionType: 'achievement', goal: 6,     rewardCoins: 5000, rewardGems: 10 },
]

export const MISSIONS_MAP = new Map(MISSIONS_CATALOG.map((m) => [m.id, m]))
