import Phaser from 'phaser'
import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics'
import type { ComboState } from '../types/game'
import type { SwipeHitEvent } from './SwipeSystem'

const COMBO_MILESTONES = new Set([5, 10, 20, 50])

type PlayerHitEvent = { isCritical: boolean }

export class HapticsSystem {
  private readonly scene: Phaser.Scene
  private enabled: boolean

  constructor(scene: Phaser.Scene, enabled: boolean) {
    this.scene   = scene
    this.enabled = enabled
    scene.events.on('swipe:hit',     this.onSwipeHit,    this)
    scene.events.on('player:hit',    this.onPlayerHit,   this)
    scene.events.on('combo:changed', this.onComboChanged, this)
  }

  setEnabled(value: boolean): void { this.enabled = value }

  private onSwipeHit(e: SwipeHitEvent): void {
    if (!this.enabled) return
    void Haptics.impact({ style: e.isCritical ? ImpactStyle.Medium : ImpactStyle.Light })
  }

  private onPlayerHit(e: PlayerHitEvent): void {
    if (!this.enabled) return
    void Haptics.impact({ style: e.isCritical ? ImpactStyle.Heavy : ImpactStyle.Medium })
  }

  private onComboChanged(combo: ComboState): void {
    if (!this.enabled || !COMBO_MILESTONES.has(combo.count)) return
    void Haptics.notification({ type: NotificationType.Success })
  }

  destroy(): void {
    this.scene.events.off('swipe:hit',     this.onSwipeHit,    this)
    this.scene.events.off('player:hit',    this.onPlayerHit,   this)
    this.scene.events.off('combo:changed', this.onComboChanged, this)
  }
}
