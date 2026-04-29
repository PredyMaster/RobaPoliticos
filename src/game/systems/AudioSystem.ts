import * as Phaser from 'phaser'
import type { CoinTypeId, ComboState } from '../types/game'
import type { SwipeHitEvent } from './SwipeSystem'

const RARE_COIN = new Set<CoinTypeId>(['coin_gold', 'bill_blue', 'bill_green', 'bill_pink'])
const COMBO_BEATS = new Set([5, 10, 20, 50])

type CoinCaughtEvent = { coinType: CoinTypeId }

export class AudioSystem {
  private readonly scene: Phaser.Scene
  private musicEnabled: boolean
  private sfxEnabled:   boolean

  private bgMusic!:     Phaser.Sound.BaseSound | null
  private sfxSlaps!:    (Phaser.Sound.BaseSound | null)[]
  private sfxCoins!:    (Phaser.Sound.BaseSound | null)[]
  private sfxCoinRare!: Phaser.Sound.BaseSound | null
  private sfxCombo!:    Phaser.Sound.BaseSound | null
  private sfxPurchase!: Phaser.Sound.BaseSound | null

  constructor(scene: Phaser.Scene, musicEnabled: boolean, sfxEnabled: boolean) {
    this.scene        = scene
    this.musicEnabled = musicEnabled
    this.sfxEnabled   = sfxEnabled

    this.bgMusic     = this.tryAdd('bgm',          { loop: true, volume: 0.4 })
    this.sfxSlaps    = [1, 2, 3, 4].map(i => this.tryAdd(`sfx_slap_${i}`, { volume: 0.70 }))
    this.sfxCoins    = [1, 2, 3, 4, 5].map(i => this.tryAdd(`sfx_coin_${i}`, { volume: 0.55 }))
    this.sfxCoinRare = this.tryAdd('sfx_coin_rare', { volume: 0.55 })
    this.sfxCombo    = this.tryAdd('sfx_combo',     { volume: 0.60 })
    this.sfxPurchase = this.tryAdd('sfx_purchase',  { volume: 0.65 })

    scene.events.on('swipe:hit',      this.onSwipeHit,     this)
    scene.events.on('coin:caught',    this.onCoinCaught,   this)
    scene.events.on('combo:changed',  this.onComboChanged, this)

    // El AudioContext del navegador arranca suspendido hasta el primer gesto.
    // Si ya está desbloqueado (ej: el usuario llegó aquí desde la home screen
    // haciendo click), playMusic() arrancará directamente. Si no, esperamos al
    // evento 'unlocked' que Phaser emite tras la primera interacción.
    if (scene.sound.locked) {
      scene.sound.once('unlocked', this.onSoundUnlocked, this)
    }
  }

  // Llamar desde GameScene.create() tras construir este sistema.
  playMusic(): void {
    if (!this.bgMusic || !this.musicEnabled) return
    if (!this.bgMusic.isPlaying) {
      this.bgMusic.play()
    }
  }

  stopMusic(): void {
    if (this.bgMusic?.isPlaying) {
      this.bgMusic.stop()
    }
  }

  setMusicEnabled(value: boolean): void {
    this.musicEnabled = value
    if (value) {
      this.playMusic()
    } else {
      this.stopMusic()
    }
  }

  setSfxEnabled(value: boolean): void { this.sfxEnabled = value }

  playPurchase(): void {
    if (!this.sfxEnabled) return
    this.sfxPurchase?.play()
  }

  private onSoundUnlocked(): void {
    // El AudioContext acaba de desbloquearse: arrancamos la música ahora.
    if (this.musicEnabled && this.bgMusic && !this.bgMusic.isPlaying) {
      this.bgMusic.play()
    }
  }

  private onSwipeHit(_e: SwipeHitEvent): void {
    if (!this.sfxEnabled) return
    const sfx = this.sfxSlaps[Math.floor(Math.random() * this.sfxSlaps.length)]
    sfx?.play()
  }

  private onCoinCaught(e: CoinCaughtEvent): void {
    if (!this.sfxEnabled) return
    if (RARE_COIN.has(e.coinType)) {
      this.sfxCoinRare?.play()
    } else {
      const sfx = this.sfxCoins[Math.floor(Math.random() * this.sfxCoins.length)]
      sfx?.play()
    }
  }

  private onComboChanged(combo: ComboState): void {
    if (!this.sfxEnabled || !COMBO_BEATS.has(combo.count)) return
    this.sfxCombo?.play()
  }

  private tryAdd(key: string, cfg: Phaser.Types.Sound.SoundConfig): Phaser.Sound.BaseSound | null {
    if (!this.scene.cache.audio.exists(key)) {
      console.warn(`[AudioSystem] audio key not in cache: ${key}`)
      return null
    }
    return this.scene.sound.add(key, cfg)
  }

  destroy(): void {
    this.scene.sound.off('unlocked', this.onSoundUnlocked, this)
    this.scene.events.off('swipe:hit',     this.onSwipeHit,    this)
    this.scene.events.off('coin:caught',   this.onCoinCaught,  this)
    this.scene.events.off('combo:changed', this.onComboChanged, this)
    this.bgMusic?.stop()
    this.bgMusic?.destroy()
    this.sfxSlaps.forEach(s => s?.destroy())
    this.sfxCoins.forEach(s => s?.destroy())
    this.sfxCoinRare?.destroy()
    this.sfxCombo?.destroy()
    this.sfxPurchase?.destroy()
  }
}
