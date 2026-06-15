import { HeapEvent, MinHeap } from '../../shared/min-heap';
import { PlaybackStream } from '../../shared/playback-controls/playback-stream';

export type HeapOperation =
  | { kind: 'push'; value: number }
  | { kind: 'pop' };

export type PQEvent =
  | { kind: 'pq.start'; items: number[] }
  | { kind: 'pq.op-begin'; op: HeapOperation }
  | { kind: 'pq.op-end'; result?: number }
  | { kind: 'pq.done' }
  | HeapEvent<number>;

// Non-blocking. Brackets each operation with op-begin/op-end and lets the
// heap publish the mechanics. Yields to the event loop after every event so
// the UI can render and playback can advance before the script finishes.
export async function runPriorityQueue(
  initial: number[],
  operations: HeapOperation[],
  stream: PlaybackStream<PQEvent>,
): Promise<void> {
  const heap = new MinHeap<number>((a, b) => a - b, stream);
  for (const value of initial) await heap.push(value);
  await stream.emit({ kind: 'pq.start', items: initial.slice() });

  for (const op of operations) {
    await stream.emit({ kind: 'pq.op-begin', op });
    if (op.kind === 'push') {
      await heap.push(op.value);
      await stream.emit({ kind: 'pq.op-end' });
    } else {
      const result = await heap.pop();
      await stream.emit({ kind: 'pq.op-end', result });
    }
  }

  await stream.emit({ kind: 'pq.done' });
  stream.complete();
}
