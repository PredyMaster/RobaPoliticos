import * as Phaser from 'phaser'
import { BootScene } from '../scenes/BootScene'
import { PreloadScene } from '../scenes/PreloadScene'
import { GameScene } from '../scenes/GameScene'
import { UIScene } from '../scenes/UIScene'
import { GameOverScene } from '../scenes/GameOverScene'
import { PHYSICS_CONFIG } from './physicsConfig'

export function buildGameConfig(parent: HTMLElement): Phaser.Types.Core.GameConfig {
  return {
    type: Phaser.AUTO,
    parent,
    backgroundColor: '#1a1a2e',
    antialias: true,
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH,
      width: 1920,
      height: 1080,
      expandParent: false,
    },
    physics: PHYSICS_CONFIG,
    scene: [BootScene, PreloadScene, GameScene, UIScene, GameOverScene],
    banner: false,
    title: 'Roba Políticos',
    version: '0.1.0',
  }
}
