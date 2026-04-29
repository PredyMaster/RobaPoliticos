import * as Phaser from "phaser"
import { SCENE_W, SCENE_H } from "../scenes/GameScene"

const PLAYER_W = 464
const PLAYER_H = 515

const DEBUG_COLLIDERS = true

export class PlayerCharacter extends Phaser.GameObjects.Sprite {
  readonly hitZone: Phaser.Geom.Rectangle

  private debugGfx?: Phaser.GameObjects.Graphics
  private recovering = false

  constructor(scene: Phaser.Scene) {
    const x = SCENE_W / 2
    const y = SCENE_H / 2 - 66
    super(scene, x, y, "player")
    scene.add.existing(this)

    this.hitZone = new Phaser.Geom.Rectangle(
      x - PLAYER_W / 2,
      y - PLAYER_H / 2,
      PLAYER_W,
      PLAYER_H,
    )

    if (DEBUG_COLLIDERS) {
      this.debugGfx = scene.add.graphics()
      this.debugGfx.setDepth(this.depth + 1)
      this.redrawDebug()
    }
  }

  receiveHit(direction: { x: number; y: number }, isCritical: boolean): void {
    if (this.recovering) return
    this.recovering = true

    const knockbackX = -direction.x * (isCritical ? 30 : 16)
    const targetScaleX = isCritical ? 1.45 : 1.2
    const targetScaleY = isCritical ? 0.65 : 0.85

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

    this.scene.events.emit("player:hit", { direction, isCritical })
  }

  private syncHitZone(): void {
    this.hitZone.x = this.x - PLAYER_W / 2
    this.hitZone.y = this.y - PLAYER_H / 2
    this.redrawDebug()
  }

  private redrawDebug(): void {
    if (!this.debugGfx) return
    this.debugGfx.clear()
    this.debugGfx.fillStyle(0x0066ff, 0.3)
    this.debugGfx.fillRect(
      this.hitZone.x,
      this.hitZone.y,
      this.hitZone.width,
      this.hitZone.height,
    )
    this.debugGfx.lineStyle(3, 0x0066ff, 0.9)
    this.debugGfx.strokeRect(
      this.hitZone.x,
      this.hitZone.y,
      this.hitZone.width,
      this.hitZone.height,
    )
  }

  preDestroy(): void {
    this.debugGfx?.destroy()
  }
}
