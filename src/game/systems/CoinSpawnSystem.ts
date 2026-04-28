import Phaser from 'phaser'
import type { ObjectPool } from './ObjectPool'
import type { Coin } from '../entities/Coin'
import type { PlayerCharacter } from '../entities/PlayerCharacter'
import type { Weapon } from '../types/game'
import { COIN_DEFINITIONS, COIN_MAP } from '../data/coins'
import { pickCoinType, spreadAngle } from '../utils/random'
import type { SwipeHitEvent } from './SwipeSystem'

type ComboInfo = { count: number; multiplier: number }

export class CoinSpawnSystem {
  private readonly scene: Phaser.Scene
  private readonly pool: ObjectPool<Coin>
  private readonly player: PlayerCharacter
  private weapon: Weapon
  private combo: ComboInfo = { count: 0, multiplier: 1 }

  constructor(
    scene: Phaser.Scene,
    pool: ObjectPool<Coin>,
    player: PlayerCharacter,
    weapon: Weapon,
  ) {
    this.scene  = scene
    this.pool   = pool
    this.player = player
    this.weapon = weapon
    scene.events.on('swipe:hit',     this.onSwipeHit,    this)
    scene.events.on('combo:changed', this.onComboChanged, this)
  }

  setWeapon(weapon: Weapon): void {
    this.weapon = weapon
  }

  private onComboChanged(combo: ComboInfo): void {
    this.combo = combo
  }

  private onSwipeHit(e: SwipeHitEvent): void {
    const w = this.weapon
    let count = w.coinsPerHit
    if (e.isCritical)           count = Math.ceil(count * w.criticalMultiplier * 0.5)
    if (this.combo.count >= 20) count = Math.ceil(count * 1.5)  // fever bonus

    const baseAngle = Math.atan2(e.direction.y, e.direction.x)
    const force     = w.force * (0.6 + e.strength * 0.4)

    for (let i = 0; i < count; i++) {
      const type  = pickCoinType(COIN_DEFINITIONS, w.rarityBonus)
      const def   = COIN_MAP.get(type)
      const value = def?.value ?? 1
      const angle = spreadAngle(baseAngle, w.spread)
      const vx    = Math.cos(angle) * force
      const vy    = Math.sin(angle) * force - 250  // upward bias

      const coin = this.pool.acquire()
      coin.reset(this.player.x, this.player.y - 40, vx, vy, type, value)
    }
  }

  destroy(): void {
    this.scene.events.off('swipe:hit',     this.onSwipeHit,    this)
    this.scene.events.off('combo:changed', this.onComboChanged, this)
  }
}
