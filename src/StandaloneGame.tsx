import { useEffect, useRef } from "react"
import { createGame } from "./game/PhaserGame"
import { EventBus } from "./game/EventBus"
import type * as Phaser from "phaser"

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

export function StandaloneGame() {
  const containerRef = useRef<HTMLDivElement>(null)
  const gameRef = useRef<Phaser.Game | null>(null)
  const bgImgRef = useRef<HTMLImageElement>(null)

  // Fuerza el fondo del body al inicial, sobrescribiendo cualquier caché de index.html
  useEffect(() => {
    document.body.style.background = `#1a1a2e url('${BG_URLS[0]}') center center / cover no-repeat`
    return () => { document.body.style.background = "" }
  }, [])

  useEffect(() => {
    if (!containerRef.current || gameRef.current) return

    gameRef.current = createGame(containerRef.current, {
      equippedWeaponId: "hand_basic",
      equippedBoxId: "small_box",
      musicEnabled: true,
      sfxEnabled: true,
      vibrationEnabled: false,
      quality: "high",
      username: "Dev",
    })

    return () => {
      gameRef.current?.destroy(true)
      gameRef.current = null
    }
  }, [])

  // Sincroniza el fondo HTML con el fondo activo del juego Phaser
  useEffect(() => {
    const onBgChanged = (index: number) => {
      const url = BG_URLS[index]
      if (bgImgRef.current) bgImgRef.current.src = url
      document.body.style.background = `#1a1a2e url('${url}') center center / cover no-repeat`
    }

    EventBus.on("BG_CHANGED", onBgChanged)
    return () => { EventBus.off("BG_CHANGED", onBgChanged) }
  }, [])

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        background: "#1a1a2e",
        position: "relative",
        overflow: "hidden",
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

      {/* Phaser canvas container */}
      <div
        ref={containerRef}
        style={{ position: "relative", width: "100%", height: "100%", zIndex: 1 }}
      />
    </div>
  )
}
