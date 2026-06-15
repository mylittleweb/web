import { Component, computed, signal } from '@angular/core';
import { CardGridComponent } from '../shared/card-grid/card-grid.component';
import {
  ListFilterComponent,
  FilterGroup,
  FilterSelection,
} from '../shared/list-filter/list-filter.component';
import { AlgorithmCardComponent } from '../visualizations/algorithms/algorithm-card.component';
import { ALGORITHMS } from '../visualizations/algorithms/algorithms.data';
import { Algorithm } from '../visualizations/algorithms/algorithm.types';

@Component({
  standalone: true,
  imports: [CardGridComponent, ListFilterComponent, AlgorithmCardComponent],
  templateUrl: './algorithms.component.html',
  styleUrl: './algorithms.component.scss',
})
export class AlgorithmsComponent {
  readonly algorithms = ALGORITHMS;

  readonly filterGroups: FilterGroup[] = [
    {
      key: 'paradigm',
      label: 'Paradigm',
      options: ['divide-and-conquer', 'greedy', 'dp', 'graph'],
    },
  ];

  private readonly search = signal('');
  private readonly filters = signal<FilterSelection>({});

  readonly filtered = computed(() => {
    const query = this.search().trim().toLowerCase();
    const paradigms = this.filters()['paradigm'] ?? [];
    return this.algorithms.filter((algo) => matches(algo, query, paradigms));
  });

  onSearchChange(value: string): void {
    this.search.set(value);
  }

  onFilterChange(value: FilterSelection): void {
    this.filters.set(value);
  }
}

function matches(algo: Algorithm, query: string, paradigms: string[]): boolean {
  if (query) {
    const haystack = `${algo.name} ${algo.summary}`.toLowerCase();
    if (!haystack.includes(query)) {
      return false;
    }
  }
  if (paradigms.length > 0) {
    if (!algo.paradigm || !paradigms.includes(algo.paradigm)) {
      return false;
    }
  }
  return true;
}
