import Phaser from 'phaser'
import { buildGameConfig } from './config/gameConfig'
import type { GraphicsQuality } from './types/game'

export type PhaserGameData = {
  equippedWeaponId: string
  equippedBoxId: string
  musicEnabled: boolean
  sfxEnabled: boolean
  vibrationEnabled: boolean
  quality: GraphicsQuality
  username: string
}

export function createGame(parent: HTMLElement, data: PhaserGameData): Phaser.Game {
  const game = new Phaser.Game(buildGameConfig(parent))

  // 'ready' dispara tras el boot completo, antes de que cualquier escena ejecute create()
  game.events.once('ready', () => {
    game.registry.set('equippedWeaponId', data.equippedWeaponId)
    game.registry.set('equippedBoxId',    data.equippedBoxId)
    game.registry.set('musicEnabled',     data.musicEnabled)
    game.registry.set('sfxEnabled',       data.sfxEnabled)
    game.registry.set('vibrationEnabled', data.vibrationEnabled)
    game.registry.set('quality',          data.quality)
    game.registry.set('username',         data.username)
  })

  return game
}
