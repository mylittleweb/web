import { Component, computed, DestroyRef } from '@angular/core';
import { RouterLink } from '@angular/router';
import { PlaybackControlsComponent } from '../../shared/playback-controls/playback-controls.component';
import { PlaybackController } from '../../shared/playback-controls/playback-controller';
import { PlaybackStream } from '../../shared/playback-controls/playback-stream';
import { HeapOperation, PQEvent, runPriorityQueue } from './priority-queue.driver';

interface SlotView {
  index: number;
  value: number | null;
  x: number;
  y: number;
  cssClass: string;
}

interface EdgeView {
  id: string;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  cssClass: string;
}

interface ArrayCell {
  index: number;
  value: number;
  cssClass: string;
}

interface StepState {
  items: number[];
  highlight: Set<number>;
  swapping: Set<number>;
  appendedIndex?: number;
  outputs: number[];
}

const INITIAL: number[] = [];
const OPERATIONS: HeapOperation[] = [
  { kind: 'push', value: 7 },
  { kind: 'push', value: 3 },
  { kind: 'push', value: 9 },
  { kind: 'push', value: 1 },
  { kind: 'push', value: 5 },
  { kind: 'push', value: 8 },
  { kind: 'push', value: 2 },
  { kind: 'push', value: 6 },
  { kind: 'pop' },
  { kind: 'pop' },
  { kind: 'pop' },
];

const LEVELS = 4;
const NODE_RADIUS = 22;
const LEVEL_HEIGHT = 80;
const ROW_PAD_X = 30;
const TREE_WIDTH = 800;
const TREE_HEIGHT = LEVELS * LEVEL_HEIGHT + 20;

@Component({
  selector: 'priority-queue',
  standalone: true,
  imports: [RouterLink, PlaybackControlsComponent],
  templateUrl: './priority-queue.component.html',
  styleUrl: './priority-queue.component.scss',
})
export class PriorityQueueComponent {
  readonly nodeRadius = NODE_RADIUS;
  readonly treeViewBox = `0 0 ${TREE_WIDTH} ${TREE_HEIGHT}`;

  private readonly stream = new PlaybackStream<PQEvent>();
  readonly playback = new PlaybackController<PQEvent>(this.stream);

  constructor(destroyRef: DestroyRef) {
    destroyRef.onDestroy(() => this.playback.destroy());
    void runPriorityQueue(INITIAL, OPERATIONS, this.stream);
  }

  private readonly states = computed(() => deriveStates(this.playback.history()));

  readonly currentState = computed(
    () => this.states()[this.playback.stepIndex()] ?? emptyState(),
  );

  readonly slots = computed(() => buildSlots(this.currentState()));
  readonly edges = computed(() => buildEdges(this.currentState()));
  readonly cells = computed(() => buildCells(this.currentState()));
  readonly outputs = computed(() => this.currentState().outputs);
  readonly description = computed(() => describe(this.playback.currentEvent()));
}

function emptyState(): StepState {
  return { items: [], highlight: new Set(), swapping: new Set(), outputs: [] };
}

function deriveStates(history: PQEvent[]): StepState[] {
  const states: StepState[] = [];
  let items: number[] = [];
  const outputs: number[] = [];

  for (const event of history) {
    const step: StepState = {
      items: items.slice(),
      highlight: new Set<number>(),
      swapping: new Set<number>(),
      outputs: outputs.slice(),
    };

    switch (event.kind) {
      case 'pq.start':
        items = [...event.items];
        step.items = items.slice();
        break;
      case 'pq.op-begin':
        break;
      case 'heap.append':
        items = [...items, event.value];
        step.items = items.slice();
        step.appendedIndex = event.index;
        step.highlight = new Set([event.index]);
        break;
      case 'heap.extract':
        if (event.replacement) {
          items = [event.replacement.value, ...items.slice(1, -1)];
        } else {
          items = [];
        }
        step.items = items.slice();
        step.highlight = new Set([0]);
        break;
      case 'heap.compare':
        step.highlight = new Set([event.i, event.j]);
        break;
      case 'heap.swap':
        [items[event.i], items[event.j]] = [items[event.j], items[event.i]];
        step.items = items.slice();
        step.swapping = new Set([event.i, event.j]);
        step.highlight = new Set([event.i, event.j]);
        break;
      case 'heap.sift-stop':
        step.highlight = new Set([event.index]);
        break;
      case 'pq.op-end':
        if (event.result !== undefined) {
          outputs.push(event.result);
          step.outputs = outputs.slice();
        }
        break;
      case 'pq.done':
        break;
    }

    states.push(step);
  }

  return states;
}

function levelOfIndex(index: number): number {
  return Math.floor(Math.log2(index + 1));
}

function xOfIndex(index: number): number {
  const level = levelOfIndex(index);
  const countOnLevel = 1 << level;
  const positionOnLevel = index - (countOnLevel - 1);
  const usable = TREE_WIDTH - ROW_PAD_X * 2;
  const step = usable / countOnLevel;
  return ROW_PAD_X + step * (positionOnLevel + 0.5);
}

function yOfIndex(index: number): number {
  const level = levelOfIndex(index);
  return 30 + level * LEVEL_HEIGHT;
}

function buildSlots(state: StepState): SlotView[] {
  const slots: SlotView[] = [];
  for (let i = 0; i < state.items.length; i++) {
    slots.push({
      index: i,
      value: state.items[i],
      x: xOfIndex(i),
      y: yOfIndex(i),
      cssClass: classifySlot(state, i),
    });
  }
  return slots;
}

function classifySlot(state: StepState, index: number): string {
  const classes: string[] = [];
  if (index === 0) classes.push('root');
  if (state.swapping.has(index)) classes.push('swap');
  else if (state.highlight.has(index)) classes.push('active');
  if (state.appendedIndex === index) classes.push('appended');
  return classes.join(' ');
}

function buildEdges(state: StepState): EdgeView[] {
  const edges: EdgeView[] = [];
  for (let i = 1; i < state.items.length; i++) {
    const parent = (i - 1) >> 1;
    const cssClass = state.swapping.has(i) && state.swapping.has(parent) ? 'swap' : '';
    edges.push({
      id: `${parent}-${i}`,
      x1: xOfIndex(parent),
      y1: yOfIndex(parent),
      x2: xOfIndex(i),
      y2: yOfIndex(i),
      cssClass,
    });
  }
  return edges;
}

function buildCells(state: StepState): ArrayCell[] {
  return state.items.map((value, index) => ({
    index,
    value,
    cssClass: classifySlot(state, index),
  }));
}

function describe(event: PQEvent | undefined): string {
  if (!event) return '';
  switch (event.kind) {
    case 'pq.start':
      return event.items.length === 0
        ? 'Heap starts empty.'
        : `Heap initialized with ${event.items.length} elements.`;
    case 'pq.op-begin':
      return event.op.kind === 'push'
        ? `push(${event.op.value}) — insert at the end, then sift up.`
        : 'pop() — extract the root, move the last element up, then sift down.';
    case 'heap.append':
      return `Append ${event.value} at index ${event.index}.`;
    case 'heap.extract':
      return event.replacement
        ? `Extract root ${event.value}. Move ${event.replacement.value} from index ${event.replacement.from} to root.`
        : `Extract root ${event.value}. Heap is now empty.`;
    case 'heap.compare': {
      const order = event.result === 'in-order' ? 'in heap order' : 'out of heap order';
      return `Compare indices ${event.i} and ${event.j} — ${order}.`;
    }
    case 'heap.swap':
      return `Swap indices ${event.i} and ${event.j}.`;
    case 'heap.sift-stop':
      return `Stop at index ${event.index}: ${event.reason}.`;
    case 'pq.op-end':
      return event.result !== undefined
        ? `Returned ${event.result}.`
        : 'Operation complete.';
    case 'pq.done':
      return 'All operations complete.';
  }
}
