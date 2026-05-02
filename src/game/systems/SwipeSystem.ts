import * as Phaser from 'phaser'
import type { PlayerCharacter } from '../entities/PlayerCharacter'
import type { CombatLoadout } from '../types/game'
import { swipeStrength, normalize } from '../utils/math'
import { randomBool } from '../utils/random'

const MIN_DISTANCE_PX = 40
const MIN_DURATION_MS = 40

export type SwipeHitEvent = {
  direction: { x: number; y: number }
  strength: number
  didHit: boolean
  isCritical: boolean
  startX: number
  startY: number
}

export class SwipeSystem {
  private readonly scene: Phaser.Scene
  private readonly player: PlayerCharacter
  private loadout: CombatLoadout
  private lastHitMs = -Infinity
  private downX = 0
  private downY = 0
  private downTime = 0
  private tracking = false

  constructor(scene: Phaser.Scene, player: PlayerCharacter, loadout: CombatLoadout) {
    this.scene = scene
    this.player = player
    this.loadout = loadout
    scene.input.on('pointerdown', this.onDown, this)
    scene.input.on('pointerup',   this.onUp,   this)
  }

  setLoadout(loadout: CombatLoadout): void {
    this.loadout = loadout
  }

  private onDown(pointer: Phaser.Input.Pointer): void {
    this.tracking = true
    this.downX    = pointer.x
    this.downY    = pointer.y
    this.downTime = pointer.time
  }

  private onUp(pointer: Phaser.Input.Pointer): void {
    if (!this.tracking) return
    this.tracking = false

    if (!Phaser.Geom.Rectangle.ContainsPoint(
      this.player.hitZone,
      new Phaser.Math.Vector2(this.downX, this.downY),
    )) return

    const dx       = pointer.x - this.downX
    const dy       = pointer.y - this.downY
    const distance = Math.sqrt(dx * dx + dy * dy)
    const duration = pointer.time - this.downTime

    if (distance < MIN_DISTANCE_PX || duration < MIN_DURATION_MS) return

    const nowMs = pointer.time
    if (nowMs - this.lastHitMs < this.loadout.cooldown * 1000) return
    this.lastHitMs = nowMs

    const speed    = distance / Math.max(duration, 1)
    const strength = swipeStrength(speed, distance)
    const dir      = normalize(dx, dy)
    const didHit = randomBool(this.loadout.successChance)
    const isCritical =
      didHit && randomBool(this.loadout.criticalChance)

    const event: SwipeHitEvent = {
      direction: dir,
      strength,
      didHit,
      isCritical,
      startX: this.downX,
      startY: this.downY,
    }
    this.scene.events.emit('swipe:hit', event)
  }

  destroy(): void {
    this.scene.input.off('pointerdown', this.onDown, this)
    this.scene.input.off('pointerup',   this.onUp,   this)
  }
}
