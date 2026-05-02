import * as Phaser from 'phaser'
import type { ComboState, RunResult } from '../types/game'
import type { ScoreSystem } from './ScoreSystem'
import type { CollisionSystem } from './CollisionSystem'
import { EventBus } from '../EventBus'
import type { SwipeHitEvent } from './SwipeSystem'

export class EconomySystem {
  private readonly scene: Phaser.Scene
  private readonly score: ScoreSystem
  private readonly collision: CollisionSystem
  private weaponId: string
  private handId: string
  private boxId: string
  private startTime    = 0
  private hits         = 0
  private criticalHits = 0
  private maxCombo     = 0

  constructor(
    scene: Phaser.Scene,
    score: ScoreSystem,
    collision: CollisionSystem,
    weaponId: string,
    handId: string,
    boxId: string,
  ) {
    this.scene     = scene
    this.score     = score
    this.collision = collision
    this.weaponId  = weaponId
    this.handId    = handId
    this.boxId     = boxId
    scene.events.on('swipe:hit',    this.onSwipeHit,    this)
    scene.events.on('combo:changed', this.onComboChanged, this)
  }

  setEquipment(weaponId: string, handId: string, boxId: string): void {
    this.weaponId = weaponId
    this.handId = handId
    this.boxId = boxId
  }

  startTracking(): void {
    this.startTime    = Date.now()
    this.hits         = 0
    this.criticalHits = 0
    this.maxCombo     = 0
    this.score.reset()
    this.collision.resetStats()
  }

  compileResult(): RunResult {
    const { collected, lost } = this.collision.getStats()
    return {
      scoreGained:      this.score.getScore(),
      coinsCollected:   collected,
      coinsLost:        lost,
      hits:             this.hits,
      criticalHits:     this.criticalHits,
      maxCombo:         this.maxCombo,
      durationSeconds:  Math.round((Date.now() - this.startTime) / 1000),
      equippedWeaponId: this.weaponId,
      equippedHandId:   this.handId,
      equippedBoxId:    this.boxId,
    }
  }

  finalizeRun(): void {
    EventBus.emit('RUN_ENDED', this.compileResult())
  }

  private onSwipeHit(e: SwipeHitEvent): void {
    if (!e.didHit) return
    this.hits++
    if (e.isCritical) this.criticalHits++
  }

  private onComboChanged(combo: ComboState): void {
    if (combo.count > this.maxCombo) this.maxCombo = combo.count
  }

  destroy(): void {
    this.scene.events.off('swipe:hit',    this.onSwipeHit,    this)
    this.scene.events.off('combo:changed', this.onComboChanged, this)
  }
}
