import {
  Component,
  useRef,
  useEffect,
  useCallback,
  useState,
  type ErrorInfo,
  type ReactNode,
} from "react"
import { useNavigate } from "react-router-dom"
import { useGameStore } from "../store/useGameStore"
import { useInventoryStore } from "../store/useInventoryStore"
import { usePlayerStore } from "../store/usePlayerStore"
import { EventBus } from "../game/EventBus"
import * as Phaser from "phaser"
import { createGame } from "../game/PhaserGame"
import type { ComboState, RunResult } from "../game/types/game"
import { C, FONT } from "./shared/theme"
import { LoadingScreen } from "./LoadingScreen"
import { ShopScreen } from "./ShopScreen"

// ── HUD ──────────────────────────────────────────────────────

function GameHUD({ onPause }: { onPause: () => void }) {
  const runScore = useGameStore((s) => s.runScore)
  const runCombo = useGameStore((s) => s.runCombo)

  const showCombo = runCombo !== null && runCombo.active && runCombo.count >= 2

  return (
    <div
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        padding: "12px 16px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        zIndex: 10,
        background: "linear-gradient(to bottom, rgba(0,0,0,0.55), transparent)",
        fontFamily: FONT,
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 2,
        }}
      >
        <span style={{ color: C.gold, fontSize: 28, fontWeight: 800 }}>
          {runScore.toLocaleString()}
        </span>
        {showCombo && (
          <span
            style={{
              color: "#fff",
              fontSize: 13,
              fontWeight: 700,
              background: `linear-gradient(90deg, ${C.goldDk}, ${C.gold})`,
              borderRadius: 6,
              padding: "2px 8px",
              letterSpacing: "0.04em",
            }}
          >
            ×{runCombo!.multiplier.toFixed(1)} · {runCombo!.count} combo
          </span>
        )}
      </div>

      <button
        onClick={onPause}
        style={{
          background: "rgba(0,0,0,0.45)",
          border: "1px solid rgba(255,255,255,0.25)",
          color: "#fff",
          padding: "6px 14px",
          borderRadius: 8,
          cursor: "pointer",
          fontSize: 16,
          fontFamily: FONT,
          minWidth: 44,
          minHeight: 36,
        }}
      >
        II
      </button>
    </div>
  )
}

// ── Toggle row helper ─────────────────────────────────────────

function ToggleRow({
  label,
  value,
  onChange,
}: {
  label: string
  value: boolean
  onChange: (v: boolean) => void
}) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "10px 16px",
        background: "rgba(255,255,255,0.06)",
        borderRadius: 8,
      }}
    >
      <span style={{ color: "#fff", fontSize: 14, fontFamily: FONT }}>
        {label}
      </span>
      <div
        role="switch"
        aria-checked={value}
        onClick={() => onChange(!value)}
        style={{
          width: 42,
          height: 24,
          borderRadius: 12,
          background: value ? C.gold : "rgba(255,255,255,0.2)",
          cursor: "pointer",
          position: "relative",
          transition: "background 0.2s",
          flexShrink: 0,
        }}
      >
        <div
          style={{
            position: "absolute",
            top: 3,
            left: value ? 21 : 3,
            width: 18,
            height: 18,
            borderRadius: "50%",
            background: "#fff",
            transition: "left 0.2s",
          }}
        />
      </div>
    </div>
  )
}

// ── Pause overlay ─────────────────────────────────────────────

function PauseOverlay({
  onResume,
  onExit,
}: {
  onResume: () => void
  onExit: () => void
}) {
  const musicEnabled = useGameStore((s) => s.musicEnabled)
  const sfxEnabled = useGameStore((s) => s.sfxEnabled)
  const vibrationEnabled = useGameStore((s) => s.vibrationEnabled)
  const setMusic = useGameStore((s) => s.setMusicEnabled)
  const setSfx = useGameStore((s) => s.setSfxEnabled)
  const setVibration = useGameStore((s) => s.setVibrationEnabled)

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        background: "rgba(0,0,0,0.82)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 100,
        fontFamily: FONT,
      }}
    >
      <h2
        style={{
          color: C.gold,
          fontSize: 28,
          margin: "0 0 24px",
          fontWeight: 800,
        }}
      >
        Pausa
      </h2>

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 10,
          marginBottom: 28,
          width: 260,
        }}
      >
        <ToggleRow label="🎵 Música" value={musicEnabled} onChange={setMusic} />
        <ToggleRow label="🔊 Efectos" value={sfxEnabled} onChange={setSfx} />
        <ToggleRow
          label="📳 Vibración"
          value={vibrationEnabled}
          onChange={setVibration}
        />
      </div>

      <button
        onClick={onResume}
        style={{
          width: 260,
          padding: "14px",
          background: C.gold,
          border: "none",
          borderRadius: 10,
          color: "#1a1a2e",
          fontSize: 16,
          fontWeight: 700,
          cursor: "pointer",
          fontFamily: FONT,
          marginBottom: 10,
        }}
      >
        ▶ Continuar
      </button>

      <button
        onClick={onExit}
        style={{
          width: 260,
          padding: "12px",
          background: "rgba(255,255,255,0.07)",
          border: `1px solid ${C.border}`,
          borderRadius: 10,
          color: "#fff",
          fontSize: 15,
          cursor: "pointer",
          fontFamily: FONT,
        }}
      >
        ✕ Salir al menú
      </button>
    </div>
  )
}

// ── GameScreen ────────────────────────────────────────────────

const BG_URLS = [
  "/assets/backgrounds/bg1.jpg",
  "/assets/backgrounds/bg2.jpg",
  "/assets/backgrounds/bg3.jpg",
  "/assets/backgrounds/bg4.jpg",
  "/assets/backgrounds/bg5.jpg",
  "/assets/backgrounds/bg6.jpg",
  "/assets/backgrounds/bg7.jpg",
  "/assets/backgrounds/bg8.jpg",
]

type ShopBridgeWindow = Window & {
  __openShopOverlay?: (source?: string) => void
}

type ShopRenderBoundaryProps = {
  children: ReactNode
  onError: (message: string) => void
  resetKey: string
}

type ShopRenderBoundaryState = {
  error: string | null
}

class ShopRenderBoundary extends Component<
  ShopRenderBoundaryProps,
  ShopRenderBoundaryState
> {
  state: ShopRenderBoundaryState = {
    error: null,
  }

  static getDerivedStateFromError(error: Error): ShopRenderBoundaryState {
    return { error: error.message }
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    const details = info.componentStack
      ? `${error.message} :: ${info.componentStack.trim()}`
      : error.message
    this.props.onError(details)
  }

  componentDidUpdate(prevProps: ShopRenderBoundaryProps): void {
    if (prevProps.resetKey !== this.props.resetKey && this.state.error) {
      this.setState({ error: null })
    }
  }

  render() {
    if (this.state.error) {
      return (
        <div
          style={{
            position: "absolute",
            inset: 24,
            zIndex: 1100,
            borderRadius: 18,
            border: "2px solid #fecaca",
            background: "rgba(127, 29, 29, 0.96)",
            color: "#fff",
            padding: "18px 20px",
            fontFamily: FONT,
            overflow: "auto",
          }}
        >
          <strong style={{ display: "block", marginBottom: 8 }}>
            ShopScreen ha fallado al renderizar
          </strong>
          <div
            style={{ whiteSpace: "pre-wrap", fontSize: 13, lineHeight: 1.4 }}
          >
            {this.state.error}
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

export function GameScreen() {
  const navigate = useNavigate()
  const containerRef = useRef<HTMLDivElement>(null)
  const gameRef = useRef<Phaser.Game | null>(null)
  const bgImgRef = useRef<HTMLImageElement>(null)
  const [shopOverlayOpen, setShopOverlayOpen] = useState(false)
  const [isPreparingRun, setIsPreparingRun] = useState(true)

  // ── Stores ────────────────────────────────────────────────
  const isRunActive = useGameStore((s) => s.isRunActive)
  const isPaused = useGameStore((s) => s.isPaused)
  const isShopOpen = useGameStore((s) => s.isShopOpen)
  const pauseRun = useGameStore((s) => s.pauseRun)
  const resumeRun = useGameStore((s) => s.resumeRun)
  const closeShop = useGameStore((s) => s.closeShop)
  const showPauseMenu = useGameStore((s) => s.showPauseMenu)
  const updateRunScore = useGameStore((s) => s.updateRunScore)
  const updateCombo = useGameStore((s) => s.updateCombo)
  const endRun = useGameStore((s) => s.endRun)

  const equipment = useInventoryStore((s) => s.equipment)
  const loadInventory = useInventoryStore((s) => s.loadInventory)
  const addCoins = usePlayerStore((s) => s.addCoins)
  const resetRunState = usePlayerStore((s) => s.resetRunState)
  const isShopVisible = isShopOpen || shopOverlayOpen

  useEffect(() => {
    if (isShopVisible) return
  }, [isShopVisible])

  useEffect(() => {
    let cancelled = false

    const prepareFreshRun = async () => {
      try {
        await resetRunState()
        const nextSession = usePlayerStore.getState().session
        if (nextSession) {
          await loadInventory(nextSession.userId)
        }
      } finally {
        if (!cancelled) {
          setIsPreparingRun(false)
        }
      }
    }

    void prepareFreshRun()

    return () => {
      cancelled = true
    }
  }, [loadInventory, resetRunState])

  // Fuerza el fondo del body al inicial nada más montar (sobrescribe cualquier caché de index.html)
  useEffect(() => {
    document.body.style.background = `#1a1a2e url('${BG_URLS[0]}') center center / cover no-repeat`
    return () => {
      document.body.style.background = ""
    }
  }, [])

  useEffect(() => {
    const bridgeWindow = window as ShopBridgeWindow
    bridgeWindow.__openShopOverlay = (_source = "window_bridge") => {
      setShopOverlayOpen(true)
    }

    return () => {
      if (bridgeWindow.__openShopOverlay) {
        delete bridgeWindow.__openShopOverlay
      }
    }
  }, [])

  // ── Phaser bootstrap ──────────────────────────────────────
  useEffect(() => {
    if (isPreparingRun || !containerRef.current) return

    const currentEquipment = useInventoryStore.getState().equipment
    const currentProfile = usePlayerStore.getState().profile
    const currentGame = useGameStore.getState()

    gameRef.current = createGame(containerRef.current, {
      equippedWeaponId: currentEquipment?.equippedWeaponId ?? "tree_branch",
      equippedHandId: currentEquipment?.equippedHandId ?? "bare_hand",
      equippedBoxId: currentEquipment?.equippedBoxId ?? "basic_box",
      musicEnabled: currentGame.musicEnabled,
      sfxEnabled: currentGame.sfxEnabled,
      vibrationEnabled: currentGame.vibrationEnabled,
      quality: currentGame.quality,
      username: currentProfile?.username ?? "Player",
    })

    return () => {
      gameRef.current?.destroy(true)
      gameRef.current = null
      document.body.style.background = `#1a1a2e url('${BG_URLS[0]}') center center / cover no-repeat`
    }
  }, [isPreparingRun])
  // ↑ Intencional: creamos el juego una vez cuando la run limpia ya está preparada;
  //   los cambios posteriores se comunican a Phaser vía EventBus desde los stores.

  useEffect(() => {
    if (!gameRef.current || !equipment) return

    const weaponId = equipment.equippedWeaponId ?? "tree_branch"
    const handId = equipment.equippedHandId ?? "bare_hand"
    const boxId = equipment.equippedBoxId ?? "basic_box"

    gameRef.current.registry.set("equippedWeaponId", weaponId)
    gameRef.current.registry.set("equippedHandId", handId)
    gameRef.current.registry.set("equippedBoxId", boxId)
    EventBus.emit("EQUIPMENT_UPDATED", { weaponId, handId, boxId })
  }, [
    equipment?.equippedWeaponId,
    equipment?.equippedHandId,
    equipment?.equippedBoxId,
  ])

  // Salir: notifica a Phaser (si está activo) y navega
  const handleExit = useCallback(() => {
    EventBus.emit("EXIT_TO_HOME")
    navigate("/home")
  }, [navigate])

  const handleCloseShop = useCallback(() => {
    setShopOverlayOpen(false)
    closeShop()
    resumeRun()
  }, [closeShop, resumeRun])

  const handleShopRenderError = useCallback((_message: string) => {}, [])

  // ── Bridge Phaser → React ─────────────────────────────────
  useEffect(() => {
    const onScoreUpdated = (data: { runScore: number; totalCoins: number }) => {
      updateRunScore(data.runScore, data.totalCoins)
    }

    const onCoinsCollected = (data: { amount: number }) => {
      addCoins(data.amount)
    }

    const onComboUpdated = (combo: ComboState) => {
      updateCombo(combo)
    }

    // Phaser señala fin de partida → guardamos y navegamos
    const onRunEnded = (result: RunResult) => {
      setShopOverlayOpen(false)
      closeShop()
      endRun(result) // fire-and-forget; EndRunScreen muestra "Guardando…" mientras isSubmitting=true
      navigate("/end-run", { replace: true })
    }

    // Phaser quiere mostrar el menú de pausa (p.ej. botón físico Android)
    const onOpenPauseMenu = () => {
      showPauseMenu()
    }

    const onOpenShop = () => {
      ;(window as ShopBridgeWindow).__openShopOverlay?.("eventbus_OPEN_SHOP")
    }

    const onBrowserOpenShop = () => {
      ;(window as ShopBridgeWindow).__openShopOverlay?.("window_rp:open-shop")
    }

    // Phaser pide salir al home (p.ej. tiempo agotado + timeout de gracia)
    const onPhaserExitToHome = () => {
      navigate("/home", { replace: true })
    }

    const onBgChanged = (index: number) => {
      const url = BG_URLS[index]
      if (bgImgRef.current) bgImgRef.current.src = url
      document.body.style.background = `#1a1a2e url('${url}') center center / cover no-repeat`
    }

    EventBus.on("RUN_SCORE_UPDATED", onScoreUpdated)
    EventBus.on("COINS_COLLECTED", onCoinsCollected)
    EventBus.on("COMBO_UPDATED", onComboUpdated)
    EventBus.on("RUN_ENDED", onRunEnded)
    EventBus.on("OPEN_PAUSE_MENU", onOpenPauseMenu)
    EventBus.on("OPEN_SHOP", onOpenShop)
    EventBus.on("EXIT_TO_HOME", onPhaserExitToHome)
    EventBus.on("BG_CHANGED", onBgChanged)
    window.addEventListener("rp:open-shop", onBrowserOpenShop)

    return () => {
      EventBus.off("RUN_SCORE_UPDATED", onScoreUpdated)
      EventBus.off("COINS_COLLECTED", onCoinsCollected)
      EventBus.off("COMBO_UPDATED", onComboUpdated)
      EventBus.off("RUN_ENDED", onRunEnded)
      EventBus.off("OPEN_PAUSE_MENU", onOpenPauseMenu)
      EventBus.off("OPEN_SHOP", onOpenShop)
      EventBus.off("EXIT_TO_HOME", onPhaserExitToHome)
      EventBus.off("BG_CHANGED", onBgChanged)
      window.removeEventListener("rp:open-shop", onBrowserOpenShop)
    }
  }, [addCoins, updateRunScore, updateCombo, closeShop, endRun, showPauseMenu, navigate])

  if (isPreparingRun) {
    return <LoadingScreen />
  }

  return (
    <div
      style={{
        width: "100vw",
        height: "100dvh",
        background: "#1a1a2e",
        position: "relative",
        overflow: "hidden",
        fontFamily: FONT,
      }}
    >
      {/* Fondo sincronizado con el fondo activo del juego Phaser */}
      <img
        ref={bgImgRef}
        src={BG_URLS[0]}
        aria-hidden="true"
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          objectFit: "cover",
          zIndex: 0,
          pointerEvents: "none",
        }}
      />

      {/* Phaser canvas container — ocupa todo el espacio; Phaser gestiona su tamaño */}
      <div
        ref={containerRef}
        id="phaser-container"
        style={{
          position: "relative",
          width: "100%",
          height: "100%",
          zIndex: 1,
        }}
      />

      {isRunActive && <GameHUD onPause={pauseRun} />}

      {isPaused && !isShopVisible && (
        <PauseOverlay onResume={resumeRun} onExit={handleExit} />
      )}

      {isShopVisible && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            zIndex: 1000,
            background: C.bg,
          }}
        >
          <ShopRenderBoundary
            resetKey={`${isShopOpen}-${shopOverlayOpen}-${isShopVisible}`}
            onError={handleShopRenderError}
          >
            <ShopScreen embedded onBack={handleCloseShop} />
          </ShopRenderBoundary>
        </div>
      )}
    </div>
  )
}
