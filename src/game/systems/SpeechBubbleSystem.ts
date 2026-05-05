import * as Phaser from "phaser"
import { EventBus } from "../EventBus"
import type { SwipeHitEvent } from "./SwipeSystem"

const PLAYER_X = 960
const PLAYER_Y = 440
const LERP_TO_PLAYER = 0.35

const BUBBLE_KEYS = [
  "speech_bubble_1",
  "speech_bubble_2",
  "speech_bubble_3",
  "speech_bubble_4",
] as const

const BUBBLE_DISPLAY_MS = 500
const BUBBLE_W = 278
const BUBBLE_H = 184

export class SpeechBubbleSystem {
  private readonly scene: Phaser.Scene
  private hitCount = 0
  private hitTarget: number
  private bubble?: Phaser.GameObjects.Image
  private hideTimer?: Phaser.Time.TimerEvent

  constructor(scene: Phaser.Scene) {
    this.scene = scene
    this.hitTarget = this.nextTarget()
    scene.events.on("swipe:hit", this.onSwipeHit, this)
    EventBus.on("RUN_STARTED", this.reset, this)
  }

  private nextTarget(): number {
    return Phaser.Math.Between(2, 6)
  }

  private reset(): void {
    this.hitCount = 0
    this.hitTarget = this.nextTarget()
    this.hideTimer?.remove()
    this.bubble?.destroy()
    this.bubble = undefined
    this.hideTimer = undefined
  }

  private onSwipeHit(e: SwipeHitEvent): void {
    if (!e.didHit) return
    this.hitCount++
    if (this.hitCount >= this.hitTarget) {
      this.showBubble(e.startX, e.startY, e.direction.x)
      this.hitCount = 0
      this.hitTarget = this.nextTarget()
    }
  }

  private showBubble(x: number, y: number, directionX: number): void {
    this.hideTimer?.remove()
    this.bubble?.destroy()

    const key = BUBBLE_KEYS[Phaser.Math.Between(0, BUBBLE_KEYS.length - 1)]
    const angleDeg = Phaser.Math.Between(10, 40)
    const rotation = directionX < 0 ? angleDeg : -angleDeg

    const bx = x + (PLAYER_X - x) * LERP_TO_PLAYER
    const by = y + (PLAYER_Y - y) * LERP_TO_PLAYER

    this.bubble = this.scene.add
      .image(bx, by, key)
      .setDisplaySize(BUBBLE_W, BUBBLE_H)
      .setAngle(rotation)
      .setDepth(200)

    this.hideTimer = this.scene.time.delayedCall(BUBBLE_DISPLAY_MS, () => {
      this.bubble?.destroy()
      this.bubble = undefined
      this.hideTimer = undefined
    })
  }

  destroy(): void {
    this.scene.events.off("swipe:hit", this.onSwipeHit, this)
    EventBus.off("RUN_STARTED", this.reset, this)
    this.hideTimer?.remove()
    this.bubble?.destroy()
  }
}
