// Tipos del gameplay: armas, cajas, monedas, swipe, eventos

export type Weapon = {
  id: string
  name: string
  description: string
  price: number
  unlockLevel: number
  attack: number
  loot: number
  force: number
  cooldown: number          // segundos entre golpes
  criticalChance: number    // 0–1
  criticalMultiplier: number
  spread: number            // ángulo de dispersión en radianes
  rarityBonus: number       // bonus a prob. de monedas raras (0–1)
  visualAsset: string
  soundEffect: string
}

export type BoxItem = {
  id: string
  name: string
  description: string
  price: number
  unlockLevel: number
  width: number
  height: number
  speed: number
  acceleration: number
  magnetPower: number   // radio de atracción en px (0 = sin imán)
  multiplier: number    // multiplicador de valor de monedas recogidas
  visualAsset: string
}

export type HandItem = {
  id: string
  name: string
  description: string
  price: number
  unlockLevel: number
  attack: number
  loot: number
}

export type CombatLoadout = {
  weapon: Weapon
  hand: HandItem
  attack: number
  loot: number
  force: number
  cooldown: number
  criticalChance: number
  criticalMultiplier: number
  spread: number
  rarityBonus: number
  dropProgress: number
  minDrops: number
  maxDrops: number
  soundEffect: string
  cursorTextureKey: string
  cursorTexturePath: string
}

// ── Monedas ─────────────────────────────────────────────────

export type CoinTypeId =
  | 'coin_silver'
  | 'coin_gold'
  | 'bill_blue'
  | 'bill_green'
  | 'bill_pink'

export type CoinDefinition = {
  id: CoinTypeId
  value: number
  probability: number   // peso relativo (se normaliza en CoinSpawnSystem)
  unlockAt: number      // progreso mínimo del equipo para que pueda salir
  visualAsset: string
  rarityWeight: number  // 0 = prob. fija, >0 = amplificada por rarityBonus del golpe
}

export type CoinState = {
  type: CoinTypeId
  value: number
  active: boolean
  spawnTime: number     // ms timestamp de cuando fue spawneado
  maxLifeTime: number   // ms antes de desaparecer si no es recogida
}

// ── Swipe ────────────────────────────────────────────────────

export type SwipeData = {
  startX: number
  startY: number
  endX: number
  endY: number
  directionX: number   // normalizado –1..1
  directionY: number   // normalizado –1..1
  distance: number     // px
  duration: number     // ms
  speed: number        // px/ms
  strength: number     // 0–1, calculado de speed y distance
}

// ── Resultado de partida ─────────────────────────────────────

export type RunResult = {
  scoreGained: number
  coinsCollected: number
  coinsLost: number
  hits: number
  criticalHits: number
  maxCombo: number
  durationSeconds: number
  equippedWeaponId: string
  equippedHandId: string
  equippedBoxId: string
}

// ── Combo ────────────────────────────────────────────────────

export type ComboState = {
  count: number
  multiplier: number
  lastHitTime: number   // ms timestamp
  active: boolean
}

export type ComboEvent =
  | 'combo_x2'
  | 'combo_x5'
  | 'combo_x10'
  | 'combo_x20'
  | 'combo_x50'
  | 'combo_reset'

// ── Hit ──────────────────────────────────────────────────────

export type HitResult = {
  isCritical: boolean
  coinsSpawned: number
  comboCount: number
  scoreAdded: number
}

// ── Calidad gráfica ──────────────────────────────────────────

export type GraphicsQuality = 'low' | 'medium' | 'high'

// ── EventBus eventos tipados ─────────────────────────────────

export type GameEventMap = {
  PRELOAD_COMPLETE: undefined
  GAME_READY: undefined
  RUN_STARTED: undefined
  RUN_SCORE_UPDATED: { runScore: number; totalCoins: number }
  COINS_COLLECTED: { amount: number; coinType: CoinTypeId }
  COMBO_UPDATED: ComboState
  RUN_PAUSED: undefined
  RUN_RESUMED: undefined
  RUN_ENDED: RunResult
  EQUIPMENT_UPDATED: { weaponId: string; handId: string; boxId: string }
  OPEN_PAUSE_MENU: undefined
  OPEN_SHOP: undefined
  EXIT_TO_HOME: undefined
  TOGGLE_MUSIC: boolean
  TOGGLE_SFX: boolean
  CHANGE_BG: undefined
  BG_CHANGED: number
}

export type GameEventKey = keyof GameEventMap
