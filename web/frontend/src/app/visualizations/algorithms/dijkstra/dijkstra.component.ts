import { Component, computed, DestroyRef } from '@angular/core';
import { RouterLink } from '@angular/router';
import { PlaybackControlsComponent } from '../../shared/playback-controls/playback-controls.component';
import { PlaybackController } from '../../shared/playback-controls/playback-controller';
import { PlaybackStream } from '../../shared/playback-controls/playback-stream';
import { dijkstra, DijkstraEvent, PQEntry } from './dijkstra.algorithm';
import { Graph, GraphEdge, GraphNode, SAMPLE_GRAPH } from './dijkstra.graph';

interface NodeView {
  id: string;
  x: number;
  y: number;
  distanceLabel: string;
  cssClass: string;
}

interface EdgeView {
  id: string;
  weight: number;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  labelX: number;
  labelY: number;
  cssClass: string;
}

interface PQView {
  node: string;
  distance: number;
  cssClass: string;
}

interface StepState {
  distances: Map<string, number>;
  settled: Set<string>;
  predecessor: Map<string, string>;
  pq: PQEntry[];
  poppedNode?: string;
  examiningEdge?: { from: string; to: string };
  improvedNode?: string;
  pushedNode?: string;
  staleNode?: string;
}

@Component({
  selector: 'dijkstra',
  standalone: true,
  imports: [RouterLink, PlaybackControlsComponent],
  templateUrl: './dijkstra.component.html',
  styleUrl: './dijkstra.component.scss',
})
export class DijkstraComponent {
  readonly graph: Graph = SAMPLE_GRAPH;

  private readonly stream = new PlaybackStream<DijkstraEvent>();
  readonly playback = new PlaybackController<DijkstraEvent>(this.stream);

  constructor(destroyRef: DestroyRef) {
    destroyRef.onDestroy(() => this.playback.destroy());
    void dijkstra(this.graph, this.stream);
  }

  private readonly states = computed(() => deriveStates(this.graph, this.playback.history()));

  readonly currentState = computed(
    () => this.states()[this.playback.stepIndex()] ?? emptyState(this.graph),
  );

  readonly nodes = computed(() => buildNodeViews(this.graph, this.currentState()));
  readonly edges = computed(() => buildEdgeViews(this.graph, this.currentState()));
  readonly pq = computed(() => buildPQView(this.currentState()));
  readonly description = computed(() => describe(this.playback.currentEvent()));
}

function emptyState(graph: Graph): StepState {
  return {
    distances: new Map(graph.nodes.map((n) => [n.id, n.id === graph.source ? 0 : Infinity])),
    settled: new Set(),
    predecessor: new Map(),
    pq: [],
  };
}

function deriveStates(graph: Graph, history: DijkstraEvent[]): StepState[] {
  const states: StepState[] = [];
  const distances = new Map<string, number>(
    graph.nodes.map((n) => [n.id, n.id === graph.source ? 0 : Infinity]),
  );
  const settled = new Set<string>();
  const predecessor = new Map<string, string>();
  let pq: PQEntry[] = [];
  let poppedNode: string | undefined;

  for (const event of history) {
    const step: StepState = {
      distances: new Map(distances),
      settled: new Set(settled),
      predecessor: new Map(predecessor),
      pq: pq.slice(),
      poppedNode,
    };

    switch (event.kind) {
      // Heap mechanics — mirror the heap's internal array.
      case 'heap.append':
        pq = [...pq, event.value];
        step.pq = pq.slice();
        break;
      case 'heap.swap':
        pq = pq.slice();
        [pq[event.i], pq[event.j]] = [pq[event.j], pq[event.i]];
        step.pq = pq.slice();
        break;
      case 'heap.extract':
        if (event.replacement) {
          pq = [event.replacement.value, ...pq.slice(1, -1)];
        } else {
          pq = [];
        }
        step.pq = pq.slice();
        break;
      case 'heap.compare':
      case 'heap.sift-stop':
        break;

      // Dijkstra-level cues for graph rendering.
      case 'dijkstra.pq-push':
        step.pushedNode = event.entry.node;
        break;
      case 'dijkstra.pq-pop':
        poppedNode = event.entry.node;
        step.poppedNode = event.entry.node;
        break;
      case 'dijkstra.stale':
        step.staleNode = event.entry.node;
        break;
      case 'dijkstra.settle':
        settled.add(event.node);
        step.settled = new Set(settled);
        step.poppedNode = event.node;
        break;
      case 'dijkstra.relax':
        step.examiningEdge = { from: event.from, to: event.to };
        step.poppedNode = event.from;
        break;
      case 'dijkstra.improve':
        distances.set(event.node, event.newDist);
        predecessor.set(event.node, event.via);
        step.distances = new Map(distances);
        step.predecessor = new Map(predecessor);
        step.examiningEdge = { from: event.via, to: event.node };
        step.improvedNode = event.node;
        step.poppedNode = event.via;
        break;
      case 'dijkstra.skip':
        step.examiningEdge = { from: event.from, to: event.to };
        step.poppedNode = event.from;
        break;
      case 'dijkstra.done':
      case 'dijkstra.start':
        break;
    }

    states.push(step);
  }

  return states;
}

function buildPQView(state: StepState): PQView[] {
  return state.pq
    .slice()
    .sort((a, b) => a.distance - b.distance || a.node.localeCompare(b.node))
    .map((entry) => ({
      node: entry.node,
      distance: entry.distance,
      cssClass: pqEntryClass(state, entry),
    }));
}

function pqEntryClass(state: StepState, entry: PQEntry): string {
  if (entry.distance > (state.distances.get(entry.node) ?? Infinity)) return 'stale';
  if (state.pushedNode === entry.node) return 'pushed';
  return '';
}

function buildNodeViews(graph: Graph, state: StepState): NodeView[] {
  return graph.nodes.map((node) => ({
    id: node.id,
    x: node.x,
    y: node.y,
    distanceLabel: formatDistance(state.distances.get(node.id)),
    cssClass: classifyNode(graph, state, node),
  }));
}

function classifyNode(graph: Graph, state: StepState, node: GraphNode): string {
  const classes: string[] = [];

  if (node.id === graph.source) classes.push('source');
  if (state.settled.has(node.id) && node.id !== graph.source) classes.push('settled');

  if (
    !state.settled.has(node.id) &&
    state.distances.get(node.id)! !== Infinity &&
    node.id !== graph.source
  ) {
    classes.push('frontier');
  }

  if (state.poppedNode === node.id && !state.settled.has(node.id)) classes.push('active');
  if (state.improvedNode === node.id) classes.push('improved');

  if (
    state.examiningEdge &&
    state.examiningEdge.to === node.id &&
    !classes.includes('improved')
  ) {
    classes.push('examining');
  }

  return classes.join(' ');
}

function buildEdgeViews(graph: Graph, state: StepState): EdgeView[] {
  const positionOf = new Map(graph.nodes.map((n) => [n.id, { x: n.x, y: n.y }]));
  return graph.edges.map((edge) => {
    const a = positionOf.get(edge.from)!;
    const b = positionOf.get(edge.to)!;
    return {
      id: `${edge.from}-${edge.to}`,
      weight: edge.weight,
      x1: a.x,
      y1: a.y,
      x2: b.x,
      y2: b.y,
      labelX: (a.x + b.x) / 2,
      labelY: (a.y + b.y) / 2 - 6,
      cssClass: classifyEdge(state, edge),
    };
  });
}

function classifyEdge(state: StepState, edge: GraphEdge): string {
  const classes: string[] = [];

  const predOfTo = state.predecessor.get(edge.to);
  const predOfFrom = state.predecessor.get(edge.from);
  if (predOfTo === edge.from || predOfFrom === edge.to) {
    classes.push('tree');
  }

  if (state.examiningEdge && sameEdge(state.examiningEdge, edge)) {
    classes.push(
      state.improvedNode === edge.to || state.improvedNode === edge.from
        ? 'improved'
        : 'examining',
    );
  }

  return classes.join(' ');
}

function sameEdge(a: { from: string; to: string }, b: { from: string; to: string }): boolean {
  return (a.from === b.from && a.to === b.to) || (a.from === b.to && a.to === b.from);
}

function formatDistance(d: number | undefined): string {
  if (d === undefined || d === Infinity) return '∞';
  return String(d);
}

function describe(event: DijkstraEvent | undefined): string {
  if (!event) return '';
  switch (event.kind) {
    case 'dijkstra.start':
      return `Source is ${event.source}; all other distances are ∞.`;
    case 'dijkstra.pq-push':
      return event.entry.via
        ? `Push (${event.entry.node}, ${event.entry.distance}) into priority queue via ${event.entry.via}.`
        : `Push (${event.entry.node}, ${event.entry.distance}) into priority queue.`;
    case 'dijkstra.pq-pop':
      return `Pop (${event.entry.node}, ${event.entry.distance}) — smallest distance in the queue.`;
    case 'dijkstra.stale':
      return `(${event.entry.node}, ${event.entry.distance}) is stale — a better distance was already recorded. Skip.`;
    case 'dijkstra.settle':
      return `Settle node ${event.node}.`;
    case 'dijkstra.relax':
      return `Relax edge ${event.from} → ${event.to} (weight ${event.weight}). ${event.newDist} vs current ${formatDistance(event.oldDist)}.`;
    case 'dijkstra.improve':
      return `Improve distance to ${event.node}: ${event.newDist} via ${event.via}.`;
    case 'dijkstra.skip':
      return `No improvement for ${event.from} → ${event.to}; keep current distance.`;
    case 'dijkstra.done':
      return 'Priority queue empty — all reachable nodes settled.';
    case 'heap.append':
      return `Heap: append (${event.value.node}, ${event.value.distance}) at index ${event.index}.`;
    case 'heap.compare':
      return `Heap: compare indices ${event.i} and ${event.j} — ${event.result === 'in-order' ? 'in heap order' : 'out of heap order'}.`;
    case 'heap.swap':
      return `Heap: swap indices ${event.i} and ${event.j}.`;
    case 'heap.sift-stop':
      return `Heap: stop at index ${event.index} (${event.reason}).`;
    case 'heap.extract':
      return event.replacement
        ? `Heap: extract (${event.value.node}, ${event.value.distance}); move (${event.replacement.value.node}, ${event.replacement.value.distance}) from index ${event.replacement.from} to root.`
        : `Heap: extract (${event.value.node}, ${event.value.distance}).`;
  }
}
