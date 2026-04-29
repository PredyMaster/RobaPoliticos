import * as Phaser from 'phaser'
import type { GameEventKey, GameEventMap } from './types/game'

// Singleton tipado que comunica Phaser ↔ React
class TypedEventBus extends Phaser.Events.EventEmitter {
  emit<K extends GameEventKey>(
    event: K,
    ...args: GameEventMap[K] extends undefined ? [] : [GameEventMap[K]]
  ): boolean {
    return super.emit(event, ...args)
  }

  on<K extends GameEventKey>(
    event: K,
    fn: (data: GameEventMap[K]) => void,
    context?: unknown,
  ): this {
    return super.on(event, fn, context)
  }

  once<K extends GameEventKey>(
    event: K,
    fn: (data: GameEventMap[K]) => void,
    context?: unknown,
  ): this {
    return super.once(event, fn, context)
  }

  off<K extends GameEventKey>(
    event: K,
    fn?: (data: GameEventMap[K]) => void,
    context?: unknown,
  ): this {
    return super.off(event, fn, context)
  }
}

export const EventBus = new TypedEventBus()
