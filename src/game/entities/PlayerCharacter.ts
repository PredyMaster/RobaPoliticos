import * as Phaser from "phaser"
import { SCENE_W, SCENE_H, showColliders } from "../scenes/GameScene"
import type { SwipeHitEvent } from "../systems/SwipeSystem"

const PLAYER_W = 464
const PLAYER_H = 515
const VISUAL_SCALE = 0.9
const HITBOX_SCALE = 0.6
const HITBOX_W = PLAYER_W * HITBOX_SCALE
const HITBOX_H = PLAYER_H * HITBOX_SCALE

const SLAP_DURATION_MS = 250
const HARD_SLAP_THRESHOLD = 0.65

export class PlayerCharacter extends Phaser.GameObjects.Sprite {
  readonly hitZone: Phaser.Geom.Rectangle

  private debugGfx?: Phaser.GameObjects.Graphics
  private recovering = false
  private slapTimer?: Phaser.Time.TimerEvent

  constructor(scene: Phaser.Scene) {
    const x = SCENE_W / 2
    const y = SCENE_H / 2 - 100
    super(scene, x, y, "player")
    scene.add.existing(this)

    this.setScale(VISUAL_SCALE)

    this.hitZone = new Phaser.Geom.Rectangle(
      x - HITBOX_W / 2,
      y - HITBOX_H / 2,
      HITBOX_W,
      HITBOX_H,
    )

    if (showColliders) {
      this.debugGfx = scene.add.graphics()
      this.debugGfx.setDepth(this.depth + 1)
      this.redrawDebug()
    }

    scene.events.on("swipe:hit", this.onSwipeHit, this)
  }

  private onSwipeHit(e: SwipeHitEvent): void {
    if (!e.didHit) return

    const textureKey =
      e.strength >= HARD_SLAP_THRESHOLD
        ? "player_hard_slap"
        : "player_soft_slap"

    this.setTexture(textureKey)
    this.setFlipX(e.direction.x < 0)

    this.slapTimer?.remove()
    this.slapTimer = this.scene.time.delayedCall(SLAP_DURATION_MS, () => {
      this.setTexture("player")
      this.setFlipX(false)
      this.slapTimer = undefined
    })

    this.receiveHit(e.direction, e.isCritical)
  }

  receiveHit(direction: { x: number; y: number }, isCritical: boolean): void {
    if (this.recovering) return
    this.recovering = true

    const knockbackX = -direction.x * (isCritical ? 20 : 8)
    const targetScaleX = VISUAL_SCALE
    const targetScaleY = VISUAL_SCALE

    this.scene.tweens.add({
      targets: this,
      scaleX: targetScaleX,
      scaleY: targetScaleY,
      x: SCENE_W / 2 + knockbackX,
      duration: 70,
      ease: "Power2",
      yoyo: true,
      onUpdate: () => this.syncHitZone(),
      onComplete: () => {
        this.x = SCENE_W / 2
        this.recovering = false
        this.syncHitZone()
      },
    })

    this.scene.events.emit("player:hit", {
      direction,
      isCritical,
      x: this.x,
      y: this.y,
    })
  }

  private syncHitZone(): void {
    this.hitZone.x = this.x - HITBOX_W / 2
    this.hitZone.y = this.y - HITBOX_H / 2
    this.redrawDebug()
  }

  private redrawDebug(): void {
    if (!this.debugGfx) return
    this.debugGfx.clear()
    this.debugGfx.fillStyle(0xff3333, 0.3)
    this.debugGfx.fillRect(
      this.hitZone.x,
      this.hitZone.y,
      this.hitZone.width,
      this.hitZone.height,
    )
    this.debugGfx.lineStyle(3, 0xff3333, 0.9)
    this.debugGfx.strokeRect(
      this.hitZone.x,
      this.hitZone.y,
      this.hitZone.width,
      this.hitZone.height,
    )
  }

  preDestroy(): void {
    this.scene.events.off("swipe:hit", this.onSwipeHit, this)
    this.slapTimer?.remove()
    this.debugGfx?.destroy()
  }
}
