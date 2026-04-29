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

const POOL_SIZE = 32

const WEAPON_HIT_COOLDOWN_MS = 220

export class GameScene extends Phaser.Scene {
  private isRunning = false

  // Background
  private bgImage!: Phaser.GameObjects.Image
  private platformImage!: Phaser.GameObjects.Image
  private readyText!: Phaser.GameObjects.Text

  // Entities
  private player!: PlayerCharacter
  private box!: CatchBox
  private cursor!: WeaponCursor
  private pool!: ObjectPool<Coin>

  // Cursor-vs-player overlap detection
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

    this.buildEntities(weaponId, boxId)
    this.buildSystems(weaponId, boxId, music, sfx, vibration, quality)
    this.registerEventBusListeners()
    EventBus.emit("GAME_READY")
  }

  // ── Background ────────────────────────────────────────────

  private buildStaticBackground(): void {
    this.bgImage = this.add.image(SCENE_W / 2, SCENE_H / 2, "bg").setDisplaySize(SCENE_W, SCENE_H)
    this.platformImage = this.add.image(SCENE_W / 2, GROUND_Y + 20, "platform")

    this.readyText = this.add
      .text(SCENE_W / 2, SCENE_H / 2 - 80, "", {
        fontSize: "48px",
        color: "rgba(255,255,255,0.2)",
        fontStyle: "bold",
      })
      .setOrigin(0.5)
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

    this.particles.setPlayerPosition(this.player.x, this.player.y)
  }

  // ── EventBus bridge ───────────────────────────────────────

  private registerEventBusListeners(): void {
    EventBus.on("RUN_STARTED", this.onRunStarted, this)
    EventBus.on("RUN_PAUSED", this.onRunPaused, this)
    EventBus.on("RUN_RESUMED", this.onRunResumed, this)
    EventBus.on("EXIT_TO_HOME", this.onExitToHome, this)
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

  update(time: number, delta: number): void {
    // La caja se mueve siempre (visible aunque no haya partida activa)
    this.box.updateMovement(delta)
    if (!this.isRunning) return
    this.box.applyMagnet(this.pool.getActive())
    this.collision.update()
    this.checkWeaponPlayerHit(time)
  }

  // Cuando el weapon_cursor entra en la zona del player, dispara un hit:
  // las monedas salen y caen por gravedad. Detecta el flanco de entrada
  // (no estaba solapando → ahora sí) con un pequeño cooldown anti-spam.
  private checkWeaponPlayerHit(now: number): void {
    if (!this.cursor.visible) {
      this.wasWeaponOverPlayer = false
      return
    }

    const overlaps = Phaser.Geom.Intersects.RectangleToRectangle(
      this.cursor.hitZone,
      this.player.hitZone,
    )

    if (overlaps && !this.wasWeaponOverPlayer && now - this.lastWeaponHitMs >= WEAPON_HIT_COOLDOWN_MS) {
      this.lastWeaponHitMs = now
      this.fireWeaponHit()
    }
    this.wasWeaponOverPlayer = overlaps
  }

  private fireWeaponHit(): void {
    const v = this.cursor.lastVelocity
    const len = Math.sqrt(v.x * v.x + v.y * v.y)
    let dx: number
    let dy: number
    if (len > 0.5) {
      dx = v.x / len
      dy = v.y / len
    } else {
      // Sin velocidad clara: dirige hacia arriba para que las monedas suban antes de caer
      dx = 0
      dy = -1
    }

    this.events.emit('swipe:hit', {
      direction: { x: dx, y: dy },
      strength: 0.85,
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
