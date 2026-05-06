import * as Phaser from "phaser"
import { EventBus } from "../EventBus"
import type { ComboState } from "../types/game"
import { SHOP_BOXES, SHOP_HANDS, SHOP_WEAPONS } from "../data/shopCatalog"
import { useGameStore } from "../../store/useGameStore"
import { useInventoryStore } from "../../store/useInventoryStore"
import { usePlayerStore } from "../../store/usePlayerStore"

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
const SHOP_BTN_GAP = 22
const SHOP_BTN_W = 300
const SHOP_BTN_H = 110

const gameTime = 300 // 5 minutos en segundos

export class UIScene extends Phaser.Scene {
  private comboFlash!: Phaser.GameObjects.Text
  private coinCounter!: Phaser.GameObjects.Text
  private coinBg!: Phaser.GameObjects.Graphics
  private coinIcon!: Phaser.GameObjects.Image

  private timerBg!: Phaser.GameObjects.Graphics
  private timerText!: Phaser.GameObjects.Text
  private panelX = COIN_BG_X
  private panelY = COIN_BG_Y
  private timerBgY = 0
  private timeRemaining = gameTime
  private timerActive = false
  private runStarted = false
  private speedBoost1Triggered = false
  private speedBoost2Triggered = false
  private runCoinsCollected = 0
  private comboBaseY = 300
  private shopButton!: Phaser.GameObjects.Container
  private shopButtonHitArea!: Phaser.GameObjects.Zone

  private musicEnabled = true
  private sfxEnabled = true

  private musicBtn!: Phaser.GameObjects.Image
  private sfxBtn!: Phaser.GameObjects.Image
  private bgArrowBtn!: Phaser.GameObjects.Image

  private x2Label: Phaser.GameObjects.Text | null = null
  private x2Tween: Phaser.Tweens.Tween | null = null

  private arrowUpImage: Phaser.GameObjects.Image | null = null
  private arrowUpChain: Phaser.Tweens.TweenChain | null = null
  private arrowUpBaseY = 0
  private inventoryUnsub: (() => void) | null = null

  private uiScale = 1
  private effShopBtnW = SHOP_BTN_W
  private effShopBtnH = SHOP_BTN_H
  private effBtnH = BTN_H

  constructor() {
    super({ key: "UIScene", active: false })
  }

  create(): void {
    this.uiScale = this.sys.game.device.os.desktop ? 0.5 : 1
    const s = this.uiScale
    this.effShopBtnW = Math.round(SHOP_BTN_W * s)
    this.effShopBtnH = Math.round(SHOP_BTN_H * s)
    this.effBtnH = Math.round(BTN_H * s)

    // Fondo semitransparente para el contador (esquinas redondeadas via Graphics)
    this.coinBg = this.add.graphics().setDepth(99)

    // Número de monedas (sin prefijo de texto)
    const textX = COIN_BG_X + COIN_PAD_X + COIN_SLOT_W + COIN_GAP
    this.coinCounter = this.add
      .text(textX, COIN_BG_Y + COIN_PAD_Y, "0", {
        fontSize: `${Math.round(72 * this.uiScale)}px`,
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
        COIN_BG_X + this.effShopBtnW / 2,
        this.timerBgY + COIN_PAD_Y,
        this.formatTime(gameTime),
        {
          fontSize: `${Math.round(72 * this.uiScale)}px`,
          color: "#ffffff",
          fontStyle: "bold",
          stroke: "#000000",
          strokeThickness: 7,
        },
      )
      .setOrigin(0.5, 0)
      .setDepth(100)

    this.resizeTimerBg()
    this.createShopButton()
    this.createArrowUp()

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
    this.scale.on(Phaser.Scale.Events.RESIZE, this.handleResize, this)

    EventBus.on("COMBO_UPDATED", this.onComboUpdated, this)
    EventBus.on("RUN_SCORE_UPDATED", this.onScoreUpdated, this)
    EventBus.on("WALLET_UPDATED", this.onWalletUpdated, this)
    EventBus.on("RUN_STARTED", this.onRunStarted, this)
    EventBus.on("RUN_PAUSED", this.onRunPaused, this)
    EventBus.on("RUN_RESUMED", this.onRunResumed, this)
    EventBus.on("BONUS_BOX_CATCH", this.onBonusCatch, this)

    const { isPaused } = useGameStore.getState()
    const walletCoins = usePlayerStore.getState().wallet?.currentCoins ?? 0
    if (!isPaused) {
      EventBus.emit("RUN_STARTED")
    } else {
      this.runStarted = true
      this.timerActive = false
      this.onWalletUpdated({ currentCoins: walletCoins })
      this.setShopButtonEnabled(false)
    }
    this.handleResize()
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

    if (!this.speedBoost1Triggered && ratio <= 0.67) {
      this.speedBoost1Triggered = true
      EventBus.emit("BOX_SPEED_BOOST", 1)
    }
    if (!this.speedBoost2Triggered && ratio <= 0.34) {
      this.speedBoost2Triggered = true
      EventBus.emit("BOX_SPEED_BOOST", 2)
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
    const s = this.uiScale
    const w = this.effShopBtnW
    const h = this.timerText.height + COIN_PAD_Y * 2 * s
    this.timerBg.clear()
    this.timerBg.fillStyle(0x000000, 0.55)
    this.timerBg.fillRoundedRect(this.panelX, this.timerBgY, w, h, 14)
  }

  private onTimeUp(): void {
    this.runStarted = false
    EventBus.emit("RUN_PAUSED")
    this.scene.launch("GameOverScene", { coins: this.runCoinsCollected })
  }

  private createShopButton(): void {
    const s = this.uiScale
    const w = this.effShopBtnW
    const h = this.effShopBtnH
    const buttonY =
      this.timerBgY +
      this.timerText.height +
      COIN_PAD_Y * 2 * s +
      SHOP_BTN_GAP * s

    const bg = this.add.graphics()
    bg.fillStyle(0xf4c542, 1)
    bg.lineStyle(Math.max(1, 5 * s), 0xc49b10, 1)
    bg.fillRoundedRect(0, 0, w, h, Math.round(24 * s))
    bg.strokeRoundedRect(0, 0, w, h, Math.round(24 * s))

    const label = this.add
      .text(w / 2, h / 2, "Tienda", {
        fontSize: `${Math.round(44 * s)}px`,
        color: "#1a1a2e",
        fontStyle: "bold",
        stroke: "#fff4bf",
        strokeThickness: 2,
      })
      .setOrigin(0.5)

    this.shopButton = this.add
      .container(COIN_BG_X, buttonY, [bg, label])
      .setDepth(100)

    this.shopButtonHitArea = this.add
      .zone(COIN_BG_X + w / 2, buttonY + h / 2, w, h)
      .setDepth(101)
      .setInteractive({ useHandCursor: true })

    this.shopButtonHitArea.on("pointerdown", () => {
      if (!this.runStarted || !this.timerActive || this.timeRemaining <= 0) {
        return
      }
      EventBus.emit("RUN_PAUSED")
      useGameStore.getState().openShop()
      EventBus.emit("OPEN_SHOP")
    })
  }

  private createArrowUp(): void {
    const s = this.uiScale
    const arrowSize = Math.round(120 * s)
    const arrowX = this.panelX + this.effShopBtnW / 2
    const arrowY = this.computeArrowBaseY()
    this.arrowUpBaseY = arrowY

    this.arrowUpImage = this.add
      .image(arrowX, arrowY, "arrow_up")
      .setDisplaySize(arrowSize, arrowSize)
      .setDepth(101)
      .setVisible(false)

    this.inventoryUnsub = useInventoryStore.subscribe(() => {
      this.updateArrowVisibility()
    })

    this.updateArrowVisibility()
  }

  private computeArrowBaseY(): number {
    const s = this.uiScale
    const buttonY =
      this.timerBgY +
      this.timerText.height +
      COIN_PAD_Y * 2 * s +
      SHOP_BTN_GAP * s
    return buttonY + this.effShopBtnH + Math.round(45 * s)
  }

  private canAffordAnyUnownedItem(): boolean {
    const { items } = useInventoryStore.getState()
    const coins = usePlayerStore.getState().wallet?.currentCoins ?? 0
    const ownedSet = new Set(items.map((i) => `${i.itemType}:${i.itemId}`))
    const allItems = [...SHOP_WEAPONS, ...SHOP_HANDS, ...SHOP_BOXES]
    return allItems.some(
      (item) =>
        item.price > 0 &&
        !ownedSet.has(`${item.category}:${item.id}`) &&
        coins >= item.price,
    )
  }

  private updateArrowVisibility(): void {
    if (!this.arrowUpImage) return
    const show = this.canAffordAnyUnownedItem()
    if (show && !this.arrowUpImage.visible) {
      this.arrowUpImage.setVisible(true)
      this.startArrowBounce()
    } else if (!show && this.arrowUpImage.visible) {
      this.arrowUpImage.setVisible(false)
      this.stopArrowBounce()
    }
  }

  private startArrowBounce(): void {
    this.stopArrowBounce()
    if (!this.arrowUpImage) return
    const s = this.uiScale
    const base = this.arrowUpBaseY
    this.arrowUpImage.setY(base)
    this.arrowUpChain = this.tweens.chain({
      targets: this.arrowUpImage,
      tweens: [
        { y: base, duration: 1520 },
        {
          y: base - Math.round(6 * s) - 10,
          duration: 200,
          ease: "Sine.easeOut",
        },
        { y: base, duration: 210, ease: "Sine.easeIn" },
        { y: base - Math.round(2 * s), duration: 100, ease: "Sine.easeOut" },
        { y: base, duration: 420, ease: "Sine.easeIn" },
      ],
      loop: -1,
    })
  }

  private stopArrowBounce(): void {
    if (this.arrowUpChain) {
      this.arrowUpChain.stop()
      this.arrowUpChain = null
    }
  }

  private createAudioButtons(): void {
    const x = 1920 - (MARGIN - 90) - BTN_W / 2
    const y1 = MARGIN + BTN_H / 2
    const y2 = y1 + BTN_H + 30
    const y3 = y2 + BTN_H + 30

    this.musicBtn = this.add
      .image(x, y1, this.musicEnabled ? "music_on" : "music_off")
      .setDisplaySize(this.effBtnH, this.effBtnH)
      .setInteractive({ useHandCursor: true })
      .setDepth(100)

    this.musicBtn.on("pointerdown", () => {
      this.musicEnabled = !this.musicEnabled
      this.refreshMusicBtn()
      EventBus.emit("TOGGLE_MUSIC", this.musicEnabled)
    })

    this.sfxBtn = this.add
      .image(x, y2, this.sfxEnabled ? "sound_on" : "sound_off")
      .setDisplaySize(this.effBtnH, this.effBtnH)
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
      .setDisplaySize(this.effBtnH, this.effBtnH)
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
    const s = this.uiScale
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
      ((COIN_SLOT_W * s) / this.coinIcon.width) * 1.2,
      ((COIN_SLOT_H * s) / this.coinIcon.height) * 1.2,
    )
    this.coinIcon.setScale(scale)
  }

  private onRunStarted(): void {
    this.runStarted = true
    this.runCoinsCollected = 0
    this.onWalletUpdated({
      currentCoins: usePlayerStore.getState().wallet?.currentCoins ?? 0,
    })
    this.timeRemaining = gameTime
    this.timerActive = true
    this.speedBoost1Triggered = false
    this.speedBoost2Triggered = false
    this.timerText.setText(this.formatTime(gameTime))
    this.timerText.setColor("#ffffff")
    this.resizeTimerBg()
    this.setShopButtonEnabled(true)
  }

  private onRunPaused(): void {
    this.timerActive = false
    this.setShopButtonEnabled(false)
  }

  private setShopButtonEnabled(enabled: boolean): void {
    if (enabled) {
      this.shopButtonHitArea.setInteractive({ useHandCursor: true })
    } else {
      this.shopButtonHitArea.disableInteractive()
    }
    this.shopButton.setAlpha(enabled ? 1 : 0.4)
    this.shopButton.setScale(1)
  }

  private onRunResumed(): void {
    if (this.timeRemaining > 0) {
      this.timerActive = true
      if (this.runStarted) this.setShopButtonEnabled(true)
    }
  }

  private onScoreUpdated({
    totalCoins,
  }: {
    runScore: number
    totalCoins: number
  }): void {
    this.runCoinsCollected = totalCoins
  }

  private onWalletUpdated({ currentCoins }: { currentCoins: number }): void {
    this.coinCounter.setText(`${currentCoins}`)
    this.updateCoinIcon(currentCoins)
    this.resizeBg()
    this.updateArrowVisibility()
  }

  private resizeBg(): void {
    const s = this.uiScale
    const w =
      (COIN_PAD_X + COIN_SLOT_W + COIN_GAP + COIN_PAD_X) * s +
      this.coinCounter.width
    const h = this.coinCounter.height + COIN_PAD_Y * 2 * s
    this.coinBg.clear()
    this.coinBg.fillStyle(0x000000, 0.55)
    this.coinBg.fillRoundedRect(this.panelX, this.panelY, w, h, 14)
  }

  private onBonusCatch({ x, y }: { x: number; y: number }): void {
    this.showX2Text(x, y)
    this.flashCoinCounter()
  }

  private showX2Text(x: number, y: number): void {
    if (this.x2Tween) {
      this.x2Tween.stop()
      this.x2Tween = null
    }
    if (this.x2Label) {
      this.x2Label.destroy()
      this.x2Label = null
    }

    this.x2Label = this.add
      .text(x, y + 70, "x2", {
        fontSize: "80px",
        color: "#00dd44",
        fontStyle: "bold",
        stroke: "#000000",
        strokeThickness: 10,
      })
      .setOrigin(0.5)
      .setDepth(200)

    this.x2Tween = this.tweens.add({
      targets: this.x2Label,
      alpha: 0,
      delay: 500,
      duration: 50,
      ease: "Linear",
      onComplete: () => {
        this.x2Label?.destroy()
        this.x2Label = null
        this.x2Tween = null
      },
    })
  }

  private flashCoinCounter(): void {
    this.coinCounter.setColor("#00dd44")
    this.time.delayedCall(300, () => {
      this.coinCounter.setColor("#ffffff")
    })
  }

  private onComboUpdated(combo: ComboState): void {
    const milestones = [2, 5, 10, 20, 50]
    if (!milestones.includes(combo.count)) return

    this.comboFlash.setText(`×${combo.multiplier.toFixed(1)} COMBO!`)
    this.comboFlash.setAlpha(1)

    this.tweens.add({
      targets: this.comboFlash,
      alpha: 0,
      y: this.comboBaseY - 60,
      duration: 900,
      ease: "Power2",
      onComplete: () => {
        this.comboFlash.setY(this.comboBaseY)
      },
    })
  }

  private handleResize(): void {
    const viewport = this.scale.getViewPort(this.cameras.main)
    const left = viewport.x
    const right = viewport.right
    const top = viewport.y
    const s = this.uiScale

    this.panelX = left + COIN_BG_X
    this.panelY = top + COIN_BG_Y
    const textX = this.panelX + (COIN_PAD_X + COIN_SLOT_W + COIN_GAP) * s

    this.coinCounter.setPosition(textX, this.panelY + COIN_PAD_Y * s)
    this.coinIcon.setPosition(
      this.panelX + (COIN_PAD_X + COIN_SLOT_W / 2) * s,
      this.panelY + COIN_PAD_Y * s + this.coinCounter.height / 2,
    )

    this.timerBgY =
      this.panelY + this.coinCounter.height + COIN_PAD_Y * 2 * s + TIMER_GAP * s
    this.timerText.setPosition(
      this.panelX + this.effShopBtnW / 2,
      this.timerBgY + COIN_PAD_Y * s,
    )

    const buttonY =
      this.timerBgY +
      this.timerText.height +
      COIN_PAD_Y * 2 * s +
      SHOP_BTN_GAP * s
    this.shopButton.setPosition(this.panelX, buttonY)
    this.shopButtonHitArea.setPosition(
      this.panelX + this.effShopBtnW / 2,
      buttonY + this.effShopBtnH / 2,
    )

    if (this.arrowUpImage) {
      const newBase = this.computeArrowBaseY()
      this.arrowUpBaseY = newBase
      this.arrowUpImage.setX(this.panelX + this.effShopBtnW / 2)
      this.arrowUpImage.setY(newBase)
      if (this.arrowUpImage.visible) this.startArrowBounce()
    }

    const effBtnW = Math.round(BTN_W * s)
    const buttonX = right - (MARGIN - 90) - effBtnW / 2
    const y1 = top + MARGIN + this.effBtnH / 2
    const y2 = y1 + this.effBtnH + 30 * s
    const y3 = y2 + this.effBtnH + 30 * s

    this.musicBtn.setPosition(buttonX, y1)
    this.sfxBtn.setPosition(buttonX, y2)
    this.bgArrowBtn.setPosition(buttonX, y3)
    this.comboBaseY = top + 300
    this.comboFlash.setPosition(viewport.centerX, this.comboBaseY)

    this.resizeBg()
    this.resizeTimerBg()
  }

  shutdown(): void {
    this.stopArrowBounce()
    if (this.inventoryUnsub) {
      this.inventoryUnsub()
      this.inventoryUnsub = null
    }
    this.scale.off(Phaser.Scale.Events.RESIZE, this.handleResize, this)
    EventBus.off("COMBO_UPDATED", this.onComboUpdated, this)
    EventBus.off("RUN_SCORE_UPDATED", this.onScoreUpdated, this)
    EventBus.off("WALLET_UPDATED", this.onWalletUpdated, this)
    EventBus.off("RUN_STARTED", this.onRunStarted, this)
    EventBus.off("RUN_PAUSED", this.onRunPaused, this)
    EventBus.off("RUN_RESUMED", this.onRunResumed, this)
    EventBus.off("BONUS_BOX_CATCH", this.onBonusCatch, this)
  }
}
