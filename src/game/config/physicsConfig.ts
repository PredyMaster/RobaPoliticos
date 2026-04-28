import Phaser from 'phaser'

export const PHYSICS_CONFIG: Phaser.Types.Core.PhysicsConfig = {
  default: 'arcade',
  arcade: {
    gravity: { x: 0, y: 1000 },
    // Bounce y fricción se configuran por cuerpo en Coin.ts
    debug: false,
  },
}
