import * as Phaser from 'phaser'
import { EventBus } from '../EventBus'
import { toneDataUrl } from '../utils/audio'

const W = 1920
const H = 1080

// Pon estos archivos en public/assets/ para reemplazar los placeholders:
//   player.png        120×160   (político de cuerpo entero, pies abajo, PNG transparente)
//   weapon_cursor.png 128×48    (mano+arma apuntando →, mango en el lado IZQUIERDO)
//   catch_box.png     200×80    (caja/maletín, PNG transparente)
//   bg.png            1920×1080 (fondo de escena, opcional)
const REAL_SPRITES: Record<string, string> = {
  player:         'assets/player.png',
  weapon_cursor:  'assets/weapon_cursor.png',
  catch_box:      'assets/catch_box.png',
  bg:             'assets/bg.png',
}

export class PreloadScene extends Phaser.Scene {
  private progressBar!: Phaser.GameObjects.Graphics
  private progressBox!: Phaser.GameObjects.Graphics

  constructor() {
    super({ key: 'PreloadScene' })
  }

  preload(): void {
    this.createLoadingUI()
    this.registerLoadEvents()

    // Para cada sprite real: si el archivo falla, generamos el placeholder
    this.load.on('loaderror', (file: Phaser.Loader.File) => {
      console.warn(`[PreloadScene] No se encontró ${file.key}, usando placeholder`)
      this.generatePlaceholderFor(file.key)
    })

    // Intentar cargar sprites reales desde public/assets/
    for (const [key, path] of Object.entries(REAL_SPRITES)) {
      this.load.image(key, path)
    }

    // Placeholders de monedas y plataforma (no tienen sprite real, se generan siempre)
    this.generateStaticPlaceholders()

    this.loadPlaceholderAudio()
  }

  private createLoadingUI(): void {
    const cx = W / 2
    const cy = H / 2

    this.progressBox = this.add.graphics()
    this.progressBox.fillStyle(0x222244, 0.8)
    this.progressBox.fillRect(cx - 320, cy - 25, 640, 50)

    this.progressBar = this.add.graphics()

    this.add.text(cx, cy - 60, 'Roba Políticos', {
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

  // Genera placeholder SOLO para la key que falló al cargar
  private generatePlaceholderFor(key: string): void {
    const gfx = this.make.graphics({ add: false })

    switch (key) {
      case 'player':
        gfx.fillStyle(0xf4c542)
        gfx.fillCircle(60, 80, 60)
        gfx.fillStyle(0xc49b10)
        gfx.fillCircle(60, 28, 28)
        gfx.fillStyle(0xff6b6b)
        gfx.fillRect(40, 100, 40, 60)
        gfx.generateTexture('player', 120, 160)
        break

      case 'weapon_cursor':
        gfx.fillStyle(0xf4c542)
        gfx.fillRect(0, 6, 48, 10)
        gfx.fillTriangle(48, 0, 48, 22, 64, 11)
        gfx.generateTexture('weapon_cursor', 64, 22)
        break

      case 'catch_box':
        gfx.lineStyle(4, 0xf4c542)
        gfx.strokeRect(0, 0, 200, 80)
        gfx.fillStyle(0xf4c542, 0.12)
        gfx.fillRect(0, 0, 200, 80)
        gfx.generateTexture('catch_box', 200, 80)
        break

      case 'bg':
        gfx.fillGradientStyle(0x0f0f1e, 0x0f0f1e, 0x1a1a2e, 0x1a1a2e, 1)
        gfx.fillRect(0, 0, W, H)
        gfx.generateTexture('bg', W, H)
        break
    }

    gfx.destroy()
  }

  // Placeholders que siempre se generan (monedas, plataforma — no tienen sprite real)
  private generateStaticPlaceholders(): void {
    const gfx = this.make.graphics({ add: false })

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

    gfx.clear()
    gfx.fillStyle(0x4ade80)
    gfx.fillRect(0, 0, 56, 28)
    gfx.lineStyle(2, 0x166534)
    gfx.strokeRect(2, 2, 52, 24)
    gfx.generateTexture('money_bill', 56, 28)

    gfx.clear()
    gfx.fillStyle(0x2a2a4e)
    gfx.fillRect(0, 0, W, 40)
    gfx.lineStyle(2, 0x4a4a8e)
    gfx.strokeRect(0, 0, W, 40)
    gfx.generateTexture('platform', W, 40)

    gfx.destroy()
  }

  private loadPlaceholderAudio(): void {
    this.load.audio('sfx_hit',       toneDataUrl(160,  130, 0.40, 'sine'))
    this.load.audio('sfx_crit',      toneDataUrl(520,  110, 0.45, 'square'))
    this.load.audio('sfx_coin',      toneDataUrl(880,   80, 0.35, 'sine'))
    this.load.audio('sfx_coin_rare', toneDataUrl(1320, 100, 0.40, 'sine'))
    this.load.audio('sfx_combo',     toneDataUrl(660,  120, 0.50, 'sine'))
    this.load.audio('sfx_purchase',  toneDataUrl(659,  200, 0.45, 'sine'))
  }

  create(): void {
    EventBus.emit('PRELOAD_COMPLETE')
    this.scene.launch('GameScene')
    this.scene.launch('UIScene')
    this.scene.stop()
  }
}
