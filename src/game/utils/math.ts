import type { LevelInfo } from '../types/economy'

// ── Progresión de nivel ──────────────────────────────────────

export function calculateLevel(totalScore: number): number {
  return Math.floor(Math.sqrt(totalScore / 100)) + 1
}

export function scoreForLevel(level: number): number {
  // inversa de calculateLevel: score mínimo para llegar a ese nivel
  return Math.pow(level - 1, 2) * 100
}

export function getLevelInfo(totalScore: number): LevelInfo {
  const level = calculateLevel(totalScore)
  const current = scoreForLevel(level)
  const next = scoreForLevel(level + 1)
  const range = next - current
  const progress = range > 0 ? (totalScore - current) / range : 1
  return { level, totalScore, scoreForNextLevel: next, progress }
}

// ── Economía ─────────────────────────────────────────────────

export function calculateUpgradePrice(basePrice: number, level: number): number {
  return Math.round(basePrice * Math.pow(1.18, level))
}

// ── Combo ────────────────────────────────────────────────────

export function comboMultiplier(comboCount: number): number {
  if (comboCount >= 50) return 5.0
  if (comboCount >= 20) return 3.5
  if (comboCount >= 10) return 2.5
  if (comboCount >= 5)  return 1.8
  if (comboCount >= 2)  return 1.3
  return 1.0
}

// ── Swipe ────────────────────────────────────────────────────

export function swipeStrength(speed: number, distance: number): number {
  const speedFactor    = Math.min(speed / 3, 1)       // satura a 3 px/ms
  const distanceFactor = Math.min(distance / 200, 1)  // satura a 200 px
  return (speedFactor * 0.6 + distanceFactor * 0.4)
}

// ── Vectores ─────────────────────────────────────────────────

export function normalize(x: number, y: number): { x: number; y: number } {
  const len = Math.sqrt(x * x + y * y)
  if (len === 0) return { x: 0, y: -1 }
  return { x: x / len, y: y / len }
}

export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value))
}

export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * clamp(t, 0, 1)
}

export function angleBetween(x1: number, y1: number, x2: number, y2: number): number {
  return Math.atan2(y2 - y1, x2 - x1)
}
