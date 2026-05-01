import * as Phaser from "phaser"
import { EventBus } from "../EventBus"
import type { ComboState } from "../types/game"

// UIScene corre en paralelo sobre GameScene.
// React gestiona el HUD principal (GameHUD); esta escena se reserva
// para efectos visuales in-canvas: textos flotantes, flashes de combo,
// partículas de recompensa, etc. (Fase 16).

const BTN_W = 290
const BTN_H = 190
const MARGIN = 80

const COIN_BG_X = 60
const COIN_BG_Y = 80
const COIN_PAD_X = 26
const COIN_PAD_Y = 18
const COIN_SLOT_W = 95 // ancho fijo del slot del icono (evita saltos al cambiar imagen)
const COIN_SLOT_H = 57 // alto máximo del icono (= tamaño de fuente)
const COIN_GAP = 20

const TIMER_GAP = 15 // separación vertical entre coinBg y timerBg

const gameTime = 300 // 5 minutos en segundos

export class UIScene extends Phaser.Scene {
  private comboFlash!: Phaser.GameObjects.Text
  private coinCounter!: Phaser.GameObjects.Text
  private coinBg!: Phaser.GameObjects.Graphics
  private coinIcon!: Phaser.GameObjects.Image

  private timerBg!: Phaser.GameObjects.Graphics
  private timerText!: Phaser.GameObjects.Text
  private timerBgY = 0
  private timeRemaining = gameTime
  private timerActive = false
  private currentCoins = 0

  private musicEnabled = true
  private sfxEnabled = true

  private musicBtn!: Phaser.GameObjects.Image
  private sfxBtn!: Phaser.GameObjects.Image
  private bgArrowBtn!: Phaser.GameObjects.Image

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
        fontSize: "72px",
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

    // Temporizador de cuenta atrás debajo del coinCounter
    this.timerBgY =
      COIN_BG_Y + this.coinCounter.height + COIN_PAD_Y * 2 + TIMER_GAP
    this.timerBg = this.add.graphics().setDepth(99)

    this.timerText = this.add
      .text(
        COIN_BG_X + COIN_PAD_X,
        this.timerBgY + COIN_PAD_Y,
        this.formatTime(gameTime),
        {
          fontSize: "72px",
          color: "#ffffff",
          fontStyle: "bold",
          stroke: "#000000",
          strokeThickness: 7,
        },
      )
      .setOrigin(0, 0)
      .setDepth(100)

    this.resizeTimerBg()

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
    EventBus.on("RUN_PAUSED", this.onRunPaused, this)
    EventBus.on("RUN_RESUMED", this.onRunResumed, this)

    // UIScene se lanza junto a GameScene; GameScene emite GAME_READY antes de
    // que UIScene termine su create(), así que RUN_STARTED llega antes de que
    // el listener esté registrado. Arrancamos el timer directamente aquí.
    this.timerActive = true
  }

  update(_time: number, delta: number): void {
    if (!this.timerActive || this.timeRemaining <= 0) return

    this.timeRemaining -= delta / 1000

    if (this.timeRemaining <= 0) {
      this.timeRemaining = 0
      this.timerActive = false
      this.timerText.setText("0:00")
      this.resizeTimerBg()
      this.onTimeUp()
      return
    }

    this.timerText.setText(this.formatTime(this.timeRemaining))

    const ratio = this.timeRemaining / gameTime
    if (ratio <= 0.05) {
      this.timerText.setColor("#ff4444")
    } else if (ratio <= 0.1) {
      this.timerText.setColor("#f4c542")
    } else {
      this.timerText.setColor("#ffffff")
    }

    this.resizeTimerBg()
  }

  private formatTime(seconds: number): string {
    const s = Math.max(0, seconds)
    const m = Math.floor(s / 60)
    const sec = Math.floor(s % 60)
    return `${m}:${sec.toString().padStart(2, "0")}`
  }

  private resizeTimerBg(): void {
    const w = COIN_PAD_X + this.timerText.width + COIN_PAD_X
    const h = this.timerText.height + COIN_PAD_Y * 2
    this.timerBg.clear()
    this.timerBg.fillStyle(0x000000, 0.55)
    this.timerBg.fillRoundedRect(COIN_BG_X, this.timerBgY, w, h, 14)
  }

  private onTimeUp(): void {
    EventBus.emit("RUN_PAUSED")
    this.scene.launch("GameOverScene", { coins: this.currentCoins })
  }

  private createAudioButtons(): void {
    const x = 1920 - (MARGIN - 90) - BTN_W / 2
    const y1 = MARGIN + BTN_H / 2
    const y2 = y1 + BTN_H + 30
    const y3 = y2 + BTN_H + 30

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

    this.bgArrowBtn = this.add
      .image(x, y3, "bg_arrow")
      .setDisplaySize(BTN_H, BTN_H)
      .setInteractive({ useHandCursor: true })
      .setDepth(100)

    this.bgArrowBtn.on("pointerdown", () => EventBus.emit("CHANGE_BG"))
    this.bgArrowBtn.on("pointerover", () => this.bgArrowBtn.setAlpha(0.8))
    this.bgArrowBtn.on("pointerout", () => this.bgArrowBtn.setAlpha(1))
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
      (COIN_SLOT_W / this.coinIcon.width) * 1.6,
      (COIN_SLOT_H / this.coinIcon.height) * 1.6,
    )
    this.coinIcon.setScale(scale)
  }

  private onRunStarted(): void {
    this.coinCounter.setText("0")
    this.updateCoinIcon(0)
    this.resizeBg()
    this.currentCoins = 0
    this.timeRemaining = gameTime
    this.timerActive = true
    this.timerText.setText(this.formatTime(gameTime))
    this.timerText.setColor("#ffffff")
    this.resizeTimerBg()
    this.setButtonsEnabled(true)
  }

  private onRunPaused(): void {
    this.timerActive = false
    this.setButtonsEnabled(false)
  }

  private setButtonsEnabled(enabled: boolean): void {
    if (enabled) {
      this.musicBtn.setInteractive({ useHandCursor: true })
      this.sfxBtn.setInteractive({ useHandCursor: true })
      this.bgArrowBtn.setInteractive({ useHandCursor: true })
    } else {
      this.musicBtn.disableInteractive()
      this.sfxBtn.disableInteractive()
      this.bgArrowBtn.disableInteractive()
    }
    const alpha = enabled ? 1 : 0.4
    this.musicBtn.setAlpha(alpha)
    this.sfxBtn.setAlpha(alpha)
    this.bgArrowBtn.setAlpha(alpha)
  }

  private onRunResumed(): void {
    if (this.timeRemaining > 0) this.timerActive = true
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
    this.currentCoins = totalCoins
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
    EventBus.off("RUN_PAUSED", this.onRunPaused, this)
    EventBus.off("RUN_RESUMED", this.onRunResumed, this)
  }
}
