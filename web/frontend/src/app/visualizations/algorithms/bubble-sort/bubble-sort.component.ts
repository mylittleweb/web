import { Component, computed, DestroyRef } from '@angular/core';
import { RouterLink } from '@angular/router';
import { PlaybackControlsComponent } from '../../shared/playback-controls/playback-controls.component';
import { PlaybackController } from '../../shared/playback-controls/playback-controller';
import { PlaybackStream } from '../../shared/playback-controls/playback-stream';
import { bubbleSort, BubbleSortEvent } from './bubble-sort.algorithm';

interface Bar {
  id: number;
  value: number;
  position: number;
  x: number;
  y: number;
  height: number;
  cssClass: string;
}

const INPUT = [5, 3, 8, 4, 7, 2, 6, 1];
const CHART_HEIGHT = 280;
const CHART_PADDING = 20;
const BAR_GAP = 8;
const BAR_WIDTH = 48;
const LABEL_ROOM = 16;

@Component({
  selector: 'bubble-sort',
  standalone: true,
  imports: [RouterLink, PlaybackControlsComponent],
  templateUrl: './bubble-sort.component.html',
  styleUrl: './bubble-sort.component.scss',
})
export class BubbleSortComponent {
  readonly chartHeight = CHART_HEIGHT;
  readonly barWidth = BAR_WIDTH;

  private readonly stream = new PlaybackStream<BubbleSortEvent>();
  readonly playback = new PlaybackController<BubbleSortEvent>(this.stream);

  constructor(destroyRef: DestroyRef) {
    destroyRef.onDestroy(() => this.playback.destroy());
    void bubbleSort(INPUT, this.stream);
  }

  private readonly derived = computed(() => deriveState(this.playback.history()));

  readonly bars = computed(() => this.derived().bars[this.playback.stepIndex()] ?? []);
  readonly description = computed(() =>
    describe(this.playback.currentEvent(), this.derived().arrays[this.playback.stepIndex()]),
  );

  readonly viewBox = computed(() => {
    const n = INPUT.length;
    const width = CHART_PADDING * 2 + n * BAR_WIDTH + (n - 1) * BAR_GAP;
    return `0 0 ${width} ${CHART_HEIGHT}`;
  });
}

interface DerivedState {
  arrays: number[][];
  bars: Bar[][];
}

function deriveState(history: BubbleSortEvent[]): DerivedState {
  const arrays: number[][] = [];
  const bars: Bar[][] = [];

  if (history.length === 0) return { arrays, bars };

  const startEvent = history[0];
  if (startEvent.kind !== 'bubble-sort.start') return { arrays, bars };

  const initial = [...startEvent.array];
  const n = initial.length;
  const maxValue = Math.max(...initial);

  const working = [...initial];
  const permutation = Array.from({ length: n }, (_, i) => i);
  let sortedFrom = n;

  for (const event of history) {
    if (event.kind === 'bubble-sort.swap') {
      const { i, j } = event;
      [working[i], working[j]] = [working[j], working[i]];
      [permutation[i], permutation[j]] = [permutation[j], permutation[i]];
    } else if (event.kind === 'bubble-sort.pass-end') {
      sortedFrom = event.sortedFrom;
    } else if (event.kind === 'bubble-sort.done') {
      sortedFrom = 0;
    }

    arrays.push([...working]);
    bars.push(makeBars(initial, permutation, event, sortedFrom, maxValue, n));
  }

  return { arrays, bars };
}

function makeBars(
  initial: number[],
  permutation: number[],
  event: BubbleSortEvent,
  sortedFrom: number,
  maxValue: number,
  n: number,
): Bar[] {
  const positionOf = new Array<number>(n);
  for (let pos = 0; pos < n; pos++) {
    positionOf[permutation[pos]] = pos;
  }

  const heightArea = CHART_HEIGHT - CHART_PADDING * 2 - LABEL_ROOM;
  const bars: Bar[] = [];
  for (let id = 0; id < n; id++) {
    const value = initial[id];
    const position = positionOf[id];
    const x = CHART_PADDING + position * (BAR_WIDTH + BAR_GAP);
    const height = (value / maxValue) * heightArea;
    const y = CHART_HEIGHT - CHART_PADDING - height - LABEL_ROOM;
    bars.push({
      id,
      value,
      position,
      x,
      y,
      height,
      cssClass: classify(event, position, sortedFrom),
    });
  }
  return bars;
}

function classify(event: BubbleSortEvent, position: number, sortedFrom: number): string {
  if (event.kind === 'bubble-sort.compare' && (position === event.i || position === event.j)) {
    return 'compare';
  }
  if (event.kind === 'bubble-sort.swap' && (position === event.i || position === event.j)) {
    return 'swap';
  }
  if (event.kind === 'bubble-sort.done' || position >= sortedFrom) {
    return 'sorted';
  }
  return '';
}

function describe(event: BubbleSortEvent | undefined, arr: number[] | undefined): string {
  if (!event || !arr) return '';
  switch (event.kind) {
    case 'bubble-sort.start':
      return `Starting bubble sort on ${event.array.length} elements.`;
    case 'bubble-sort.compare':
      return `Compare positions ${event.i} and ${event.j}: ${arr[event.i]} vs ${arr[event.j]}.`;
    case 'bubble-sort.swap':
      return `Swap positions ${event.i} and ${event.j}.`;
    case 'bubble-sort.pass-end':
      return `Pass complete. Position ${event.sortedFrom} is now in its final place.`;
    case 'bubble-sort.done':
      return 'Sorted.';
  }
}
