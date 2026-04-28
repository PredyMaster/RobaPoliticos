import Phaser from 'phaser'
import { EventBus } from '../EventBus'

// Dimensiones base de la escena (1920×1080)
export const SCENE_W = 1920
export const SCENE_H = 1080

// Altura del suelo (donde reposa la caja)
export const GROUND_Y = SCENE_H - 40

export class GameScene extends Phaser.Scene {
  private isRunning = false

  // Placeholders hasta Fase 12 (entidades)
  private bgImage!: Phaser.GameObjects.Image
  private platformImage!: Phaser.GameObjects.Image
  private readyText!: Phaser.GameObjects.Text

  constructor() {
    super({ key: 'GameScene' })
  }

  create(): void {
    this.buildStaticBackground()
    this.registerEventBusListeners()
  }

  // ── Fondo y plataforma ────────────────────────────────────

  private buildStaticBackground(): void {
    this.bgImage = this.add.image(SCENE_W / 2, SCENE_H / 2, 'bg')

    this.platformImage = this.add.image(SCENE_W / 2, GROUND_Y + 20, 'platform')

    this.readyText = this.add.text(SCENE_W / 2, SCENE_H / 2 - 80, 'Listo para jugar', {
      fontSize: '48px',
      color: 'rgba(255,255,255,0.2)',
      fontStyle: 'bold',
    }).setOrigin(0.5)
  }

  // ── Bridge EventBus (React → Phaser) ─────────────────────

  private registerEventBusListeners(): void {
    EventBus.on('RUN_STARTED',  this.onRunStarted,  this)
    EventBus.on('RUN_PAUSED',   this.onRunPaused,   this)
    EventBus.on('RUN_RESUMED',  this.onRunResumed,  this)
    EventBus.on('EXIT_TO_HOME', this.onExitToHome,  this)
  }

  private onRunStarted(): void {
    if (this.isRunning) return
    this.isRunning = true

    this.readyText.setVisible(false)

    // Fase 12-15 llenará esta sección con entidades y sistemas
    // Por ahora solo confirma que Phaser recibió el evento
    console.log('[GameScene] RUN_STARTED — gameplay starts in Fase 12')
  }

  private onRunPaused(): void {
    if (!this.isRunning) return
    this.physics.pause()
  }

  private onRunResumed(): void {
    if (!this.isRunning) return
    this.physics.resume()
  }

  private onExitToHome(): void {
    this.isRunning = false
    this.physics.pause()
    // La destrucción completa la gestiona GameScreen.useEffect cleanup (game.destroy)
  }

  // ── Lifecycle ─────────────────────────────────────────────

  update(_time: number, _delta: number): void {
    // Fase 15: gameplay loop
  }

  shutdown(): void {
    EventBus.off('RUN_STARTED',  this.onRunStarted,  this)
    EventBus.off('RUN_PAUSED',   this.onRunPaused,   this)
    EventBus.off('RUN_RESUMED',  this.onRunResumed,  this)
    EventBus.off('EXIT_TO_HOME', this.onExitToHome,  this)
  }
}
