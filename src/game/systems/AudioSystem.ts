import Phaser from 'phaser'
import type { CoinTypeId, ComboState } from '../types/game'
import type { SwipeHitEvent } from './SwipeSystem'

const RARE_COIN  = new Set<CoinTypeId>(['gold_coin', 'gem', 'money_bill'])
const COMBO_BEATS = new Set([5, 10, 20, 50])

type CoinCaughtEvent = { coinType: CoinTypeId }

export class AudioSystem {
  private readonly scene: Phaser.Scene
  private musicEnabled: boolean
  private sfxEnabled:   boolean
  private unlocked    = false

  private sfxHit!:      Phaser.Sound.BaseSound | null
  private sfxCrit!:     Phaser.Sound.BaseSound | null
  private sfxCoin!:     Phaser.Sound.BaseSound | null
  private sfxCoinRare!: Phaser.Sound.BaseSound | null
  private sfxCombo!:    Phaser.Sound.BaseSound | null
  private sfxPurchase!: Phaser.Sound.BaseSound | null

  constructor(scene: Phaser.Scene, musicEnabled: boolean, sfxEnabled: boolean) {
    this.scene        = scene
    this.musicEnabled = musicEnabled
    this.sfxEnabled   = sfxEnabled

    this.sfxHit      = this.tryAdd('sfx_hit',       { volume: 0.55 })
    this.sfxCrit     = this.tryAdd('sfx_crit',      { volume: 0.70 })
    this.sfxCoin     = this.tryAdd('sfx_coin',      { volume: 0.45 })
    this.sfxCoinRare = this.tryAdd('sfx_coin_rare', { volume: 0.55 })
    this.sfxCombo    = this.tryAdd('sfx_combo',     { volume: 0.60 })
    this.sfxPurchase = this.tryAdd('sfx_purchase',  { volume: 0.65 })

    scene.input.once('pointerdown',   this.unlock,         this)
    scene.events.on('swipe:hit',      this.onSwipeHit,     this)
    scene.events.on('coin:caught',    this.onCoinCaught,   this)
    scene.events.on('combo:changed',  this.onComboChanged, this)
  }

  setMusicEnabled(value: boolean): void { this.musicEnabled = value }
  setSfxEnabled(value: boolean): void   { this.sfxEnabled   = value }

  playPurchase(): void {
    if (!this.sfxEnabled || !this.unlocked) return
    this.sfxPurchase?.play()
  }

  playMusic(): void {
    // Needs a real looping music file — wired in a future phase
  }

  stopMusic(): void {
    // Fade out — wired in a future phase
  }

  private onSwipeHit(e: SwipeHitEvent): void {
    if (!this.sfxEnabled || !this.unlocked) return
    if (e.isCritical) this.sfxCrit?.play()
    else              this.sfxHit?.play()
  }

  private onCoinCaught(e: CoinCaughtEvent): void {
    if (!this.sfxEnabled || !this.unlocked) return
    if (RARE_COIN.has(e.coinType)) this.sfxCoinRare?.play()
    else                           this.sfxCoin?.play()
  }

  private onComboChanged(combo: ComboState): void {
    if (!this.sfxEnabled || !this.unlocked || !COMBO_BEATS.has(combo.count)) return
    this.sfxCombo?.play()
  }

  private unlock(): void {
    this.unlocked = true
    this.playMusic()
  }

  private tryAdd(key: string, cfg: Phaser.Types.Sound.SoundConfig): Phaser.Sound.BaseSound | null {
    if (!this.scene.cache.audio.exists(key)) return null
    return this.scene.sound.add(key, cfg)
  }

  destroy(): void {
    this.scene.input.off('pointerdown',   this.unlock,        this)
    this.scene.events.off('swipe:hit',    this.onSwipeHit,    this)
    this.scene.events.off('coin:caught',  this.onCoinCaught,  this)
    this.scene.events.off('combo:changed', this.onComboChanged, this)
    this.sfxHit?.destroy()
    this.sfxCrit?.destroy()
    this.sfxCoin?.destroy()
    this.sfxCoinRare?.destroy()
    this.sfxCombo?.destroy()
    this.sfxPurchase?.destroy()
  }
}
