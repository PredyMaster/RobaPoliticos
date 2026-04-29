import * as Phaser from 'phaser'
import { SCENE_W, GROUND_Y } from '../scenes/GameScene'

const PLAYER_W = 120
const PLAYER_H = 160

export class PlayerCharacter extends Phaser.GameObjects.Sprite {
  readonly hitZone: Phaser.Geom.Rectangle

  private recovering = false

  constructor(scene: Phaser.Scene) {
    const x = SCENE_W / 2
    const y = GROUND_Y - PLAYER_H / 2
    super(scene, x, y, 'player')
    scene.add.existing(this)

    this.hitZone = new Phaser.Geom.Rectangle(
      x - PLAYER_W / 2,
      y - PLAYER_H / 2,
      PLAYER_W,
      PLAYER_H,
    )
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
      ease: 'Power2',
      yoyo: true,
      onComplete: () => {
        this.x = SCENE_W / 2
        this.recovering = false
      },
    })

    this.scene.events.emit('player:hit', { direction, isCritical })
  }
}
