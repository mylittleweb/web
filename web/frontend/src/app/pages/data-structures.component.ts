import { Component, computed, signal } from '@angular/core';
import { CardGridComponent } from '../shared/card-grid/card-grid.component';
import {
  ListFilterComponent,
  FilterGroup,
  FilterSelection,
} from '../shared/list-filter/list-filter.component';
import { DataStructureCardComponent } from '../visualizations/data-structures/data-structure-card.component';
import { DATA_STRUCTURES } from '../visualizations/data-structures/data-structures.data';
import { DataStructure } from '../visualizations/data-structures/data-structure.types';

@Component({
  standalone: true,
  imports: [CardGridComponent, ListFilterComponent, DataStructureCardComponent],
  templateUrl: './data-structures.component.html',
  styleUrl: './data-structures.component.scss',
})
export class DataStructuresComponent {
  readonly dataStructures = DATA_STRUCTURES;

  readonly filterGroups: FilterGroup[] = [
    {
      key: 'category',
      label: 'Category',
      options: ['linear', 'tree', 'graph', 'hash', 'heap'],
    },
  ];

  private readonly search = signal('');
  private readonly filters = signal<FilterSelection>({});

  readonly filtered = computed(() => {
    const query = this.search().trim().toLowerCase();
    const categories = this.filters()['category'] ?? [];
    return this.dataStructures.filter((ds) => matches(ds, query, categories));
  });

  onSearchChange(value: string): void {
    this.search.set(value);
  }

  onFilterChange(value: FilterSelection): void {
    this.filters.set(value);
  }
}

function matches(ds: DataStructure, query: string, categories: string[]): boolean {
  if (query) {
    const haystack = `${ds.name} ${ds.summary}`.toLowerCase();
    if (!haystack.includes(query)) return false;
  }
  if (categories.length > 0 && !categories.includes(ds.category)) return false;
  return true;
}
