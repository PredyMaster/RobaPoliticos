import * as Phaser from "phaser"
import type { BoxItem } from "../types/game"
import { SCENE_W, GROUND_Y, showColliders } from "../scenes/GameScene"
import type { Coin } from "./Coin"

const SAFE_MARGIN = 30
const MAGNET_BASE_SPEED = 520
const CATCH_AREA_HEIGHT = 32
const CATCH_AREA_OFFSET_Y = 90

export class CatchBox extends Phaser.GameObjects.Image {
  readonly catchArea: Phaser.Geom.Rectangle

  private cfg: BoxItem
  private dir = 1 // +1 = right, -1 = left
  private vx = 0
  private debugGfx?: Phaser.GameObjects.Graphics

  constructor(scene: Phaser.Scene, config: BoxItem) {
    const x = SCENE_W / 2
    const y = GROUND_Y - config.height / 2 - 75
    super(scene, x, y, config.visualAsset || "catch_box")
    this.cfg = config
    scene.add.existing(this)
    this.syncVisualSize()

    this.catchArea = new Phaser.Geom.Rectangle(
      x - config.collider / 2,
      y - CATCH_AREA_HEIGHT,
      config.collider,
      CATCH_AREA_HEIGHT,
    )

    if (showColliders) {
      this.debugGfx = scene.add.graphics()
      this.debugGfx.setDepth(this.depth + 1)
      this.redrawDebug()
    }
  }

  setConfig(config: BoxItem): void {
    this.cfg = config
    this.setTexture(config.visualAsset || "catch_box")
    this.syncVisualSize()
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

    const viewport = this.scene.scale.getViewPort(this.scene.cameras.main)
    const minX = viewport.x + this.cfg.width / 2 + SAFE_MARGIN
    const maxX = viewport.right - this.cfg.width / 2 - SAFE_MARGIN
    if (this.x <= minX) {
      this.x = minX
      this.dir = 1
      this.vx = 0
    }
    if (this.x >= maxX) {
      this.x = maxX
      this.dir = -1
      this.vx = 0
    }

    this.syncCatchArea()
  }

  applyMagnet(coins: readonly Coin[]): void {
    if (this.cfg.magnetPower <= 0) {
      for (const coin of coins) {
        coin.releaseMagnetPull()
      }
      return
    }

    const targetX = this.catchArea.centerX
    const targetY = this.catchArea.centerY
    const pullSpeed = MAGNET_BASE_SPEED + this.cfg.speed * 0.45

    for (const coin of coins) {
      if (!coin.active) continue
      if (!coin.isMagnetized() && !this.isInsideMagnetZone(coin)) continue
      coin.startMagnetPull(targetX, targetY, pullSpeed)
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
      this.x - this.cfg.collider / 2,
      this.y - CATCH_AREA_HEIGHT / 2 - CATCH_AREA_OFFSET_Y,
      this.cfg.collider,
      CATCH_AREA_HEIGHT,
    )

    this.redrawDebug()
  }

  private syncVisualSize(): void {
    const width = Math.max(this.cfg.width * 1.65, this.cfg.width + 220)
    const frameWidth = this.frame.width || 1
    const frameHeight = this.frame.height || 1
    const scale = width / frameWidth

    this.setDisplaySize(width, frameHeight * scale)
  }

  private isInsideMagnetZone(coin: Coin): boolean {
    const padding = this.cfg.magnetPower
    return (
      coin.x >= this.catchArea.left - padding &&
      coin.x <= this.catchArea.right + padding &&
      coin.y >= this.catchArea.top - padding &&
      coin.y <= this.catchArea.bottom + padding
    )
  }

  private redrawDebug(): void {
    if (!this.debugGfx) return
    this.debugGfx.clear()
    this.debugGfx.fillStyle(0x0066ff, 0.3)
    this.debugGfx.fillRect(
      this.catchArea.x,
      this.catchArea.y,
      this.catchArea.width,
      this.catchArea.height,
    )
    this.debugGfx.lineStyle(3, 0x0066ff, 0.9)
    this.debugGfx.strokeRect(
      this.catchArea.x,
      this.catchArea.y,
      this.catchArea.width,
      this.catchArea.height,
    )
  }

  preDestroy(): void {
    this.debugGfx?.destroy()
  }
}
