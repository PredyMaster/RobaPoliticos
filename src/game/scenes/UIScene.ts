import * as Phaser from 'phaser'
import { EventBus } from '../EventBus'
import type { ComboState } from '../types/game'

// UIScene corre en paralelo sobre GameScene.
// React gestiona el HUD principal (GameHUD); esta escena se reserva
// para efectos visuales in-canvas: textos flotantes, flashes de combo,
// partículas de recompensa, etc. (Fase 16).

const BTN_W  = 220
const BTN_H  = 64
const MARGIN = 20

export class UIScene extends Phaser.Scene {
  private comboFlash!: Phaser.GameObjects.Text
  private coinCounter!: Phaser.GameObjects.Text
  private coinBg!: Phaser.GameObjects.Rectangle

  private musicEnabled = true
  private sfxEnabled   = true

  private musicBtnBg!:   Phaser.GameObjects.Rectangle
  private musicBtnLabel!: Phaser.GameObjects.Text
  private sfxBtnBg!:     Phaser.GameObjects.Rectangle
  private sfxBtnLabel!:  Phaser.GameObjects.Text

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

    this.musicEnabled = (this.registry.get('musicEnabled') as boolean) ?? true
    this.sfxEnabled   = (this.registry.get('sfxEnabled')   as boolean) ?? true

    this.createAudioButtons()

    EventBus.on('COMBO_UPDATED',     this.onComboUpdated, this)
    EventBus.on('RUN_SCORE_UPDATED', this.onScoreUpdated, this)
    EventBus.on('RUN_STARTED',       this.onRunStarted,   this)
  }

  private createAudioButtons(): void {
    const x  = 1920 - MARGIN - BTN_W / 2
    const y1 = MARGIN + BTN_H / 2
    const y2 = y1 + BTN_H + 10

    // ── Botón música ─────────────────────────────────────────
    this.musicBtnBg = this.add.rectangle(x, y1, BTN_W, BTN_H, 0x111133, 0.88)
      .setStrokeStyle(3, this.musicEnabled ? 0xf4c542 : 0xe53e3e)
      .setInteractive({ useHandCursor: true })
      .setDepth(100)

    this.musicBtnBg.on('pointerdown', () => {
      this.musicEnabled = !this.musicEnabled
      this.refreshMusicBtn()
      EventBus.emit('TOGGLE_MUSIC', this.musicEnabled)
    })
    this.musicBtnBg.on('pointerover',  () => this.musicBtnBg.setAlpha(1))
    this.musicBtnBg.on('pointerout',   () => this.musicBtnBg.setAlpha(0.88))

    this.musicBtnLabel = this.add.text(x, y1, this.musicLabel(), {
      fontSize: '28px',
      color: this.musicEnabled ? '#ffffff' : '#999999',
      fontStyle: 'bold',
    }).setOrigin(0.5).setDepth(101)

    // ── Botón efectos de sonido ───────────────────────────────
    this.sfxBtnBg = this.add.rectangle(x, y2, BTN_W, BTN_H, 0x111133, 0.88)
      .setStrokeStyle(3, this.sfxEnabled ? 0xf4c542 : 0xe53e3e)
      .setInteractive({ useHandCursor: true })
      .setDepth(100)

    this.sfxBtnBg.on('pointerdown', () => {
      this.sfxEnabled = !this.sfxEnabled
      this.refreshSfxBtn()
      EventBus.emit('TOGGLE_SFX', this.sfxEnabled)
    })
    this.sfxBtnBg.on('pointerover',  () => this.sfxBtnBg.setAlpha(1))
    this.sfxBtnBg.on('pointerout',   () => this.sfxBtnBg.setAlpha(0.88))

    this.sfxBtnLabel = this.add.text(x, y2, this.sfxLabel(), {
      fontSize: '28px',
      color: this.sfxEnabled ? '#ffffff' : '#999999',
      fontStyle: 'bold',
    }).setOrigin(0.5).setDepth(101)
  }

  private musicLabel(): string {
    return `♫ MUSICA  ${this.musicEnabled ? 'ON' : 'OFF'}`
  }

  private sfxLabel(): string {
    return `♪ EFECTOS  ${this.sfxEnabled ? 'ON' : 'OFF'}`
  }

  private refreshMusicBtn(): void {
    this.musicBtnBg.setStrokeStyle(3, this.musicEnabled ? 0xf4c542 : 0xe53e3e)
    this.musicBtnLabel.setText(this.musicLabel())
    this.musicBtnLabel.setColor(this.musicEnabled ? '#ffffff' : '#999999')
  }

  private refreshSfxBtn(): void {
    this.sfxBtnBg.setStrokeStyle(3, this.sfxEnabled ? 0xf4c542 : 0xe53e3e)
    this.sfxBtnLabel.setText(this.sfxLabel())
    this.sfxBtnLabel.setColor(this.sfxEnabled ? '#ffffff' : '#999999')
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
