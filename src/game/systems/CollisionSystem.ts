import * as Phaser from 'phaser'
import type { Coin } from '../entities/Coin'
import type { CatchBox } from '../entities/CatchBox'
import type { ObjectPool } from './ObjectPool'
import { SCENE_W, SCENE_H } from '../scenes/GameScene'

export class CollisionSystem {
  private readonly scene: Phaser.Scene
  private readonly pool: ObjectPool<Coin>
  private readonly box: CatchBox
  private collected = 0
  private lost      = 0

  constructor(scene: Phaser.Scene, pool: ObjectPool<Coin>, box: CatchBox) {
    this.scene = scene
    this.pool  = pool
    this.box   = box
  }

  update(): void {
    const now    = Date.now()
    const active = this.pool.getActive()   // snapshot — safe to release during iteration

    for (const coin of active) {
      if (!coin.active) continue

      const { spawnTime, maxLifeTime } = coin.coinState

      if (now - spawnTime > maxLifeTime) {
        this.lose(coin)
        continue
      }

      if (coin.y > SCENE_H + 80 || coin.x < -120 || coin.x > SCENE_W + 120) {
        this.lose(coin)
        continue
      }

      if (this.box.containsCoin(coin)) {
        this.catch(coin)
      }
    }
  }

  getStats(): { collected: number; lost: number } {
    return { collected: this.collected, lost: this.lost }
  }

  resetStats(): void {
    this.collected = 0
    this.lost      = 0
  }

  private catch(coin: Coin): void {
    const { x, y } = coin
    const baseValue = this.box.catchCoin(coin)  // also calls coin.despawn()
    this.collected++
    this.pool.release(coin)
    this.scene.events.emit('coin:caught', { x, y, baseValue, coinType: coin.coinState.type })
  }

  private lose(coin: Coin): void {
    const { x, y } = coin
    coin.despawn()
    this.lost++
    this.pool.release(coin)
    this.scene.events.emit('coin:lost', { x, y })
  }
}
