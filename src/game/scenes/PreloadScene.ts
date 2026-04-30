import * as Phaser from "phaser"
import { EventBus } from "../EventBus"
import { toneDataUrl } from "../utils/audio"

const W = 1920
const H = 1080

// Pon estos archivos en public/assets/ para reemplazar los placeholders:
//   player.png        464×515   (político de cuerpo entero, pies abajo, PNG transparente)
//   weapon_cursor.png 264×242   (mano+arma apuntando →, mango en el lado IZQUIERDO)
//   catch_box.png     768×480   (caja/maletín, PNG transparente)
//   coin.png          ―         (moneda que sale al golpear al player)
//   bg.jpg            1920×1080 (fondo de escena, opcional)
const REAL_SPRITES: Record<string, string> = {
  player: "assets/player.png",
  player_soft_slap: "assets/player_soft_slap.png",
  player_hard_slap: "assets/player_hard_slap.png",
  weapon_cursor: "assets/weapon_cursor.png",
  catch_box: "assets/catch_box.png",
  coin_silver: "assets/coins/coin_silver.png",
  coin_gold: "assets/coins/coin_gold.png",
  bill_blue: "assets/coins/bill_blue.png",
  bill_green: "assets/coins/bill_green.png",
  bill_pink: "assets/coins/bill_pink.png",
  bg: "assets/bg.jpg",
  bg1: "assets/backgrounds/bg1.jpg",
  bg2: "assets/backgrounds/bg2.jpg",
  bg3: "assets/backgrounds/bg3.jpg",
  bg4: "assets/backgrounds/bg4.jpg",
  bg5: "assets/backgrounds/bg5.jpg",
  bg6: "assets/backgrounds/bg6.jpg",
  bg7: "assets/backgrounds/bg7.jpg",
  bg8: "assets/backgrounds/bg8.jpg",
  music_on: "assets/ui/music_on.png",
  music_off: "assets/ui/music_off.png",
  sound_on: "assets/ui/sound_on.png",
  sound_off: "assets/ui/sound_off.png",
}

export class PreloadScene extends Phaser.Scene {
  private progressBar!: Phaser.GameObjects.Graphics
  private progressBox!: Phaser.GameObjects.Graphics

  constructor() {
    super({ key: "PreloadScene" })
  }

  preload(): void {
    this.createLoadingUI()
    this.registerLoadEvents()

    // Para cada sprite real: si el archivo falla, generamos el placeholder
    this.load.on("loaderror", (file: Phaser.Loader.File) => {
      console.warn(
        `[PreloadScene] No se encontró ${file.key}, usando placeholder`,
      )
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

    this.add
      .text(cx, cy - 60, "Roba Políticos", {
        fontSize: "40px",
        color: "#f4c542",
        fontStyle: "bold",
      })
      .setOrigin(0.5)

    this.add
      .text(cx, cy + 60, "Cargando…", {
        fontSize: "22px",
        color: "rgba(255,255,255,0.5)",
      })
      .setOrigin(0.5)
  }

  private registerLoadEvents(): void {
    const cx = W / 2
    const cy = H / 2

    this.load.on("progress", (value: number) => {
      this.progressBar.clear()
      this.progressBar.fillStyle(0xf4c542, 1)
      this.progressBar.fillRect(cx - 310, cy - 15, 620 * value, 30)
    })

    this.load.on("complete", () => {
      this.progressBar.destroy()
      this.progressBox.destroy()
    })
  }

  // Genera placeholder SOLO para la key que falló al cargar
  private generatePlaceholderFor(key: string): void {
    const gfx = this.make.graphics({ add: false })

    switch (key) {
      case "player":
        gfx.fillStyle(0xf4c542)
        gfx.fillCircle(232, 280, 200)
        gfx.fillStyle(0xc49b10)
        gfx.fillCircle(232, 90, 80)
        gfx.fillStyle(0xff6b6b)
        gfx.fillRect(180, 320, 104, 180)
        gfx.generateTexture("player", 464, 515)
        break

      case "player_soft_slap":
        gfx.fillStyle(0xf4c542)
        gfx.fillCircle(232, 280, 200)
        gfx.fillStyle(0xc49b10)
        gfx.fillCircle(232, 90, 80)
        gfx.fillStyle(0xff6b6b)
        gfx.fillRect(180, 320, 104, 180)
        gfx.fillStyle(0xff9900, 0.6)
        gfx.fillCircle(320, 200, 40)
        gfx.generateTexture("player_soft_slap", 464, 515)
        break

      case "player_hard_slap":
        gfx.fillStyle(0xf4c542)
        gfx.fillCircle(232, 280, 200)
        gfx.fillStyle(0xc49b10)
        gfx.fillCircle(232, 90, 80)
        gfx.fillStyle(0xff6b6b)
        gfx.fillRect(180, 320, 104, 180)
        gfx.fillStyle(0xff0000, 0.8)
        gfx.fillCircle(320, 200, 60)
        gfx.generateTexture("player_hard_slap", 464, 515)
        break

      case "weapon_cursor":
        gfx.fillStyle(0xf4c542)
        gfx.fillRect(0, 110, 200, 22)
        gfx.fillTriangle(200, 90, 200, 152, 264, 121)
        gfx.generateTexture("weapon_cursor", 264, 242)
        break

      case "catch_box":
        gfx.lineStyle(4, 0xf4c542)
        gfx.strokeRect(0, 0, 768, 480)
        gfx.fillStyle(0xf4c542, 0.12)
        gfx.fillRect(0, 0, 768, 480)
        gfx.generateTexture("catch_box", 768, 480)
        break

      case "coin_silver":
        gfx.fillStyle(0xc0c0c0)
        gfx.fillCircle(20, 20, 20)
        gfx.lineStyle(2, 0x909090)
        gfx.strokeCircle(20, 20, 20)
        gfx.generateTexture("coin_silver", 40, 40)
        break

      case "coin_gold":
        gfx.fillStyle(0xffcc00)
        gfx.fillCircle(20, 20, 20)
        gfx.lineStyle(2, 0xc49b10)
        gfx.strokeCircle(20, 20, 20)
        gfx.generateTexture("coin_gold", 40, 40)
        break

      case "bill_blue":
        gfx.fillStyle(0x3b82f6)
        gfx.fillRect(0, 0, 56, 28)
        gfx.lineStyle(2, 0x1d4ed8)
        gfx.strokeRect(2, 2, 52, 24)
        gfx.generateTexture("bill_blue", 56, 28)
        break

      case "bill_green":
        gfx.fillStyle(0x22c55e)
        gfx.fillRect(0, 0, 56, 28)
        gfx.lineStyle(2, 0x15803d)
        gfx.strokeRect(2, 2, 52, 24)
        gfx.generateTexture("bill_green", 56, 28)
        break

      case "bill_pink":
        gfx.fillStyle(0xec4899)
        gfx.fillRect(0, 0, 56, 28)
        gfx.lineStyle(2, 0x9d174d)
        gfx.strokeRect(2, 2, 52, 24)
        gfx.generateTexture("bill_pink", 56, 28)
        break

      case "bg":
      case "bg1":
      case "bg2":
      case "bg3":
      case "bg4":
      case "bg5":
      case "bg6":
      case "bg7":
      case "bg8":
        gfx.fillGradientStyle(0x0f0f1e, 0x0f0f1e, 0x1a1a2e, 0x1a1a2e, 1)
        gfx.fillRect(0, 0, W, H)
        gfx.generateTexture(key, W, H)
        break
    }

    gfx.destroy()
  }

  // Placeholders que siempre se generan (plataforma — no tiene sprite real)
  private generateStaticPlaceholders(): void {
    const gfx = this.make.graphics({ add: false })

    gfx.fillStyle(0x2a2a4e)
    gfx.fillRect(0, 0, W, 40)
    gfx.lineStyle(2, 0x4a4a8e)
    gfx.strokeRect(0, 0, W, 40)
    gfx.generateTexture("platform", W, 40)

    // Botón de cambio de fondo (flecha derecha)
    gfx.clear()
    gfx.fillStyle(0x000000, 0.55)
    gfx.fillCircle(95, 95, 95)
    gfx.fillStyle(0xfddb44, 1)
    gfx.fillTriangle(65, 55, 65, 135, 135, 95)
    gfx.generateTexture("bg_arrow", 190, 190)

    gfx.destroy()
  }

  private loadPlaceholderAudio(): void {
    this.load.audio("sfx_coin_rare", toneDataUrl(1320, 100, 0.4, "sine"))
    this.load.audio("sfx_combo", toneDataUrl(660, 120, 0.5, "sine"))
    this.load.audio("sfx_purchase", toneDataUrl(659, 200, 0.45, "sine"))

    for (let i = 1; i <= 5; i++) {
      this.load.audio(
        `sfx_coin_${i}`,
        `assets/audio/sound%20effects/coins/Coin${i}.mp3`,
      )
    }

    for (let i = 1; i <= 4; i++) {
      this.load.audio(
        `sfx_slap_${i}`,
        `assets/audio/sound%20effects/slaps/Slap${i}.mp3`,
      )
    }

    for (let i = 1; i <= 6; i++) {
      this.load.audio(
        `sfx_player_${i}`,
        `assets/audio/sound%20effects/player/player-sound${i}.mp3`,
      )
    }

    this.load.audio(
      "bgm",
      "assets/audio/background%20music/robaPoliticosSong.mp3",
    )
  }

  create(): void {
    EventBus.emit("PRELOAD_COMPLETE")
    this.scene.launch("GameScene")
    this.scene.launch("UIScene")
    this.scene.stop()
  }
}
