import { useEffect, useRef } from 'react'
import { createGame } from './game/PhaserGame'
import type * as Phaser from 'phaser'

export function StandaloneGame() {
  const containerRef = useRef<HTMLDivElement>(null)
  const gameRef      = useRef<Phaser.Game | null>(null)

  useEffect(() => {
    if (!containerRef.current || gameRef.current) return

    gameRef.current = createGame(containerRef.current, {
      equippedWeaponId: 'hand_basic',
      equippedBoxId:    'small_box',
      musicEnabled:     true,
      sfxEnabled:       true,
      vibrationEnabled: false,
      quality:          'high',
      username:         'Dev',
    })

    return () => {
      gameRef.current?.destroy(true)
      gameRef.current = null
    }
  }, [])

  return (
    <div
      ref={containerRef}
      style={{ width: '100vw', height: '100dvh', background: "#1a1a2e url('/assets/bg.png') center top/auto 100% repeat-x" }}
    />
  )
}
