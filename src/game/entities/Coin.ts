import * as Phaser from 'phaser'
import type { CoinTypeId, CoinState } from '../types/game'
import { COIN_LIFETIME_MS } from '../data/coins'

const TEXTURE_MAP: Record<CoinTypeId, string> = {
  normal_coin:     'coin_normal',
  silver_coin:     'coin_silver',
  gold_coin:       'coin_gold',
  money_bill:      'money_bill',
  gem:             'gem',
  multiplier_coin: 'multiplier_coin',
  magnet_coin:     'magnet_coin',
  bomb_coin:       'bomb_coin',
}

const DEBUG_COLLIDERS = true

export class Coin extends Phaser.Physics.Arcade.Sprite {
  coinState!: CoinState

  private debugGfx?: Phaser.GameObjects.Graphics

  constructor(scene: Phaser.Scene) {
    super(scene, 0, 0, 'coin_normal')
    scene.add.existing(this)
    scene.physics.add.existing(this)
    this.setActive(false).setVisible(false)

    const body = this.body as Phaser.Physics.Arcade.Body
    body.setEnable(false)
    body.setBounce(0.35)
    body.setCollideWorldBounds(false)
    body.setAllowGravity(true)

    if (DEBUG_COLLIDERS) {
      this.debugGfx = scene.add.graphics()
      this.debugGfx.setDepth(this.depth + 1)
      scene.events.on(Phaser.Scenes.Events.POST_UPDATE, this.redrawDebug, this)
    }
  }

  reset(x: number, y: number, vx: number, vy: number, type: CoinTypeId, value: number): void {
    this.setTexture(TEXTURE_MAP[type])
    this.setActive(true).setVisible(true)

    const body = this.body as Phaser.Physics.Arcade.Body
    body.reset(x, y)              // reposiciona y para velocidad
    body.setEnable(true)          // Phaser 4: reset() no re-habilita el body, hay que hacerlo explícito
    body.setAllowGravity(true)
    body.setVelocity(vx, vy)

    this.coinState = {
      type,
      value,
      active: true,
      spawnTime: Date.now(),
      maxLifeTime: COIN_LIFETIME_MS,
    }
  }

  despawn(): void {
    this.setActive(false).setVisible(false)
    const body = this.body as Phaser.Physics.Arcade.Body
    body.setVelocity(0, 0)
    body.setEnable(false)
    if (this.coinState) this.coinState.active = false
    this.debugGfx?.clear()
  }

  private redrawDebug(): void {
    if (!this.debugGfx) return
    this.debugGfx.clear()
    if (!this.active || !this.visible) return
    const body = this.body as Phaser.Physics.Arcade.Body | null
    if (!body) return
    // Amarillo con transparencia — futuro collider de moneda vs caja
    this.debugGfx.fillStyle(0xffff00, 0.3)
    this.debugGfx.fillRect(body.x, body.y, body.width, body.height)
    this.debugGfx.lineStyle(2, 0xffff00, 0.9)
    this.debugGfx.strokeRect(body.x, body.y, body.width, body.height)
  }

  preDestroy(): void {
    this.scene?.events.off(Phaser.Scenes.Events.POST_UPDATE, this.redrawDebug, this)
    this.debugGfx?.destroy()
  }
}
