import * as Phaser from "phaser"
import { EventBus } from "../EventBus"

const W = 1920
const H = 1080

export class GameOverScene extends Phaser.Scene {
  constructor() {
    super({ key: "GameOverScene" })
  }

  create(data: { coins: number }): void {
    const coins = data?.coins ?? 0

    // Overlay oscuro
    this.add.graphics()
      .fillStyle(0x000000, 0.82)
      .fillRect(0, 0, W, H)
      .setDepth(200)

    // Título
    this.add.text(W / 2, H * 0.28, "¡Tiempo agotado!", {
      fontSize: "100px",
      color: "#ffffff",
      fontStyle: "bold",
      stroke: "#000000",
      strokeThickness: 8,
    })
      .setOrigin(0.5)
      .setDepth(201)

    // Monedas conseguidas
    this.add.text(W / 2, H * 0.46, `Has conseguido ${coins} monedas`, {
      fontSize: "76px",
      color: "#f4c542",
      fontStyle: "bold",
      stroke: "#000000",
      strokeThickness: 7,
    })
      .setOrigin(0.5)
      .setDepth(201)

    // Botón "Jugar otra vez"
    const btnCY = H * 0.65
    const btnLabel = this.add.text(W / 2, btnCY, "Jugar otra vez", {
      fontSize: "72px",
      color: "#ffffff",
      fontStyle: "bold",
      stroke: "#000000",
      strokeThickness: 7,
    })
      .setOrigin(0.5)
      .setDepth(202)

    const padX = 50
    const padY = 24
    const bw = btnLabel.width + padX * 2
    const bh = btnLabel.height + padY * 2
    const bx = W / 2 - bw / 2
    const by = btnCY - bh / 2

    const btnBg = this.add.graphics().setDepth(201)
    const renderBtn = (hover: boolean): void => {
      btnBg.clear()
      btnBg.fillStyle(hover ? 0x2ecc71 : 0x27ae60, 1)
      btnBg.fillRoundedRect(bx, by, bw, bh, 18)
    }
    renderBtn(false)

    // Zona interactiva cubre todo el área del botón
    this.add.zone(W / 2, btnCY, bw + 20, bh + 20)
      .setDepth(203)
      .setInteractive({ useHandCursor: true })
      .on("pointerover", () => renderBtn(true))
      .on("pointerout", () => renderBtn(false))
      .on("pointerdown", () => this.onPlayAgain())
  }

  private onPlayAgain(): void {
    EventBus.emit("RUN_STARTED")
    this.scene.stop()
  }

  shutdown(): void {}
}
