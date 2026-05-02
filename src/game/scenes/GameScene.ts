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

const BG_KEYS = [
  "bg1",
  "bg2",
  "bg3",
  "bg4",
  "bg5",
  "bg6",
  "bg7",
  "bg8",
] as const

export class GameScene extends Phaser.Scene {
  private isRunning = false
  private isPaused = false

  // Background
  private bgImage!: Phaser.GameObjects.Image
  private bgIndex = 0

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
    this.isRunning = false
    this.isPaused = false
    this.buildStaticBackground()
    this.scale.on(Phaser.Scale.Events.RESIZE, this.handleResize, this)

    const weaponId =
      (this.registry.get("equippedWeaponId") as string) || "tree_branch"
    const boxId = (this.registry.get("equippedBoxId") as string) || "basic_box"
    const music = (this.registry.get("musicEnabled") as boolean) ?? true
    const sfx = (this.registry.get("sfxEnabled") as boolean) ?? true
    const vibration = (this.registry.get("vibrationEnabled") as boolean) ?? true
    const quality =
      (this.registry.get("quality") as GraphicsQuality) || "medium"

    this.buildEntities(weaponId, boxId)
    this.buildSystems(weaponId, boxId, music, sfx, vibration, quality)
    this.registerEventBusListeners()
    this.input.on("pointerdown", this.onPointerDown, this)
    this.audio.playMusic()
    this.handleResize()
    EventBus.emit("GAME_READY")
  }

  // ── Background ────────────────────────────────────────────

  private buildStaticBackground(): void {
    this.bgIndex = 0
    this.bgImage = this.add
      .image(SCENE_W / 2, SCENE_H / 2, BG_KEYS[0])
      .setDisplaySize(SCENE_W, SCENE_H)
  }

  private handleResize(): void {
    const viewport = this.scale.getViewPort(this.cameras.main)
    const centerX = viewport.centerX
    const centerY = viewport.centerY
    const frame = this.bgImage.frame
    const scale = Math.max(
      viewport.width / frame.width,
      viewport.height / frame.height,
    )

    this.bgImage.setPosition(centerX, centerY)
    this.bgImage.setScale(scale)
  }

  private onChangeBg(): void {
    this.bgIndex = (this.bgIndex + 1) % BG_KEYS.length
    this.bgImage.setTexture(BG_KEYS[this.bgIndex])
    this.handleResize()
    EventBus.emit("BG_CHANGED", this.bgIndex)
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
    EventBus.on("CHANGE_BG", this.onChangeBg, this)
  }

  private onToggleMusic(enabled: boolean): void {
    this.audio.setMusicEnabled(enabled)
  }

  private onToggleSfx(enabled: boolean): void {
    this.audio.setSfxEnabled(enabled)
  }

  private onRunStarted(): void {
    if (this.isRunning) return
    for (const coin of this.pool.getActive()) {
      coin.despawn()
      this.pool.release(coin)
    }
    this.score.reset()
    this.combo.reset()
    this.isPaused = false
    this.physics.resume()
    this.isRunning = true
    this.economy.startTracking()
  }

  private onRunPaused(): void {
    if (!this.isRunning) return
    this.isRunning = false
    this.isPaused = true
    this.physics.pause()
  }

  private onRunResumed(): void {
    if (!this.isPaused) return
    this.isRunning = true
    this.isPaused = false
    this.physics.resume()
  }

  private onExitToHome(): void {
    this.isRunning = false
    this.physics.pause()
    // game.destroy() desde GameScreen.useEffect cleanup dispara shutdown()
  }

  // ── Gameplay loop ─────────────────────────────────────────

  update(time: number, delta: number): void {
    if (this.isPaused) return
    this.box.updateMovement(delta)
    this.checkWeaponPlayerHit(time)
    this.collision.update(true)
    if (this.isRunning) {
      this.box.applyMagnet(this.pool.getActive())
    }
  }

  // Al tocar la pantalla: si el dedo cae directamente sobre el player, marcamos
  // wasWeaponOverPlayer=true para que ese frame no cuente como "entrada" y no
  // dispare un hit (evita que un simple tap saque monedas en móvil).
  private onPointerDown(): void {
    const onPlayer = Phaser.Geom.Intersects.RectangleToRectangle(
      this.cursor.hitZone,
      this.player.hitZone,
    )
    if (onPlayer) this.wasWeaponOverPlayer = true
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
    this.scale.off(Phaser.Scale.Events.RESIZE, this.handleResize, this)
    EventBus.off("RUN_STARTED", this.onRunStarted, this)
    EventBus.off("RUN_PAUSED", this.onRunPaused, this)
    EventBus.off("RUN_RESUMED", this.onRunResumed, this)
    EventBus.off("EXIT_TO_HOME", this.onExitToHome, this)
    EventBus.off("TOGGLE_MUSIC", this.onToggleMusic, this)
    EventBus.off("TOGGLE_SFX", this.onToggleSfx, this)
    EventBus.off("CHANGE_BG", this.onChangeBg, this)
    this.input.off("pointerdown", this.onPointerDown, this)

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
