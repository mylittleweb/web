import { DataStructure } from './data-structure.types';

export const DATA_STRUCTURES: DataStructure[] = [
  {
    id: 'priority-queue',
    name: 'Priority Queue (Min-Heap)',
    summary: 'Binary heap supporting fast extract-min and insert.',
    category: 'heap',
    operations: {
      time: { push: 'O(log n)', pop: 'O(log n)', peek: 'O(1)' },
      space: 'O(n)',
    },
    loadComponent: () =>
      import('./priority-queue/priority-queue.component').then(
        (m) => m.PriorityQueueComponent,
      ),
  },
];

export function findDataStructure(id: string): DataStructure | undefined {
  return DATA_STRUCTURES.find((d) => d.id === id);
}
