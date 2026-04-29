import * as Phaser from 'phaser'

export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' })
  }

  preload(): void {
    // Carga mínima necesaria para mostrar la barra de progreso en PreloadScene
    // (por ahora sin assets externos)
  }

  create(): void {
    this.scene.start('PreloadScene')
  }
}
