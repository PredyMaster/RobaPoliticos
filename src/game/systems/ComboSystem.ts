import * as Phaser from 'phaser'
import type { ComboState } from '../types/game'
import { comboMultiplier } from '../utils/math'
import { EventBus } from '../EventBus'
import type { SwipeHitEvent } from './SwipeSystem'

const COMBO_WINDOW_MS  = 1500
const FEVER_DURATION_MS = 8000

export class ComboSystem {
  private readonly scene: Phaser.Scene
  private state: ComboState = { count: 0, multiplier: 1, lastHitTime: 0, active: false }
  private resetTimer:  Phaser.Time.TimerEvent | null = null
  private feverTimer:  Phaser.Time.TimerEvent | null = null
  private feverActive  = false

  /** Set by ComboSystem at x10 milestone; consumed by SwipeSystem or CoinSpawnSystem */
  guaranteedCritical = false

  constructor(scene: Phaser.Scene) {
    this.scene = scene
    scene.events.on('swipe:hit', this.onSwipeHit, this)
  }

  getState(): Readonly<ComboState> { return this.state }
  isFeverActive(): boolean         { return this.feverActive }

  private onSwipeHit(_e: SwipeHitEvent): void {
    const now   = this.scene.time.now
    const count = this.state.count + 1
    this.state  = { count, multiplier: comboMultiplier(count), lastHitTime: now, active: count >= 2 }

    // Reschedule reset window
    this.resetTimer?.remove()
    this.resetTimer = this.scene.time.delayedCall(COMBO_WINDOW_MS, this.doReset, [], this)

    this.checkMilestones(count)

    EventBus.emit('COMBO_UPDATED', this.state)
    this.scene.events.emit('combo:changed', this.state)
  }

  private checkMilestones(count: number): void {
    if (count === 10) this.guaranteedCritical = true
    if (count === 20 && !this.feverActive) this.startFever()
    if (count === 50) this.scene.events.emit('fever:rain')
  }

  private startFever(): void {
    this.feverActive = true
    this.scene.events.emit('fever:start')
    this.feverTimer?.remove()
    this.feverTimer = this.scene.time.delayedCall(FEVER_DURATION_MS, () => {
      this.feverActive = false
      this.scene.events.emit('fever:end')
    })
  }

  private doReset(): void {
    this.feverActive = false
    this.feverTimer?.remove()
    this.state = { count: 0, multiplier: 1, lastHitTime: this.state.lastHitTime, active: false }
    EventBus.emit('COMBO_UPDATED', this.state)
    this.scene.events.emit('combo:changed', this.state)
  }

  reset(): void {
    this.resetTimer?.remove()
    this.feverTimer?.remove()
    this.guaranteedCritical = false
    this.doReset()
  }

  destroy(): void {
    this.scene.events.off('swipe:hit', this.onSwipeHit, this)
    this.reset()
  }
}
