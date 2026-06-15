// Events the heap can publish when given a sink. Heap callers without a sink
// pay nothing — push/pop look like a normal heap.
export type HeapEvent<T> =
  | { kind: 'heap.append'; index: number; value: T }
  | { kind: 'heap.compare'; i: number; j: number; result: 'in-order' | 'out-of-order' }
  | { kind: 'heap.swap'; i: number; j: number }
  | { kind: 'heap.sift-stop'; index: number; reason: string }
  | { kind: 'heap.extract'; value: T; replacement?: { value: T; from: number } };

// Structural input type: anything with an async `emit(event)` accepting
// `HeapEvent<T>` works. A `PlaybackStream<HeapEvent<T>>` qualifies, but so
// does a `PlaybackStream<E>` where `E` is any union that includes
// `HeapEvent<T>` (e.g. an algorithm's event union).
export interface HeapEventSink<T> {
  emit(event: HeapEvent<T>): Promise<void>;
}

// Binary min-heap. push/pop are async only so each emitted event can yield
// to the event loop — when no sink is attached, the awaits short-circuit and
// the heap behaves like a normal sync heap.
export class MinHeap<T> {
  private readonly items: T[] = [];

  constructor(
    private readonly compare: (a: T, b: T) => number,
    private readonly sink?: HeapEventSink<T>,
  ) {}

  get size(): number {
    return this.items.length;
  }

  peek(): T | undefined {
    return this.items[0];
  }

  async push(item: T): Promise<void> {
    this.items.push(item);
    await this.emit({ kind: 'heap.append', index: this.items.length - 1, value: item });
    await this.siftUp(this.items.length - 1);
  }

  async pop(): Promise<T | undefined> {
    if (this.items.length === 0) return undefined;
    const top = this.items[0];

    if (this.items.length === 1) {
      this.items.pop();
      await this.emit({ kind: 'heap.extract', value: top });
      return top;
    }

    const last = this.items.pop()!;
    const from = this.items.length;
    this.items[0] = last;
    await this.emit({
      kind: 'heap.extract',
      value: top,
      replacement: { value: last, from },
    });
    await this.siftDown(0);
    return top;
  }

  private async siftUp(start: number): Promise<void> {
    let i = start;
    while (i > 0) {
      const parent = (i - 1) >> 1;
      if (this.compare(this.items[i], this.items[parent]) >= 0) {
        await this.emit({ kind: 'heap.compare', i, j: parent, result: 'in-order' });
        await this.emit({ kind: 'heap.sift-stop', index: i, reason: 'in-order with parent' });
        return;
      }
      await this.emit({ kind: 'heap.compare', i, j: parent, result: 'out-of-order' });
      this.swap(i, parent);
      await this.emit({ kind: 'heap.swap', i, j: parent });
      i = parent;
    }
    await this.emit({ kind: 'heap.sift-stop', index: i, reason: 'reached root' });
  }

  private async siftDown(start: number): Promise<void> {
    let i = start;
    const n = this.items.length;
    while (true) {
      const left = i * 2 + 1;
      const right = i * 2 + 2;
      if (left >= n) {
        await this.emit({ kind: 'heap.sift-stop', index: i, reason: 'no children' });
        return;
      }
      const smaller =
        right < n && this.compare(this.items[right], this.items[left]) < 0
          ? right
          : left;
      if (this.compare(this.items[i], this.items[smaller]) <= 0) {
        await this.emit({ kind: 'heap.compare', i, j: smaller, result: 'in-order' });
        await this.emit({ kind: 'heap.sift-stop', index: i, reason: 'in-order with children' });
        return;
      }
      await this.emit({ kind: 'heap.compare', i, j: smaller, result: 'out-of-order' });
      this.swap(i, smaller);
      await this.emit({ kind: 'heap.swap', i, j: smaller });
      i = smaller;
    }
  }

  private async emit(event: HeapEvent<T>): Promise<void> {
    if (this.sink) await this.sink.emit(event);
  }

  private swap(i: number, j: number): void {
    [this.items[i], this.items[j]] = [this.items[j], this.items[i]];
  }
}
