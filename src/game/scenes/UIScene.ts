import * as Phaser from "phaser"
import { EventBus } from "../EventBus"
import type { ComboState } from "../types/game"

// UIScene corre en paralelo sobre GameScene.
// React gestiona el HUD principal (GameHUD); esta escena se reserva
// para efectos visuales in-canvas: textos flotantes, flashes de combo,
// partículas de recompensa, etc. (Fase 16).

const BTN_W = 220
const BTN_H = 85
const MARGIN = 40

const COIN_BG_X = 20
const COIN_BG_Y = 20
const COIN_PAD_X = 22
const COIN_PAD_Y = 16
const COIN_SLOT_W = 80 // ancho fijo del slot del icono (evita saltos al cambiar imagen)
const COIN_SLOT_H = 52 // alto máximo del icono (= tamaño de fuente)
const COIN_GAP = 30

export class UIScene extends Phaser.Scene {
  private comboFlash!: Phaser.GameObjects.Text
  private coinCounter!: Phaser.GameObjects.Text
  private coinBg!: Phaser.GameObjects.Graphics
  private coinIcon!: Phaser.GameObjects.Image

  private musicEnabled = true
  private sfxEnabled = true

  private musicBtn!: Phaser.GameObjects.Image
  private sfxBtn!: Phaser.GameObjects.Image

  constructor() {
    super({ key: "UIScene", active: false })
  }

  create(): void {
    // Fondo semitransparente para el contador (esquinas redondeadas via Graphics)
    this.coinBg = this.add.graphics().setDepth(99)

    // Número de monedas (sin prefijo de texto)
    const textX = COIN_BG_X + COIN_PAD_X + COIN_SLOT_W + COIN_GAP
    this.coinCounter = this.add
      .text(textX, COIN_BG_Y + COIN_PAD_Y, "0", {
        fontSize: "52px",
        color: "#ffffff",
        fontStyle: "bold",
        stroke: "#000000",
        strokeThickness: 7,
      })
      .setOrigin(0, 0)
      .setDepth(100)

    // Icono centrado en el slot fijo de la izquierda
    this.coinIcon = this.add
      .image(
        COIN_BG_X + COIN_PAD_X + COIN_SLOT_W / 2,
        COIN_BG_Y + COIN_PAD_Y + this.coinCounter.height / 2,
        "coin_silver",
      )
      .setOrigin(0.5)
      .setDepth(100)
    this.updateCoinIcon(0)

    this.resizeBg()

    // Texto de combo flash (visible brevemente al cambiar nivel)
    this.comboFlash = this.add
      .text(1920 / 2, 300, "", {
        fontSize: "96px",
        color: "#f4c542",
        fontStyle: "bold",
        stroke: "#1a1a2e",
        strokeThickness: 8,
      })
      .setOrigin(0.5)
      .setAlpha(0)

    this.musicEnabled = (this.registry.get("musicEnabled") as boolean) ?? true
    this.sfxEnabled = (this.registry.get("sfxEnabled") as boolean) ?? true

    this.createAudioButtons()

    EventBus.on("COMBO_UPDATED", this.onComboUpdated, this)
    EventBus.on("RUN_SCORE_UPDATED", this.onScoreUpdated, this)
    EventBus.on("RUN_STARTED", this.onRunStarted, this)
  }

  private createAudioButtons(): void {
    const x = 1920 - MARGIN - BTN_W / 2
    const y1 = MARGIN + BTN_H / 2
    const y2 = y1 + BTN_H + 30

    this.musicBtn = this.add
      .image(x, y1, this.musicEnabled ? "music_on" : "music_off")
      .setDisplaySize(BTN_H, BTN_H)
      .setInteractive({ useHandCursor: true })
      .setDepth(100)

    this.musicBtn.on("pointerdown", () => {
      this.musicEnabled = !this.musicEnabled
      this.refreshMusicBtn()
      EventBus.emit("TOGGLE_MUSIC", this.musicEnabled)
    })

    this.sfxBtn = this.add
      .image(x, y2, this.sfxEnabled ? "sound_on" : "sound_off")
      .setDisplaySize(BTN_H, BTN_H)
      .setInteractive({ useHandCursor: true })
      .setDepth(100)

    this.sfxBtn.on("pointerdown", () => {
      this.sfxEnabled = !this.sfxEnabled
      this.refreshSfxBtn()
      EventBus.emit("TOGGLE_SFX", this.sfxEnabled)
    })
    this.sfxBtn.on("pointerover", () => this.sfxBtn.setAlpha(0.8))
    this.sfxBtn.on("pointerout", () => this.sfxBtn.setAlpha(1))
  }

  private refreshMusicBtn(): void {
    this.musicBtn.setTexture(this.musicEnabled ? "music_on" : "music_off")
  }

  private refreshSfxBtn(): void {
    this.sfxBtn.setTexture(this.sfxEnabled ? "sound_on" : "sound_off")
  }

  private updateCoinIcon(count: number): void {
    const key =
      count >= 100000
        ? "bill_pink"
        : count >= 10000
          ? "bill_green"
          : count >= 1000
            ? "bill_blue"
            : count >= 100
              ? "coin_gold"
              : "coin_silver"
    this.coinIcon.setTexture(key)
    const scale = Math.min(
      COIN_SLOT_W / this.coinIcon.width,
      COIN_SLOT_H / this.coinIcon.height,
    )
    this.coinIcon.setScale(scale)
  }

  private onRunStarted(): void {
    this.coinCounter.setText("0")
    this.updateCoinIcon(0)
    this.resizeBg()
  }

  private onScoreUpdated({
    totalCoins,
  }: {
    runScore: number
    totalCoins: number
  }): void {
    this.coinCounter.setText(`${totalCoins}`)
    this.updateCoinIcon(totalCoins)
    this.resizeBg()
  }

  private resizeBg(): void {
    const w =
      COIN_PAD_X + COIN_SLOT_W + COIN_GAP + this.coinCounter.width + COIN_PAD_X
    const h = this.coinCounter.height + COIN_PAD_Y * 2
    this.coinBg.clear()
    this.coinBg.fillStyle(0x000000, 0.55)
    this.coinBg.fillRoundedRect(COIN_BG_X, COIN_BG_Y, w, h, 14)
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
      ease: "Power2",
      onComplete: () => {
        this.comboFlash.setY(300)
      },
    })
  }

  shutdown(): void {
    EventBus.off("COMBO_UPDATED", this.onComboUpdated, this)
    EventBus.off("RUN_SCORE_UPDATED", this.onScoreUpdated, this)
    EventBus.off("RUN_STARTED", this.onRunStarted, this)
  }
}
