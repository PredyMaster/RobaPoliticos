import * as Phaser from 'phaser'

export class WeaponCursor extends Phaser.GameObjects.Image {
  private swinging = false
  private isDesktop: boolean

  constructor(scene: Phaser.Scene) {
    super(scene, 0, 0, 'weapon_cursor')
    scene.add.existing(this)
    this.setOrigin(0, 0.5)
    this.setDepth(20)

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

    if (this.isDesktop) {
      this.setVisible(true)
      // Rotar en la dirección del movimiento del ratón
      const dx = pointer.velocity.x
      const dy = pointer.velocity.y
      if (Math.abs(dx) > 0.5 || Math.abs(dy) > 0.5) {
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
      onComplete: () => { this.swinging = false },
    })
  }

  preDestroy(): void {
    this.scene.input.setDefaultCursor('default')
    this.scene.input.off('pointermove', this.onMove, this)
    this.scene.input.off('pointerdown', this.onDown, this)
    this.scene.input.off('pointerup',   this.onUp,   this)
  }
}
