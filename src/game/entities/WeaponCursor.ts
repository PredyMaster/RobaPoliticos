import * as Phaser from 'phaser'
import { SHOW_COLLIDERS } from '../scenes/GameScene'

const WEAPON_W = 264
const WEAPON_H = 242

export class WeaponCursor extends Phaser.GameObjects.Image {
  readonly hitZone: Phaser.Geom.Rectangle
  lastVelocity: { x: number; y: number } = { x: 0, y: 0 }

  private swinging = false
  private isDesktop: boolean
  private debugGfx?: Phaser.GameObjects.Graphics

  constructor(scene: Phaser.Scene) {
    super(scene, 0, 0, 'weapon_cursor')
    scene.add.existing(this)
    // Origen centrado para que rotación y collider queden estables sobre el puntero
    this.setOrigin(0.5, 0.5)
    this.setDepth(20)

    this.hitZone = new Phaser.Geom.Rectangle(0, 0, WEAPON_W, WEAPON_H)

    if (SHOW_COLLIDERS) {
      this.debugGfx = scene.add.graphics()
      this.debugGfx.setDepth(this.depth + 1)
    }

    // En desktop el cursor sigue al ratón siempre; en móvil solo al tocar
    this.isDesktop = scene.sys.game.device.os.desktop

    if (this.isDesktop) {
      // Ocultar cursor nativo del navegador sobre el canvas
      scene.input.setDefaultCursor('none')
      this.setVisible(true)
    } else {
      this.setVisible(false)
    }

    scene.input.on('pointermove', this.onMove, this)
    scene.input.on('pointerdown', this.onDown, this)
    scene.input.on('pointerup',   this.onUp,   this)
  }

  private onMove(pointer: Phaser.Input.Pointer): void {
    this.setPosition(pointer.x, pointer.y)
    this.lastVelocity = { x: pointer.velocity.x, y: pointer.velocity.y }
    this.syncHitZone()

    if (this.isDesktop) {
      this.setVisible(true)
      // Rotar en la dirección del movimiento del ratón (suavizado)
      const dx = pointer.velocity.x
      const dy = pointer.velocity.y
      if (Math.abs(dx) > 1.5 || Math.abs(dy) > 1.5) {
        this.setRotation(Math.atan2(dy, dx))
      }
    } else if (pointer.isDown) {
      const dx = pointer.x - pointer.downX
      const dy = pointer.y - pointer.downY
      if (dx !== 0 || dy !== 0) this.setRotation(Math.atan2(dy, dx))
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
      scaleX: 1.4,
      scaleY: 1.4,
      duration: 90,
      ease: 'Power2',
      yoyo: true,
      onUpdate: () => this.syncHitZone(),
      onComplete: () => {
        this.swinging = false
        this.syncHitZone()
      },
    })
  }

  private syncHitZone(): void {
    const w = WEAPON_W * Math.abs(this.scaleX)
    const h = WEAPON_H * Math.abs(this.scaleY)
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
    this.scene.input.setDefaultCursor('default')
    this.scene.input.off('pointermove', this.onMove, this)
    this.scene.input.off('pointerdown', this.onDown, this)
    this.scene.input.off('pointerup',   this.onUp,   this)
    this.debugGfx?.destroy()
  }
}
