import { create } from 'zustand'
import type { GraphicsQuality, RunResult, ComboState } from '../game/types/game'
import type { SubmitRunResult } from '../game/types/player'
import { submitRun } from '../services/local/runs'
import { usePlayerStore } from './usePlayerStore'
import { EventBus } from '../game/EventBus'

type GameState = {
  isPaused: boolean
  isRunActive: boolean
  isShopOpen: boolean
  runScore: number
  runCoins: number
  runCombo: ComboState | null
  lastRunResult: RunResult | null
  lastSubmitResult: SubmitRunResult | null
  isSubmitting: boolean
  musicEnabled: boolean
  sfxEnabled: boolean
  vibrationEnabled: boolean
  quality: GraphicsQuality
}

type GameActions = {
  // Llamado desde React UI → notifica a Phaser vía EventBus
  startRun: () => void
  pauseRun: () => void
  resumeRun: () => void

  // Llamado cuando Phaser inicia la pausa (evita reemisión circular)
  showPauseMenu: () => void
  openShop: () => void
  closeShop: () => void

  // Actualizaciones desde Phaser → React (vía EventBus handlers en GameScreen)
  updateRunScore: (score: number, coins: number) => void
  updateCombo: (combo: ComboState) => void

  // Finalizar partida: guarda y persiste el resultado localmente
  endRun: (result: RunResult) => Promise<void>

  // Preferencias rápidas (se sincronizan con usePlayerStore.setPreferences)
  setMusicEnabled: (value: boolean) => void
  setSfxEnabled: (value: boolean) => void
  setVibrationEnabled: (value: boolean) => void
  setQuality: (value: GraphicsQuality) => void

  // Sincronizar desde PlayerStore al montar la app
  syncPreferences: () => void
}

export const useGameStore = create<GameState & GameActions>((set) => ({
  isPaused: false,
  isRunActive: false,
  isShopOpen: false,
  runScore: 0,
  runCoins: 0,
  runCombo: null,
  lastRunResult: null,
  lastSubmitResult: null,
  isSubmitting: false,
  musicEnabled: true,
  sfxEnabled: true,
  vibrationEnabled: true,
  quality: 'high',

  startRun: () => {
    set({ isRunActive: true, isPaused: false, isShopOpen: false, runScore: 0, runCoins: 0, runCombo: null, lastRunResult: null, lastSubmitResult: null })
    EventBus.emit('RUN_STARTED')
  },

  // Pausa iniciada por React (botón HUD) → Phaser debe pausar
  pauseRun: () => {
    set({ isPaused: true, isShopOpen: false })
    EventBus.emit('RUN_PAUSED')
  },

  // Pausa iniciada por Phaser (OPEN_PAUSE_MENU) → solo actualiza UI sin reemitir
  showPauseMenu: () => set({ isPaused: true, isShopOpen: false }),

  openShop: () => set({ isPaused: true, isShopOpen: true }),

  closeShop: () => set({ isShopOpen: false }),

  // Reanudar desde React → Phaser debe reanudar
  resumeRun: () => {
    set({ isPaused: false, isShopOpen: false })
    EventBus.emit('RUN_RESUMED')
  },

  updateRunScore: (score, coins) => set({ runScore: score, runCoins: coins }),

  updateCombo: (combo) => set({ runCombo: combo }),

  endRun: async (result) => {
    set({ isRunActive: false, isPaused: false, isShopOpen: false, lastRunResult: result, isSubmitting: true })

    const submitResult = await submitRun(result)
    set({ lastSubmitResult: submitResult, isSubmitting: false })
  },

  setMusicEnabled: (value) => {
    set({ musicEnabled: value })
    usePlayerStore.getState().setPreferences({ musicEnabled: value })
  },

  setSfxEnabled: (value) => {
    set({ sfxEnabled: value })
    usePlayerStore.getState().setPreferences({ sfxEnabled: value })
  },

  setVibrationEnabled: (value) => {
    set({ vibrationEnabled: value })
    usePlayerStore.getState().setPreferences({ vibrationEnabled: value })
  },

  setQuality: (value) => {
    set({ quality: value })
    usePlayerStore.getState().setPreferences({ graphicsQuality: value })
  },

  syncPreferences: () => {
    const { preferences } = usePlayerStore.getState()
    if (!preferences) return
    set({
      musicEnabled:     preferences.musicEnabled,
      sfxEnabled:       preferences.sfxEnabled,
      vibrationEnabled: preferences.vibrationEnabled,
      quality:          preferences.graphicsQuality,
    })
  },
}))
