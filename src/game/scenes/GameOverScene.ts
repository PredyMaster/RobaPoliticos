import * as Phaser from "phaser"
import { EventBus } from "../EventBus"
import { useInventoryStore } from "../../store/useInventoryStore"
import { usePlayerStore } from "../../store/usePlayerStore"

export class GameOverScene extends Phaser.Scene {
  private overlay!: Phaser.GameObjects.Graphics
  private titleText!: Phaser.GameObjects.Text
  private coinsText!: Phaser.GameObjects.Text
  private buttonLabel!: Phaser.GameObjects.Text
  private buttonBg!: Phaser.GameObjects.Graphics
  private buttonHitArea!: Phaser.GameObjects.Zone
  private coins = 0
  private isRestarting = false

  constructor() {
    super({ key: "GameOverScene" })
  }

  create(data: { coins: number }): void {
    this.isRestarting = false
    this.coins = data?.coins ?? 0

    this.overlay = this.add.graphics().setDepth(200)

    this.titleText = this.add.text(0, 0, "¡Tiempo agotado!", {
      fontSize: "100px",
      color: "#ffffff",
      fontStyle: "bold",
      stroke: "#000000",
      strokeThickness: 8,
    })
      .setOrigin(0.5)
      .setDepth(201)

    this.coinsText = this.add.text(0, 0, `Has conseguido ${this.coins} monedas`, {
      fontSize: "76px",
      color: "#f4c542",
      fontStyle: "bold",
      stroke: "#000000",
      strokeThickness: 7,
    })
      .setOrigin(0.5)
      .setDepth(201)

    this.buttonLabel = this.add.text(0, 0, "Jugar otra vez", {
      fontSize: "72px",
      color: "#ffffff",
      fontStyle: "bold",
      stroke: "#000000",
      strokeThickness: 7,
    })
      .setOrigin(0.5)
      .setDepth(202)

    this.buttonBg = this.add.graphics().setDepth(201)

    this.buttonHitArea = this.add.zone(0, 0, 1, 1)
      .setDepth(203)
      .setInteractive({ useHandCursor: true })
      .on("pointerover", () => this.renderButton(true))
      .on("pointerout", () => this.renderButton(false))
      .on("pointerdown", () => void this.onPlayAgain())

    this.scale.on(Phaser.Scale.Events.RESIZE, this.handleResize, this)
    this.handleResize()
  }

  private async onPlayAgain(): Promise<void> {
    if (this.isRestarting) return
    this.isRestarting = true
    this.buttonHitArea.disableInteractive()
    this.buttonLabel.setText("Reiniciando...")
    this.renderButton(false)

    await usePlayerStore.getState().resetRunState()

    const session = usePlayerStore.getState().session
    if (session) {
      await useInventoryStore.getState().loadInventory(session.userId)
    }

    const equipment = useInventoryStore.getState().equipment
    const weaponId = equipment?.equippedWeaponId ?? "tree_branch"
    const handId = equipment?.equippedHandId ?? "bare_hand"
    const boxId = equipment?.equippedBoxId ?? "basic_box"

    this.game.registry.set("equippedWeaponId", weaponId)
    this.game.registry.set("equippedHandId", handId)
    this.game.registry.set("equippedBoxId", boxId)
    EventBus.emit("EQUIPMENT_UPDATED", { weaponId, handId, boxId })
    EventBus.emit("RUN_STARTED")
    this.scene.stop()
  }

  private renderButton(hover: boolean): void {
    const padX = 50
    const padY = 24
    const bw = this.buttonLabel.width + padX * 2
    const bh = this.buttonLabel.height + padY * 2
    const bx = this.buttonLabel.x - bw / 2
    const by = this.buttonLabel.y - bh / 2

    this.buttonBg.clear()
    this.buttonBg.fillStyle(hover ? 0x2ecc71 : 0x27ae60, 1)
    this.buttonBg.fillRoundedRect(bx, by, bw, bh, 18)
    this.buttonHitArea.setSize(bw + 20, bh + 20)
    this.buttonHitArea.setPosition(this.buttonLabel.x, this.buttonLabel.y)
  }

  private handleResize(): void {
    const viewport = this.scale.getViewPort(this.cameras.main)
    const centerX = viewport.centerX
    const titleY = viewport.y + viewport.height * 0.28
    const coinsY = viewport.y + viewport.height * 0.46
    const buttonY = viewport.y + viewport.height * 0.65

    this.overlay.clear()
    this.overlay.fillStyle(0x000000, 0.82)
    this.overlay.fillRect(viewport.x, viewport.y, viewport.width, viewport.height)

    this.titleText.setPosition(centerX, titleY)
    this.coinsText.setPosition(centerX, coinsY)
    this.buttonLabel.setPosition(centerX, buttonY)
    this.renderButton(false)
  }

  shutdown(): void {
    this.scale.off(Phaser.Scale.Events.RESIZE, this.handleResize, this)
  }
}
