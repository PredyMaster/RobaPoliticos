import * as Phaser from 'phaser'
import { EventBus } from '../EventBus'
import type { ComboState } from '../types/game'

// UIScene corre en paralelo sobre GameScene.
// React gestiona el HUD principal (GameHUD); esta escena se reserva
// para efectos visuales in-canvas: textos flotantes, flashes de combo,
// partículas de recompensa, etc. (Fase 16).

export class UIScene extends Phaser.Scene {
  private comboFlash!: Phaser.GameObjects.Text

  constructor() {
    super({ key: 'UIScene', active: false })
  }

  create(): void {
    // Texto de combo flash (visible brevemente al cambiar nivel)
    this.comboFlash = this.add.text(1920 / 2, 300, '', {
      fontSize: '96px',
      color: '#f4c542',
      fontStyle: 'bold',
      stroke: '#1a1a2e',
      strokeThickness: 8,
    }).setOrigin(0.5).setAlpha(0)

    EventBus.on('COMBO_UPDATED', this.onComboUpdated, this)
  }

  private onComboUpdated(combo: ComboState): void {
    const milestones = [2, 5, 10, 20, 50]
    if (!milestones.includes(combo.count)) return

    this.comboFlash.setText(`×${combo.multiplier.toFixed(1)} COMBO!`)
    this.comboFlash.setAlpha(1)

    this.tweens.add({
      targets: this.comboFlash,
      alpha: 0,
      y: 240,
      duration: 900,
      ease: 'Power2',
      onComplete: () => {
        this.comboFlash.setY(300)
      },
    })
  }

  shutdown(): void {
    EventBus.off('COMBO_UPDATED', this.onComboUpdated, this)
  }
}
