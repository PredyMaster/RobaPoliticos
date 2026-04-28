import Phaser from 'phaser'
import { EventBus } from '../EventBus'

// Dimensiones de la pantalla base
const W = 1920
const H = 1080

export class PreloadScene extends Phaser.Scene {
  private progressBar!: Phaser.GameObjects.Graphics
  private progressBox!: Phaser.GameObjects.Graphics

  constructor() {
    super({ key: 'PreloadScene' })
  }

  preload(): void {
    this.createLoadingUI()
    this.registerLoadEvents()
    this.generatePlaceholderTextures()
  }

  private createLoadingUI(): void {
    const cx = W / 2
    const cy = H / 2

    this.progressBox = this.add.graphics()
    this.progressBox.fillStyle(0x222244, 0.8)
    this.progressBox.fillRect(cx - 320, cy - 25, 640, 50)

    this.progressBar = this.add.graphics()

    this.add.text(cx, cy - 60, '💰 Roba Políticos', {
      fontSize: '40px',
      color: '#f4c542',
      fontStyle: 'bold',
    }).setOrigin(0.5)

    this.add.text(cx, cy + 60, 'Cargando…', {
      fontSize: '22px',
      color: 'rgba(255,255,255,0.5)',
    }).setOrigin(0.5)
  }

  private registerLoadEvents(): void {
    const cx = W / 2
    const cy = H / 2

    this.load.on('progress', (value: number) => {
      this.progressBar.clear()
      this.progressBar.fillStyle(0xf4c542, 1)
      this.progressBar.fillRect(cx - 310, cy - 15, 620 * value, 30)
    })

    this.load.on('complete', () => {
      this.progressBar.destroy()
      this.progressBox.destroy()
    })
  }

  // Crea texturas placeholder con gráficos de Phaser hasta que lleguen los sprites reales
  private generatePlaceholderTextures(): void {
    const gfx = this.make.graphics({ add: false })

    // ── Personaje (piñata placeholder) ───────────────────────
    gfx.clear()
    gfx.fillStyle(0xf4c542)
    gfx.fillCircle(60, 80, 60)      // cuerpo
    gfx.fillStyle(0xc49b10)
    gfx.fillCircle(60, 28, 28)      // cabeza
    gfx.fillStyle(0xff6b6b)
    gfx.fillRect(40, 100, 40, 60)   // piernas
    gfx.generateTexture('player', 120, 160)

    // ── Monedas ───────────────────────────────────────────────
    const coinDefs: Array<[string, number, number]> = [
      ['coin_normal',     0xffd700, 16],
      ['coin_silver',     0xc0c0c0, 16],
      ['coin_gold',       0xffaa00, 20],
      ['gem',             0x60a5fa, 16],
      ['multiplier_coin', 0xff6b6b, 16],
      ['magnet_coin',     0xa78bfa, 16],
      ['bomb_coin',       0x374151, 16],
    ]
    for (const [key, color, r] of coinDefs) {
      gfx.clear()
      gfx.fillStyle(color)
      gfx.fillCircle(r, r, r)
      gfx.generateTexture(key, r * 2, r * 2)
    }

    // Billete
    gfx.clear()
    gfx.fillStyle(0x4ade80)
    gfx.fillRect(0, 0, 56, 28)
    gfx.lineStyle(2, 0x166534)
    gfx.strokeRect(2, 2, 52, 24)
    gfx.generateTexture('money_bill', 56, 28)

    // ── Caja receptora ────────────────────────────────────────
    gfx.clear()
    gfx.lineStyle(4, 0xf4c542)
    gfx.strokeRect(0, 0, 200, 80)
    gfx.fillStyle(0xf4c542, 0.12)
    gfx.fillRect(0, 0, 200, 80)
    gfx.generateTexture('catch_box', 200, 80)

    // ── Plataforma ────────────────────────────────────────────
    gfx.clear()
    gfx.fillStyle(0x2a2a4e)
    gfx.fillRect(0, 0, W, 40)
    gfx.lineStyle(2, 0x4a4a8e)
    gfx.strokeRect(0, 0, W, 40)
    gfx.generateTexture('platform', W, 40)

    // ── Cursor de arma ────────────────────────────────────────
    gfx.clear()
    gfx.fillStyle(0xf4c542)
    gfx.fillRect(0, 6, 48, 10)
    gfx.fillTriangle(48, 0, 48, 22, 64, 11)
    gfx.generateTexture('weapon_cursor', 64, 22)

    // ── Fondo de escena ───────────────────────────────────────
    gfx.clear()
    gfx.fillGradientStyle(0x0f0f1e, 0x0f0f1e, 0x1a1a2e, 0x1a1a2e, 1)
    gfx.fillRect(0, 0, W, H)
    gfx.generateTexture('bg', W, H)

    gfx.destroy()
  }

  create(): void {
    EventBus.emit('GAME_READY')

    // Lanzar GameScene y UIScene en paralelo; detener PreloadScene
    this.scene.launch('GameScene')
    this.scene.launch('UIScene')
    this.scene.stop()
  }
}
