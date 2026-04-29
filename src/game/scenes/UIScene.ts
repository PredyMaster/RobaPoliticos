import * as Phaser from 'phaser'
import { EventBus } from '../EventBus'
import type { ComboState } from '../types/game'

// UIScene corre en paralelo sobre GameScene.
// React gestiona el HUD principal (GameHUD); esta escena se reserva
// para efectos visuales in-canvas: textos flotantes, flashes de combo,
// partículas de recompensa, etc. (Fase 16).

export class UIScene extends Phaser.Scene {
  private comboFlash!: Phaser.GameObjects.Text
  private coinCounter!: Phaser.GameObjects.Text
  private coinBg!: Phaser.GameObjects.Rectangle

  constructor() {
    super({ key: 'UIScene', active: false })
  }

  create(): void {
    // Fondo semitransparente para el contador
    this.coinBg = this.add.rectangle(20, 20, 220, 80, 0x000000, 0.55)
      .setOrigin(0, 0)
      .setDepth(99)

    // Contador de monedas arriba a la izquierda
    this.coinCounter = this.add.text(35, 28, 'Monedas: 0', {
      fontSize: '52px',
      color: '#ffffff',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 7,
    }).setOrigin(0, 0).setDepth(100)

    // Texto de combo flash (visible brevemente al cambiar nivel)
    this.comboFlash = this.add.text(1920 / 2, 300, '', {
      fontSize: '96px',
      color: '#f4c542',
      fontStyle: 'bold',
      stroke: '#1a1a2e',
      strokeThickness: 8,
    }).setOrigin(0.5).setAlpha(0)

    EventBus.on('COMBO_UPDATED',     this.onComboUpdated, this)
    EventBus.on('RUN_SCORE_UPDATED', this.onScoreUpdated, this)
    EventBus.on('RUN_STARTED',       this.onRunStarted,   this)
  }

  private onRunStarted(): void {
    this.coinCounter.setText('Monedas: 0')
    this.resizeBg()
  }

  private onScoreUpdated({ totalCoins }: { runScore: number; totalCoins: number }): void {
    this.coinCounter.setText(`Monedas: ${totalCoins}`)
    this.resizeBg()
  }

  private resizeBg(): void {
    const w = this.coinCounter.width + 30
    const h = this.coinCounter.height + 16
    this.coinBg.setSize(w, h)
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
    EventBus.off('COMBO_UPDATED',     this.onComboUpdated, this)
    EventBus.off('RUN_SCORE_UPDATED', this.onScoreUpdated, this)
    EventBus.off('RUN_STARTED',       this.onRunStarted,   this)
  }
}
