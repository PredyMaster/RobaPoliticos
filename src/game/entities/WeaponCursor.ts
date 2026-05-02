import * as Phaser from "phaser"
import { showColliders } from "../scenes/GameScene"

const WEAPON_W = 215
const WEAPON_H = 350

const ROTATION_LERP = 0.2 // resistencia rotacional por frame (0=rígido, 1=instantáneo)

export class WeaponCursor extends Phaser.GameObjects.Image {
  readonly hitZone: Phaser.Geom.Rectangle
  lastVelocity: { x: number; y: number } = { x: 0, y: 0 }

  private swinging = false
  private isDesktop: boolean
  // Visual-only scale multiplier; hitZone always stays at WEAPON_W×WEAPON_H
  private baseScale: number
  private debugGfx?: Phaser.GameObjects.Graphics
  private readonly lookAtTarget?: { x: number; y: number }

  constructor(
    scene: Phaser.Scene,
    textureKey = "weapon_cursor",
    lookAtTarget?: { x: number; y: number },
  ) {
    super(scene, 0, 0, textureKey)
    scene.add.existing(this)
    // Origen centrado para que rotación y collider queden estables sobre el puntero
    this.setOrigin(0.5, 0.5)
    this.setDepth(20)
    this.lookAtTarget = lookAtTarget

    this.hitZone = new Phaser.Geom.Rectangle(0, 0, WEAPON_W, WEAPON_H)

    if (showColliders) {
      this.debugGfx = scene.add.graphics()
      this.debugGfx.setDepth(this.depth + 1)
    }

    // En desktop el cursor sigue al ratón siempre; en móvil solo al tocar
    this.isDesktop = scene.sys.game.device.os.desktop

    // On Android APK the hand looks better at 2× size; collider stays unchanged
    this.baseScale = scene.sys.game.device.os.android ? 1.5 : 1
    this.setScale(this.baseScale)

    if (this.isDesktop) {
      // Ocultar cursor nativo del navegador sobre el canvas
      scene.input.setDefaultCursor("none")
      this.setVisible(true)
    } else {
      this.setVisible(false)
    }

    scene.input.on("pointermove", this.onMove, this)
    scene.input.on("pointerdown", this.onDown, this)
    scene.input.on("pointerup", this.onUp, this)
    scene.events.on("update", this.onUpdate, this)
  }

  setTextureKey(textureKey: string): void {
    this.setTexture(textureKey)
    this.syncHitZone()
  }

  private getTargetRotation(): number {
    const targetX = this.lookAtTarget?.x ?? this.scene.scale.width / 2
    const targetY = this.lookAtTarget?.y ?? this.scene.scale.height / 2
    const angleToTarget = Phaser.Math.Angle.Between(
      this.x,
      this.y,
      targetX,
      targetY,
    )

    // Las texturas reales reposan mirando hacia la izquierda. Cuando el cursor
    // queda a la izquierda del player, hacemos flip para que siga "apuntándole"
    // y luego ajustamos la rotación visual sin afectar la hitbox.
    const shouldFlip = targetX > this.x
    this.setFlipX(shouldFlip)

    return shouldFlip ? angleToTarget : angleToTarget - Math.PI
  }

  private onMove(pointer: Phaser.Input.Pointer): void {
    this.setPosition(pointer.x, pointer.y)
    this.lastVelocity = { x: pointer.velocity.x, y: pointer.velocity.y }
    this.syncHitZone()

    if (this.isDesktop) {
      this.setVisible(true)
    } else if (pointer.isDown) {
      const dx = pointer.x - pointer.downX
      const dy = pointer.y - pointer.downY
      if (dx !== 0 || dy !== 0) {
        // On Android/Capacitor, pointer.velocity is unreliable; use total displacement instead
        this.lastVelocity = { x: dx, y: dy }
      }
    }
  }

  private onUpdate(): void {
    const targetRotation = this.getTargetRotation()
    // Interpolación angular por el camino más corto hacia targetRotation
    let diff = targetRotation - this.rotation
    if (diff > Math.PI) diff -= Math.PI * 2
    if (diff < -Math.PI) diff += Math.PI * 2
    if (Math.abs(diff) > 0.001) {
      this.setRotation(this.rotation + diff * ROTATION_LERP)
    }
  }

  private onDown(pointer: Phaser.Input.Pointer): void {
    this.setPosition(pointer.x, pointer.y)
    this.setVisible(true)
    this.syncHitZone()
  }

  private onUp(): void {
    if (!this.isDesktop) {
      this.setVisible(false)
    }
    this.swinging = false
  }

  playSwing(): void {
    if (this.swinging) return
    this.swinging = true
    this.scene.tweens.add({
      targets: this,
      scaleX: this.baseScale * 1.4,
      scaleY: this.baseScale * 1.4,
      duration: 90,
      ease: "Power2",
      yoyo: true,
      onUpdate: () => this.syncHitZone(),
      onComplete: () => {
        this.swinging = false
        this.syncHitZone()
      },
    })
  }

  private syncHitZone(): void {
    // Divide out baseScale so the hitZone is never affected by the visual-only size change
    const w = WEAPON_W * (Math.abs(this.scaleX) / this.baseScale)
    const h = WEAPON_H * (Math.abs(this.scaleY) / this.baseScale)
    this.hitZone.setTo(this.x - w / 2, this.y - h / 2, w, h)
    this.redrawDebug()
  }

  private redrawDebug(): void {
    if (!this.debugGfx) return
    this.debugGfx.clear()
    if (!this.visible) return
    this.debugGfx.fillStyle(0x00ff66, 0.3)
    this.debugGfx.fillRect(
      this.hitZone.x,
      this.hitZone.y,
      this.hitZone.width,
      this.hitZone.height,
    )
    this.debugGfx.lineStyle(3, 0x00ff66, 0.9)
    this.debugGfx.strokeRect(
      this.hitZone.x,
      this.hitZone.y,
      this.hitZone.width,
      this.hitZone.height,
    )
  }

  preDestroy(): void {
    this.scene.input.setDefaultCursor("default")
    this.scene.input.off("pointermove", this.onMove, this)
    this.scene.input.off("pointerdown", this.onDown, this)
    this.scene.input.off("pointerup", this.onUp, this)
    this.scene.events.off("update", this.onUpdate, this)
    this.debugGfx?.destroy()
  }
}
