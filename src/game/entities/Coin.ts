import * as Phaser from "phaser"
import type { CoinTypeId, CoinState } from "../types/game"
import { COIN_LIFETIME_MS } from "../data/coins"
import { SHOW_COLLIDERS } from "../scenes/GameScene"

const TEXTURE_MAP: Record<CoinTypeId, string> = {
  coin_silver: 'coin_silver',
  coin_gold:   'coin_gold',
  bill_blue:   'bill_blue',
  bill_green:  'bill_green',
  bill_pink:   'bill_pink',
}

export class Coin extends Phaser.Physics.Arcade.Sprite {
  coinState!: CoinState

  private debugGfx?: Phaser.GameObjects.Graphics

  constructor(scene: Phaser.Scene) {
    super(scene, 0, 0, "coin_silver")
    scene.add.existing(this)
    scene.physics.add.existing(this)
    this.setActive(false).setVisible(false)

    const body = this.body as Phaser.Physics.Arcade.Body
    body.setEnable(false)
    body.setBounce(0.35)
    body.setCollideWorldBounds(false)
    body.setAllowGravity(true)

    if (SHOW_COLLIDERS) {
      this.debugGfx = scene.add.graphics()
      this.debugGfx.setDepth(this.depth + 1)
      scene.events.on(Phaser.Scenes.Events.POST_UPDATE, this.redrawDebug, this)
    }
  }

  reset(
    x: number,
    y: number,
    vx: number,
    vy: number,
    type: CoinTypeId,
    value: number,
    gravityYOffset = 0,
    scale = 1,
  ): void {
    this.setTexture(TEXTURE_MAP[type])
    this.setScale(scale) // antes de body.reset() para que updateBounds() use la escala correcta
    this.setActive(true).setVisible(true)

    const body = this.body as Phaser.Physics.Arcade.Body
    body.reset(x, y) // llama updateBounds() → body.width = frameW * scale ✓
    body.setEnable(true) // Phaser 4: reset() no re-habilita el body, hay que hacerlo explícito
    body.setAllowGravity(true)
    body.setGravityY(gravityYOffset) // local: suma a la gravedad mundial (1000). Negativo = menos gravedad neta
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
    this.setScale(1) // reset para reutilización del pool
    const body = this.body as Phaser.Physics.Arcade.Body
    body.setVelocity(0, 0)
    body.setGravityY(0) // reset para reutilización del pool
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
    this.scene?.events.off(
      Phaser.Scenes.Events.POST_UPDATE,
      this.redrawDebug,
      this,
    )
    this.debugGfx?.destroy()
  }
}
