import Phaser from 'phaser'
import { EventBus } from '../EventBus'
import { PlayerCharacter } from '../entities/PlayerCharacter'
import { CatchBox } from '../entities/CatchBox'
import { WeaponCursor } from '../entities/WeaponCursor'
import { Coin } from '../entities/Coin'
import { ObjectPool } from '../systems/ObjectPool'
import { SwipeSystem } from '../systems/SwipeSystem'
import { CoinSpawnSystem } from '../systems/CoinSpawnSystem'
import { ComboSystem } from '../systems/ComboSystem'
import { ScoreSystem } from '../systems/ScoreSystem'
import { CollisionSystem } from '../systems/CollisionSystem'
import { AudioSystem } from '../systems/AudioSystem'
import { ParticleSystem } from '../systems/ParticleSystem'
import { EconomySystem } from '../systems/EconomySystem'
import { getWeapon } from '../data/weapons'
import { getBox } from '../data/boxes'
import type { GraphicsQuality } from '../types/game'

export const SCENE_W  = 1920
export const SCENE_H  = 1080
export const GROUND_Y = SCENE_H - 40

const POOL_SIZE = 32

export class GameScene extends Phaser.Scene {
  private isRunning = false

  // Background
  private bgImage!:       Phaser.GameObjects.Image
  private platformImage!: Phaser.GameObjects.Image
  private readyText!:     Phaser.GameObjects.Text

  // Entities
  private player!: PlayerCharacter
  private box!:    CatchBox
  private cursor!: WeaponCursor
  private pool!:   ObjectPool<Coin>

  // Systems
  private swipe!:     SwipeSystem
  private spawn!:     CoinSpawnSystem
  private combo!:     ComboSystem
  private score!:     ScoreSystem
  private collision!: CollisionSystem
  private audio!:     AudioSystem
  private particles!: ParticleSystem
  private economy!:   EconomySystem

  constructor() {
    super({ key: 'GameScene' })
  }

  create(): void {
    this.buildStaticBackground()

    const weaponId = (this.registry.get('equippedWeaponId') as string)  || 'hand_basic'
    const boxId    = (this.registry.get('equippedBoxId')    as string)  || 'small_box'
    const music    = (this.registry.get('musicEnabled')     as boolean) ?? true
    const sfx      = (this.registry.get('sfxEnabled')       as boolean) ?? true
    const quality  = (this.registry.get('quality')          as GraphicsQuality) || 'medium'

    this.buildEntities(weaponId, boxId)
    this.buildSystems(weaponId, boxId, music, sfx, quality)
    this.registerEventBusListeners()
    EventBus.emit('GAME_READY')
  }

  // ── Background ────────────────────────────────────────────

  private buildStaticBackground(): void {
    this.bgImage       = this.add.image(SCENE_W / 2, SCENE_H / 2, 'bg')
    this.platformImage = this.add.image(SCENE_W / 2, GROUND_Y + 20, 'platform')

    this.readyText = this.add.text(SCENE_W / 2, SCENE_H / 2 - 80, 'Listo para jugar', {
      fontSize: '48px',
      color: 'rgba(255,255,255,0.2)',
      fontStyle: 'bold',
    }).setOrigin(0.5)
  }

  // ── Entities ──────────────────────────────────────────────

  private buildEntities(weaponId: string, boxId: string): void {
    void weaponId
    const boxCfg = getBox(boxId)

    this.player = new PlayerCharacter(this)
    this.box    = new CatchBox(this, boxCfg)
    this.cursor = new WeaponCursor(this)
    this.pool   = new ObjectPool<Coin>(() => new Coin(this), POOL_SIZE)
  }

  // ── Systems ───────────────────────────────────────────────

  private buildSystems(
    weaponId: string,
    boxId: string,
    music: boolean,
    sfx: boolean,
    quality: GraphicsQuality,
  ): void {
    const weapon = getWeapon(weaponId)

    this.swipe     = new SwipeSystem(this, this.player, weapon)
    this.combo     = new ComboSystem(this)
    this.spawn     = new CoinSpawnSystem(this, this.pool, this.player, weapon)
    this.score     = new ScoreSystem(this)
    this.collision = new CollisionSystem(this, this.pool, this.box)
    this.audio     = new AudioSystem(this, music, sfx)
    this.particles = new ParticleSystem(this, quality)
    this.economy   = new EconomySystem(this, this.score, this.collision, weaponId, boxId)

    this.particles.setPlayerPosition(this.player.x, this.player.y)
  }

  // ── EventBus bridge ───────────────────────────────────────

  private registerEventBusListeners(): void {
    EventBus.on('RUN_STARTED',  this.onRunStarted,  this)
    EventBus.on('RUN_PAUSED',   this.onRunPaused,   this)
    EventBus.on('RUN_RESUMED',  this.onRunResumed,  this)
    EventBus.on('EXIT_TO_HOME', this.onExitToHome,  this)
  }

  private onRunStarted(): void {
    if (this.isRunning) return
    this.isRunning = true
    this.readyText.setVisible(false)
    this.economy.startTracking()
  }

  private onRunPaused(): void {
    if (!this.isRunning) return
    this.physics.pause()
  }

  private onRunResumed(): void {
    if (!this.isRunning) return
    this.physics.resume()
  }

  private onExitToHome(): void {
    this.isRunning = false
    this.physics.pause()
    // game.destroy() desde GameScreen.useEffect cleanup dispara shutdown()
  }

  // ── Gameplay loop ─────────────────────────────────────────

  update(_time: number, delta: number): void {
    if (!this.isRunning) return
    this.box.updateMovement(delta)
    this.box.applyMagnet(this.pool.getActive())
    this.collision.update()
  }

  // ── Lifecycle ─────────────────────────────────────────────

  shutdown(): void {
    EventBus.off('RUN_STARTED',  this.onRunStarted,  this)
    EventBus.off('RUN_PAUSED',   this.onRunPaused,   this)
    EventBus.off('RUN_RESUMED',  this.onRunResumed,  this)
    EventBus.off('EXIT_TO_HOME', this.onExitToHome,  this)

    this.swipe?.destroy()
    this.spawn?.destroy()
    this.combo?.destroy()
    this.score?.destroy()
    this.audio?.destroy()
    this.particles?.destroy()
    this.economy?.destroy()
  }
}
