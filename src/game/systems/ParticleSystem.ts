import * as Phaser from 'phaser'
import type { CoinTypeId, GraphicsQuality } from '../types/game'
import { SCENE_W, SCENE_H } from '../scenes/GameScene'

const QUALITY_COUNT: Record<GraphicsQuality, number> = { low: 4, medium: 8, high: 16 }

const COIN_TEXTURE: Partial<Record<CoinTypeId, string>> = {
  normal_coin: 'coin_normal',
  silver_coin: 'coin_silver',
  gold_coin:   'coin_gold',
  money_bill:  'money_bill',
  gem:         'gem',
}

type PlayerHitEvent  = { isCritical: boolean }
type CoinCaughtEvent = { x: number; y: number; coinType: CoinTypeId }

export class ParticleSystem {
  private readonly scene: Phaser.Scene
  private readonly maxCount: number
  private hitEmitter!:     Phaser.GameObjects.Particles.ParticleEmitter
  private collectEmitter!: Phaser.GameObjects.Particles.ParticleEmitter
  private feverOverlay!:   Phaser.GameObjects.Rectangle

  constructor(scene: Phaser.Scene, quality: GraphicsQuality) {
    this.scene    = scene
    this.maxCount = QUALITY_COUNT[quality]
    this.createEmitters()
    this.createFeverOverlay()

    scene.events.on('player:hit',  this.onPlayerHit,  this)
    scene.events.on('coin:caught', this.onCoinCaught, this)
    scene.events.on('fever:start', this.onFeverStart, this)
    scene.events.on('fever:end',   this.onFeverEnd,   this)
  }

  private createEmitters(): void {
    this.hitEmitter = this.scene.add.particles(0, 0, 'coin_normal', {
      speed:    { min: 80, max: 240 },
      angle:    { min: 0, max: 360 },
      scale:    { start: 0.55, end: 0 },
      alpha:    { start: 1, end: 0 },
      lifespan: 450,
      emitting: false,
    })

    this.collectEmitter = this.scene.add.particles(0, 0, 'coin_normal', {
      speed:    { min: 40, max: 110 },
      angle:    { min: 210, max: 330 },
      scale:    { start: 0.4, end: 0 },
      alpha:    { start: 1, end: 0 },
      lifespan: 300,
      emitting: false,
    })
  }

  private createFeverOverlay(): void {
    this.feverOverlay = this.scene.add
      .rectangle(SCENE_W / 2, SCENE_H / 2, SCENE_W, SCENE_H, 0xffcc44)
      .setAlpha(0)
      .setDepth(50)
  }

  private onPlayerHit(e: PlayerHitEvent): void {
    const count = e.isCritical ? this.maxCount * 2 : this.maxCount
    const { x, y } = this.hitEmitter
    this.hitEmitter.explode(count, x, y)
  }

  private onCoinCaught(e: CoinCaughtEvent): void {
    const texture = COIN_TEXTURE[e.coinType] ?? 'coin_normal'
    this.collectEmitter.setTexture(texture)
    this.collectEmitter.explode(4, e.x, e.y)
  }

  /** Call from GameScene.create after player position is known */
  setPlayerPosition(x: number, y: number): void {
    this.hitEmitter.setPosition(x, y)
  }

  private onFeverStart(): void {
    this.scene.cameras.main.flash(300, 255, 200, 50, true)
    this.scene.tweens.add({
      targets:  this.feverOverlay,
      alpha:    0.10,
      duration: 400,
      ease:     'Power1',
    })
  }

  private onFeverEnd(): void {
    this.scene.tweens.add({
      targets:  this.feverOverlay,
      alpha:    0,
      duration: 700,
      ease:     'Power2',
    })
  }

  destroy(): void {
    this.scene.events.off('player:hit',  this.onPlayerHit,  this)
    this.scene.events.off('coin:caught', this.onCoinCaught, this)
    this.scene.events.off('fever:start', this.onFeverStart, this)
    this.scene.events.off('fever:end',   this.onFeverEnd,   this)
    this.hitEmitter.destroy()
    this.collectEmitter.destroy()
    this.feverOverlay.destroy()
  }
}
