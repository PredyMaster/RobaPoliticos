import Phaser from 'phaser'
import type { CoinTypeId } from '../types/game'

// Stub — real sound loading and playback wired in Phase 16.
export class AudioSystem {
  private readonly scene: Phaser.Scene
  private musicEnabled: boolean
  private sfxEnabled: boolean
  private unlocked = false

  constructor(scene: Phaser.Scene, musicEnabled: boolean, sfxEnabled: boolean) {
    this.scene        = scene
    this.musicEnabled = musicEnabled
    this.sfxEnabled   = sfxEnabled
    scene.input.once('pointerdown', this.unlock, this)
  }

  setMusicEnabled(value: boolean): void { this.musicEnabled = value }
  setSfxEnabled(value: boolean): void   { this.sfxEnabled   = value }

  playHit(isCritical: boolean): void {
    if (!this.sfxEnabled || !this.unlocked) return
    void isCritical  // Phase 16: play sfx_hit_* per equipped weapon
  }

  playCoinCollect(type: CoinTypeId): void {
    if (!this.sfxEnabled || !this.unlocked) return
    void type  // Phase 16: play coin collect sound
  }

  playCombo(level: number): void {
    if (!this.sfxEnabled || !this.unlocked) return
    void level  // Phase 16: play combo stinger
  }

  playPurchase(): void {
    if (!this.sfxEnabled || !this.unlocked) return
    // Phase 16: play purchase sound
  }

  playMusic(): void {
    if (!this.musicEnabled) return
    // Phase 16: start background music loop
  }

  stopMusic(): void {
    // Phase 16: fade out and stop music
  }

  private unlock(): void {
    this.unlocked = true
    this.playMusic()
  }

  destroy(): void {
    this.stopMusic()
    this.scene.input.off('pointerdown', this.unlock, this)
  }
}
