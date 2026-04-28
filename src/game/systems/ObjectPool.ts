export class ObjectPool<T> {
  private readonly available: T[] = []
  private readonly acquired = new Set<T>()
  private readonly factory: () => T

  constructor(factory: () => T, initialSize = 0) {
    this.factory = factory
    for (let i = 0; i < initialSize; i++) {
      this.available.push(factory())
    }
  }

  acquire(): T {
    const obj = this.available.pop() ?? this.factory()
    this.acquired.add(obj)
    return obj
  }

  release(obj: T): void {
    this.acquired.delete(obj)
    this.available.push(obj)
  }

  /** Snapshot of currently active (acquired) objects — safe to iterate while releasing */
  getActive(): T[] {
    return [...this.acquired]
  }

  get availableCount(): number { return this.available.length }
  get activeCount(): number    { return this.acquired.size }
}
