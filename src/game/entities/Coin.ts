import Phaser from 'phaser'
import type { CoinTypeId, CoinState } from '../types/game'
import { COIN_LIFETIME_MS } from '../data/coins'

const TEXTURE_MAP: Record<CoinTypeId, string> = {
  normal_coin:     'coin_normal',
  silver_coin:     'coin_silver',
  gold_coin:       'coin_gold',
  money_bill:      'money_bill',
  gem:             'gem',
  multiplier_coin: 'multiplier_coin',
  magnet_coin:     'magnet_coin',
  bomb_coin:       'bomb_coin',
}

export class Coin extends Phaser.Physics.Arcade.Sprite {
  coinState!: CoinState

  constructor(scene: Phaser.Scene) {
    super(scene, 0, 0, 'coin_normal')
    scene.add.existing(this)
    scene.physics.add.existing(this)
    this.setActive(false).setVisible(false)

    const body = this.body as Phaser.Physics.Arcade.Body
    body.setEnable(false)
    body.setBounce(0.35)
    body.setCollideWorldBounds(false)
  }

  reset(x: number, y: number, vx: number, vy: number, type: CoinTypeId, value: number): void {
    this.setTexture(TEXTURE_MAP[type])
    this.setPosition(x, y)
    this.setActive(true).setVisible(true)

    const body = this.body as Phaser.Physics.Arcade.Body
    body.setEnable(true)
    body.setVelocity(vx, vy)

    this.coinState = {
      type,
      value,
      active: true,
      spawnTime: Date.now(),
      maxLifeTime: COIN_LIFETIME_MS,
    }
  }

  despawn(): void {
    this.setActive(false).setVisible(false)
    const body = this.body as Phaser.Physics.Arcade.Body
    body.setVelocity(0, 0)
    body.setEnable(false)
    if (this.coinState) this.coinState.active = false
  }
}
