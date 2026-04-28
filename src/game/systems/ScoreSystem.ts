import Phaser from 'phaser'
import type { CoinTypeId, ComboState } from '../types/game'
import { EventBus } from '../EventBus'

type CoinCaughtEvent = { baseValue: number; coinType: CoinTypeId }

export class ScoreSystem {
  private readonly scene: Phaser.Scene
  private runScore       = 0
  private totalCoins     = 0
  private comboMultiplier = 1

  constructor(scene: Phaser.Scene) {
    this.scene = scene
    scene.events.on('coin:caught',   this.onCoinCaught,   this)
    scene.events.on('combo:changed', this.onComboChanged, this)
  }

  getScore(): number  { return this.runScore }
  getCoins(): number  { return this.totalCoins }

  reset(): void {
    this.runScore       = 0
    this.totalCoins     = 0
    this.comboMultiplier = 1
  }

  private onComboChanged(combo: ComboState): void {
    this.comboMultiplier = combo.multiplier
  }

  private onCoinCaught({ baseValue, coinType }: CoinCaughtEvent): void {
    if (baseValue <= 0) return  // special coins have value 0

    const finalValue = Math.round(baseValue * this.comboMultiplier)
    this.runScore   += finalValue
    this.totalCoins++

    EventBus.emit('RUN_SCORE_UPDATED', { runScore: this.runScore, totalCoins: this.totalCoins })
    EventBus.emit('COINS_COLLECTED',   { amount: 1, coinType })
  }

  destroy(): void {
    this.scene.events.off('coin:caught',   this.onCoinCaught,   this)
    this.scene.events.off('combo:changed', this.onComboChanged, this)
  }
}
