import * as Phaser from 'phaser'
import type { ObjectPool } from './ObjectPool'
import type { Coin } from '../entities/Coin'
import type { PlayerCharacter } from '../entities/PlayerCharacter'
import type { CombatLoadout } from '../types/game'
import { COIN_DEFINITIONS, COIN_MAP } from '../data/coins'
import { pickCoinType, randomInt, spreadAngle } from '../utils/random'
import type { SwipeHitEvent } from './SwipeSystem'

type ComboInfo = { count: number; multiplier: number }

export class CoinSpawnSystem {
  private readonly scene: Phaser.Scene
  private readonly pool: ObjectPool<Coin>
  private readonly player: PlayerCharacter
  private loadout: CombatLoadout
  private combo: ComboInfo = { count: 0, multiplier: 1 }

  constructor(
    scene: Phaser.Scene,
    pool: ObjectPool<Coin>,
    player: PlayerCharacter,
    loadout: CombatLoadout,
  ) {
    this.scene  = scene
    this.pool   = pool
    this.player = player
    this.loadout = loadout
    scene.events.on('swipe:hit',     this.onSwipeHit,    this)
    scene.events.on('combo:changed', this.onComboChanged, this)
  }

  setLoadout(loadout: CombatLoadout): void {
    this.loadout = loadout
  }

  private onComboChanged(combo: ComboInfo): void {
    this.combo = combo
  }

  private onSwipeHit(e: SwipeHitEvent): void {
    if (!e.didHit) return

    const w = this.loadout
    let count = randomInt(w.minDrops, w.maxDrops)
    if (e.isCritical) count += w.dropProgress >= 0.65 ? 2 : 1
    if (this.combo.count >= 10) count += 1
    if (this.combo.count >= 20) count += 1

    // Blend hit direction with downward based on strength:
    // weak hit (strength≈0) → coins fall below; strong hit (strength≈1) → fly in hit direction
    const t = Math.pow(e.strength, 0.7)
    const blendedX = e.direction.x * t
    const blendedY = e.direction.y * t + (1 - t)  // bias toward +y (down in screen space)
    const len = Math.sqrt(blendedX * blendedX + blendedY * blendedY)
    const finalDirX = len > 0 ? blendedX / len : 0
    const finalDirY = len > 0 ? blendedY / len : 1

    const baseAngle = Math.atan2(finalDirY, finalDirX)

    // Curva cuadrática: golpe suave → poca fuerza; golpe fuerte → hasta 2× weapon.force
    // La gravedad mundial (1000 px/s²) actúa siempre para que el arco sea pronunciado
    const sc    = Math.pow(e.strength, 1.5)
    const force = w.force * (0.12 + sc * 1.88)

    const comboFactor = Math.min(this.combo.count / 20, 1)
    const rarityBonus = Math.min(
      1,
      w.rarityBonus + e.strength * 0.18 + comboFactor * 0.22 + (e.isCritical ? 0.12 : 0),
    )

    for (let i = 0; i < count; i++) {
      const type  = pickCoinType(COIN_DEFINITIONS, w.dropProgress, rarityBonus)
      const def   = COIN_MAP.get(type)
      const value = def?.value ?? 1
      const angle = spreadAngle(baseAngle, w.spread)
      const vx    = Math.cos(angle) * force
      const vy    = Math.sin(angle) * force

      // Offset aleatorio en un radio de 50px para que no salgan todas del mismo punto
      const spawnAngle = Math.random() * Math.PI * 2
      const spawnDist  = Math.random() * 50
      const spawnX = this.player.x + Math.cos(spawnAngle) * spawnDist
      const spawnY = this.player.y + Math.sin(spawnAngle) * spawnDist

      // Billetes más grandes que monedas
      const isBill = type === 'bill_blue' || type === 'bill_green' || type === 'bill_pink'
      const scale  = isBill
        ? 1.2 + Math.random() * 0.4   // 1.20 – 1.60
        : 0.7 + Math.random() * 0.4   // 0.70 – 1.10

      // Coins are heavier: extra +400 px/s² on top of world gravity (1000).
      // Bills are lighter: -400 px/s², so they float longer before dropping.
      const gravityYOffset = isBill ? -400 : 400

      const coin = this.pool.acquire()
      coin.reset(spawnX, spawnY, vx, vy, type, value, gravityYOffset, scale)
    }
  }

  destroy(): void {
    this.scene.events.off('swipe:hit',     this.onSwipeHit,    this)
    this.scene.events.off('combo:changed', this.onComboChanged, this)
  }
}
