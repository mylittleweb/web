import { Algorithm } from './algorithm.types';

export const ALGORITHMS: Algorithm[] = [
  {
    id: 'bubble-sort',
    name: 'Bubble Sort',
    summary: 'Repeatedly swap adjacent out-of-order elements.',
    complexity: { time: 'O(n²)', space: 'O(1)' },
    loadComponent: () =>
      import('./bubble-sort/bubble-sort.component').then((m) => m.BubbleSortComponent),
  },
  {
    id: 'quicksort',
    name: 'Quicksort',
    summary: 'Pick a pivot, partition, recurse on each side.',
    complexity: { time: 'O(n log n)', space: 'O(log n)' },
    paradigm: 'divide-and-conquer',
  },
  {
    id: 'dijkstra',
    name: 'Dijkstra',
    summary: 'Shortest path in a weighted graph with non-negative edges.',
    complexity: { time: 'O((V + E) log V)', space: 'O(V)' },
    paradigm: 'graph',
    loadComponent: () =>
      import('./dijkstra/dijkstra.component').then((m) => m.DijkstraComponent),
  },
];

export function findAlgorithm(id: string): Algorithm | undefined {
  return ALGORITHMS.find((a) => a.id === id);
}
