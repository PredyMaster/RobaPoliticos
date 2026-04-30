import * as Phaser from "phaser"
import { EventBus } from "../EventBus"
import { PlayerCharacter } from "../entities/PlayerCharacter"
import { CatchBox } from "../entities/CatchBox"
import { WeaponCursor } from "../entities/WeaponCursor"
import { Coin } from "../entities/Coin"
import { ObjectPool } from "../systems/ObjectPool"
import { SwipeSystem } from "../systems/SwipeSystem"
import { CoinSpawnSystem } from "../systems/CoinSpawnSystem"
import { ComboSystem } from "../systems/ComboSystem"
import { ScoreSystem } from "../systems/ScoreSystem"
import { CollisionSystem } from "../systems/CollisionSystem"
import { AudioSystem } from "../systems/AudioSystem"
import { ParticleSystem } from "../systems/ParticleSystem"
import { EconomySystem } from "../systems/EconomySystem"
import { HapticsSystem } from "../systems/HapticsSystem"
import { getWeapon } from "../data/weapons"
import { getBox } from "../data/boxes"
import type { GraphicsQuality } from "../types/game"

export const SCENE_W = 1920
export const SCENE_H = 1080
export const GROUND_Y = SCENE_H - 40

export const SHOW_COLLIDERS = false

const POOL_SIZE = 32

const WEAPON_HIT_COOLDOWN_MS = 220

export class GameScene extends Phaser.Scene {
  private isRunning = false

  // Background
  private bgImage!: Phaser.GameObjects.Image
  private readyText!: Phaser.GameObjects.Text

  // Entities
  private player!: PlayerCharacter
  private box!: CatchBox
  private cursor!: WeaponCursor
  private pool!: ObjectPool<Coin>

  // Cursor-vs-player overlap detection (desktop only)
  private isDesktop = false
  private wasWeaponOverPlayer = false
  private lastWeaponHitMs = 0

  // Systems
  private swipe!: SwipeSystem
  private spawn!: CoinSpawnSystem
  private combo!: ComboSystem
  private score!: ScoreSystem
  private collision!: CollisionSystem
  private audio!: AudioSystem
  private particles!: ParticleSystem
  private economy!: EconomySystem
  private haptics!: HapticsSystem

  constructor() {
    super({ key: "GameScene" })
  }

  create(): void {
    this.buildStaticBackground()

    const weaponId =
      (this.registry.get("equippedWeaponId") as string) || "hand_basic"
    const boxId = (this.registry.get("equippedBoxId") as string) || "small_box"
    const music = (this.registry.get("musicEnabled") as boolean) ?? true
    const sfx = (this.registry.get("sfxEnabled") as boolean) ?? true
    const vibration = (this.registry.get("vibrationEnabled") as boolean) ?? true
    const quality =
      (this.registry.get("quality") as GraphicsQuality) || "medium"

    this.isDesktop = this.sys.game.device.os.desktop
    this.buildEntities(weaponId, boxId)
    this.buildSystems(weaponId, boxId, music, sfx, vibration, quality)
    this.registerEventBusListeners()
    this.audio.playMusic()
    EventBus.emit("GAME_READY")
  }

  // ── Background ────────────────────────────────────────────

  private buildStaticBackground(): void {
    this.bgImage = this.add
      .image(SCENE_W / 2, SCENE_H / 2, "bg")
      .setDisplaySize(SCENE_W, SCENE_H)
  }

  // ── Entities ──────────────────────────────────────────────

  private buildEntities(weaponId: string, boxId: string): void {
    void weaponId
    const boxCfg = getBox(boxId)

    this.player = new PlayerCharacter(this)
    this.box = new CatchBox(this, boxCfg)
    this.cursor = new WeaponCursor(this)
    this.pool = new ObjectPool<Coin>(() => new Coin(this), POOL_SIZE)
  }

  // ── Systems ───────────────────────────────────────────────

  private buildSystems(
    weaponId: string,
    boxId: string,
    music: boolean,
    sfx: boolean,
    vibration: boolean,
    quality: GraphicsQuality,
  ): void {
    const weapon = getWeapon(weaponId)

    this.swipe = new SwipeSystem(this, this.player, weapon)
    this.combo = new ComboSystem(this)
    this.spawn = new CoinSpawnSystem(this, this.pool, this.player, weapon)
    this.score = new ScoreSystem(this)
    this.collision = new CollisionSystem(this, this.pool, this.box)
    this.audio = new AudioSystem(this, music, sfx)
    this.particles = new ParticleSystem(this, quality)
    this.economy = new EconomySystem(
      this,
      this.score,
      this.collision,
      weaponId,
      boxId,
    )
    this.haptics = new HapticsSystem(this, vibration)
  }

  // ── EventBus bridge ───────────────────────────────────────

  private registerEventBusListeners(): void {
    EventBus.on("RUN_STARTED", this.onRunStarted, this)
    EventBus.on("RUN_PAUSED", this.onRunPaused, this)
    EventBus.on("RUN_RESUMED", this.onRunResumed, this)
    EventBus.on("EXIT_TO_HOME", this.onExitToHome, this)
    EventBus.on("TOGGLE_MUSIC", this.onToggleMusic, this)
    EventBus.on("TOGGLE_SFX", this.onToggleSfx, this)
  }

  private onToggleMusic(enabled: boolean): void {
    this.audio.setMusicEnabled(enabled)
  }

  private onToggleSfx(enabled: boolean): void {
    this.audio.setSfxEnabled(enabled)
  }

  private onRunStarted(): void {
    if (this.isRunning) return
    this.isRunning = true
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

  update(time: number, delta: number): void {
    this.box.updateMovement(delta)
    this.checkWeaponPlayerHit(time)
    this.collision.update(true)
    if (this.isRunning) {
      this.box.applyMagnet(this.pool.getActive())
    }
  }

  // Cuando el weapon_cursor entra en la zona del player, dispara un hit:
  // las monedas salen y caen por gravedad. Detecta el flanco de entrada
  // (no estaba solapando → ahora sí) con un pequeño cooldown anti-spam.
  private checkWeaponPlayerHit(now: number): void {
    if (!this.isDesktop) return
    if (!this.cursor.visible) {
      this.wasWeaponOverPlayer = false
      return
    }

    const overlaps = Phaser.Geom.Intersects.RectangleToRectangle(
      this.cursor.hitZone,
      this.player.hitZone,
    )

    if (
      overlaps &&
      !this.wasWeaponOverPlayer &&
      now - this.lastWeaponHitMs >= WEAPON_HIT_COOLDOWN_MS
    ) {
      this.lastWeaponHitMs = now
      this.fireWeaponHit()
    }
    this.wasWeaponOverPlayer = overlaps
  }

  private fireWeaponHit(): void {
    const v = this.cursor.lastVelocity
    const speed = Math.sqrt(v.x * v.x + v.y * v.y)
    let dx: number
    let dy: number
    if (speed > 0.5) {
      dx = v.x / speed
      dy = v.y / speed
    } else {
      // Sin velocidad del cursor: abanico horizontal para que la gravedad las hale directo
      dx = (Math.random() < 0.5 ? -1 : 1) * Math.random()
      dy = 0.3
    }

    // pointer.velocity ≈ px/frame a 60 fps; un swipe rápido da ~50 px/frame
    const strength = Math.max(0.2, Math.min(speed / 50, 1.0))

    this.events.emit("swipe:hit", {
      direction: { x: dx, y: dy },
      strength,
      isCritical: false,
      startX: this.cursor.x,
      startY: this.cursor.y,
    })
    this.cursor.playSwing()
  }

  // ── Lifecycle ─────────────────────────────────────────────

  shutdown(): void {
    EventBus.off("RUN_STARTED", this.onRunStarted, this)
    EventBus.off("RUN_PAUSED", this.onRunPaused, this)
    EventBus.off("RUN_RESUMED", this.onRunResumed, this)
    EventBus.off("EXIT_TO_HOME", this.onExitToHome, this)
    EventBus.off("TOGGLE_MUSIC", this.onToggleMusic, this)
    EventBus.off("TOGGLE_SFX", this.onToggleSfx, this)

    this.swipe?.destroy()
    this.spawn?.destroy()
    this.combo?.destroy()
    this.score?.destroy()
    this.audio?.destroy()
    this.particles?.destroy()
    this.economy?.destroy()
    this.haptics?.destroy()
  }
}
