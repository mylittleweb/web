import { HeapEvent, MinHeap } from '../../shared/min-heap';
import { PlaybackStream } from '../../shared/playback-controls/playback-stream';
import { Graph } from './dijkstra.graph';

export interface PQEntry {
  node: string;
  distance: number;
  via?: string;
}

export type DijkstraEvent =
  | { kind: 'dijkstra.start'; source: string }
  | { kind: 'dijkstra.pq-push'; entry: PQEntry }
  | { kind: 'dijkstra.pq-pop'; entry: PQEntry }
  | { kind: 'dijkstra.stale'; entry: PQEntry }
  | { kind: 'dijkstra.settle'; node: string }
  | { kind: 'dijkstra.relax'; from: string; to: string; weight: number; oldDist: number; newDist: number }
  | { kind: 'dijkstra.improve'; node: string; newDist: number; via: string }
  | { kind: 'dijkstra.skip'; from: string; to: string }
  | { kind: 'dijkstra.done' }
  | HeapEvent<PQEntry>;

// Non-blocking lazy-deletion Dijkstra. Every emitted event yields to the
// event loop so the UI can render and playback can advance before the
// algorithm finishes.
export async function dijkstra(graph: Graph, stream: PlaybackStream<DijkstraEvent>): Promise<void> {
  const dist = new Map<string, number>(graph.nodes.map((n) => [n.id, Infinity]));
  const settled = new Set<string>();
  const adj = buildAdjacency(graph);
  const pq = new MinHeap<PQEntry>((a, b) => a.distance - b.distance, stream);

  dist.set(graph.source, 0);
  await stream.emit({ kind: 'dijkstra.start', source: graph.source });

  const sourceEntry: PQEntry = { node: graph.source, distance: 0 };
  await stream.emit({ kind: 'dijkstra.pq-push', entry: sourceEntry });
  await pq.push(sourceEntry);

  while (pq.size > 0) {
    const top = (await pq.pop())!;
    await stream.emit({ kind: 'dijkstra.pq-pop', entry: top });

    if (settled.has(top.node) || top.distance > dist.get(top.node)!) {
      await stream.emit({ kind: 'dijkstra.stale', entry: top });
      continue;
    }

    settled.add(top.node);
    await stream.emit({ kind: 'dijkstra.settle', node: top.node });

    for (const { to, weight } of adj.get(top.node) ?? []) {
      if (settled.has(to)) continue;
      const oldDist = dist.get(to)!;
      const newDist = top.distance + weight;

      await stream.emit({ kind: 'dijkstra.relax', from: top.node, to, weight, oldDist, newDist });

      if (newDist < oldDist) {
        dist.set(to, newDist);
        await stream.emit({ kind: 'dijkstra.improve', node: to, newDist, via: top.node });
        const entry: PQEntry = { node: to, distance: newDist, via: top.node };
        await stream.emit({ kind: 'dijkstra.pq-push', entry });
        await pq.push(entry);
      } else {
        await stream.emit({ kind: 'dijkstra.skip', from: top.node, to });
      }
    }
  }

  await stream.emit({ kind: 'dijkstra.done' });
  stream.complete();
}

function buildAdjacency(graph: Graph): Map<string, { to: string; weight: number }[]> {
  const adj = new Map<string, { to: string; weight: number }[]>();
  for (const node of graph.nodes) adj.set(node.id, []);
  for (const edge of graph.edges) {
    adj.get(edge.from)!.push({ to: edge.to, weight: edge.weight });
    adj.get(edge.to)!.push({ to: edge.from, weight: edge.weight });
  }
  return adj;
}
