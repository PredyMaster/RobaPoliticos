import Phaser from 'phaser'
import type { BoxItem } from '../types/game'
import { SCENE_W, GROUND_Y } from '../scenes/GameScene'
import type { Coin } from './Coin'

const SAFE_MARGIN = 30

export class CatchBox extends Phaser.GameObjects.Image {
  readonly catchArea: Phaser.Geom.Rectangle

  private cfg: BoxItem
  private dir = 1    // +1 = right, -1 = left
  private vx = 0

  constructor(scene: Phaser.Scene, config: BoxItem) {
    const x = SCENE_W / 2
    const y = GROUND_Y - config.height / 2
    super(scene, x, y, 'catch_box')
    this.cfg = config
    scene.add.existing(this)
    this.setDisplaySize(config.width, config.height)

    this.catchArea = new Phaser.Geom.Rectangle(
      x - config.width / 2,
      y - config.height / 2,
      config.width,
      config.height,
    )
  }

  setConfig(config: BoxItem): void {
    this.cfg = config
    this.setDisplaySize(config.width, config.height)
    this.syncCatchArea()
  }

  updateMovement(deltaMs: number): void {
    const dt = deltaMs / 1000

    if (this.cfg.acceleration > 0) {
      // Gradually ramp to max speed
      const target = this.cfg.speed * this.dir
      this.vx += (target - this.vx) * Math.min(1, this.cfg.acceleration * dt)
    } else {
      this.vx = this.cfg.speed * this.dir
    }

    this.x += this.vx * dt

    const minX = this.cfg.width / 2 + SAFE_MARGIN
    const maxX = SCENE_W - this.cfg.width / 2 - SAFE_MARGIN
    if (this.x <= minX) { this.x = minX; this.dir = 1;  this.vx = 0 }
    if (this.x >= maxX) { this.x = maxX; this.dir = -1; this.vx = 0 }

    this.syncCatchArea()
  }

  applyMagnet(coins: readonly Coin[]): void {
    if (this.cfg.magnetPower <= 0) return
    const radiusSq = this.cfg.magnetPower * this.cfg.magnetPower
    for (const coin of coins) {
      if (!coin.active) continue
      const dx = this.x - coin.x
      const dy = this.y - coin.y
      if (dx * dx + dy * dy > radiusSq) continue
      const dist = Math.sqrt(dx * dx + dy * dy) || 1
      const body = coin.body as Phaser.Physics.Arcade.Body
      const pull = 120
      body.setVelocity(
        body.velocity.x + (dx / dist) * pull,
        body.velocity.y + (dy / dist) * pull,
      )
    }
  }

  catchCoin(coin: Coin): number {
    const value = coin.coinState.value * this.cfg.multiplier
    coin.despawn()
    return value
  }

  containsCoin(coin: Coin): boolean {
    return this.catchArea.contains(coin.x, coin.y)
  }

  private syncCatchArea(): void {
    this.catchArea.setTo(
      this.x - this.cfg.width / 2,
      this.y - this.cfg.height / 2,
      this.cfg.width,
      this.cfg.height,
    )
  }
}
