import { PlaybackStream } from '../../shared/playback-controls/playback-stream';

export type BubbleSortEvent =
  | { kind: 'bubble-sort.start'; array: number[] }
  | { kind: 'bubble-sort.compare'; i: number; j: number }
  | { kind: 'bubble-sort.swap'; i: number; j: number }
  | { kind: 'bubble-sort.pass-end'; sortedFrom: number }
  | { kind: 'bubble-sort.done' };

// Non-blocking: yields to the event loop after every event so the UI can
// render and playback can advance before the algorithm finishes.
export async function bubbleSort(input: number[], stream: PlaybackStream<BubbleSortEvent>): Promise<void> {
  const arr = [...input];
  const n = arr.length;

  await stream.emit({ kind: 'bubble-sort.start', array: [...arr] });

  for (let pass = 0; pass < n - 1; pass++) {
    let swapped = false;
    const limit = n - 1 - pass;

    for (let i = 0; i < limit; i++) {
      const j = i + 1;
      await stream.emit({ kind: 'bubble-sort.compare', i, j });

      if (arr[i] > arr[j]) {
        [arr[i], arr[j]] = [arr[j], arr[i]];
        swapped = true;
        await stream.emit({ kind: 'bubble-sort.swap', i, j });
      }
    }

    await stream.emit({ kind: 'bubble-sort.pass-end', sortedFrom: limit });

    if (!swapped) break;
  }

  await stream.emit({ kind: 'bubble-sort.done' });
  stream.complete();
}
