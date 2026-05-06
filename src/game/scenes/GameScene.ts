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
import { SpeechBubbleSystem } from "../systems/SpeechBubbleSystem"
import { getCombatLoadout } from "../data/combatLoadouts"
import { getBox } from "../data/boxes"
import { swipeStrength } from "../utils/math"
import type { GraphicsQuality } from "../types/game"
import type { CombatLoadout } from "../types/game"

export const SCENE_W = 1920
export const SCENE_H = 1080
export const GROUND_Y = SCENE_H - 40

export const showColliders = false
export const SHOW_COLLIDERS = showColliders

const POOL_SIZE = 256

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
  private currentSpeedBoostStage: 0 | 1 | 2 = 0

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
  private speechBubbles!: SpeechBubbleSystem
  private combatLoadout!: CombatLoadout

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
    const handId =
      (this.registry.get("equippedHandId") as string) || "bare_hand"
    const boxId = (this.registry.get("equippedBoxId") as string) || "basic_box"
    const music = (this.registry.get("musicEnabled") as boolean) ?? true
    const sfx = (this.registry.get("sfxEnabled") as boolean) ?? true
    const vibration = (this.registry.get("vibrationEnabled") as boolean) ?? true
    const quality =
      (this.registry.get("quality") as GraphicsQuality) || "medium"

    this.combatLoadout = getCombatLoadout(weaponId, handId)
    this.buildEntities(this.combatLoadout, boxId)
    this.buildSystems(this.combatLoadout, boxId, music, sfx, vibration, quality)
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

  private buildEntities(loadout: CombatLoadout, boxId: string): void {
    const boxCfg = getBox(boxId)

    this.player = new PlayerCharacter(this)
    this.box = new CatchBox(this, boxCfg)
    this.cursor = new WeaponCursor(this, loadout.cursorTextureKey, this.player)
    this.pool = new ObjectPool<Coin>(() => new Coin(this), POOL_SIZE)
  }

  // ── Systems ───────────────────────────────────────────────

  private buildSystems(
    loadout: CombatLoadout,
    boxId: string,
    music: boolean,
    sfx: boolean,
    vibration: boolean,
    quality: GraphicsQuality,
  ): void {
    this.swipe = new SwipeSystem(this, this.player, loadout)
    this.combo = new ComboSystem(this)
    this.spawn = new CoinSpawnSystem(this, this.pool, this.player, loadout)
    this.score = new ScoreSystem(this)
    this.collision = new CollisionSystem(this, this.pool, this.box)
    this.audio = new AudioSystem(this, music, sfx)
    this.particles = new ParticleSystem(this, quality)
    this.economy = new EconomySystem(
      this,
      this.score,
      this.collision,
      loadout.weapon.id,
      loadout.hand.id,
      boxId,
    )
    this.haptics = new HapticsSystem(this, vibration)
    this.speechBubbles = new SpeechBubbleSystem(this)
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
    EventBus.on("EQUIPMENT_UPDATED", this.onEquipmentUpdated, this)
    EventBus.on("BOX_SPEED_BOOST", this.onBoxSpeedBoost, this)
  }

  private onBoxSpeedBoost(stage: 1 | 2): void {
    this.currentSpeedBoostStage = stage
    this.box.applySpeedBoost(stage)
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
    this.currentSpeedBoostStage = 0
    this.isPaused = false
    this.physics.resume()
    this.isRunning = true
    this.economy.startTracking()
    this.audio.switchToRandomTrack()
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

  private onEquipmentUpdated({
    weaponId,
    handId,
    boxId,
  }: {
    weaponId: string
    handId: string
    boxId: string
  }): void {
    this.combatLoadout = getCombatLoadout(weaponId, handId)
    this.registry.set("equippedWeaponId", this.combatLoadout.weapon.id)
    this.registry.set("equippedHandId", this.combatLoadout.hand.id)
    this.registry.set("equippedBoxId", boxId)
    this.cursor.setTextureKey(this.combatLoadout.cursorTextureKey)
    this.box.setConfig(getBox(boxId))
    if (this.currentSpeedBoostStage > 0) {
      this.box.applySpeedBoost(this.currentSpeedBoostStage as 1 | 2)
    }
    this.swipe.setLoadout(this.combatLoadout)
    this.spawn.setLoadout(this.combatLoadout)
    this.economy.setEquipment(
      this.combatLoadout.weapon.id,
      this.combatLoadout.hand.id,
      boxId,
    )
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
    const distance = this.cursor.lastMoveDistance
    let dx: number
    let dy: number
    if (speed > 0) {
      dx = v.x / speed
      dy = v.y / speed
    } else {
      // Sin velocidad del cursor: abanico horizontal para que la gravedad las hale directo
      dx = (Math.random() < 0.5 ? -1 : 1) * Math.random()
      dy = 0.3
    }

    const strength = swipeStrength(speed, distance)
    const didHit = true
    const isCritical = Math.random() < this.combatLoadout.criticalChance

    this.events.emit("swipe:hit", {
      direction: { x: dx, y: dy },
      strength,
      didHit,
      isCritical,
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
    EventBus.off("EQUIPMENT_UPDATED", this.onEquipmentUpdated, this)
    EventBus.off("BOX_SPEED_BOOST", this.onBoxSpeedBoost, this)
    this.input.off("pointerdown", this.onPointerDown, this)

    this.swipe?.destroy()
    this.spawn?.destroy()
    this.combo?.destroy()
    this.score?.destroy()
    this.audio?.destroy()
    this.particles?.destroy()
    this.economy?.destroy()
    this.haptics?.destroy()
    this.speechBubbles?.destroy()
  }
}
