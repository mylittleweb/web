import {
  Component,
  computed,
  effect,
  EventEmitter,
  Input,
  Output,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule, MatChipListboxChange } from '@angular/material/chips';
import { toSignal } from '@angular/core/rxjs-interop';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';

export interface FilterGroup {
  key: string;
  label: string;
  options: string[];
}

export type FilterSelection = Record<string, string[]>;

const SEARCH_DEBOUNCE_MS = 200;

@Component({
  selector: 'list-filter',
  standalone: true,
  imports: [
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatButtonModule,
    MatChipsModule,
  ],
  templateUrl: './list-filter.component.html',
  styleUrl: './list-filter.component.scss',
})
export class ListFilterComponent {
  @Input() searchPlaceholder = 'Search...';
  @Input() filterGroups: FilterGroup[] = [];
  @Input() total?: number;
  @Input() filtered?: number;

  @Output() searchChange = new EventEmitter<string>();
  @Output() filterChange = new EventEmitter<FilterSelection>();

  readonly search = signal('');
  readonly selection = signal<FilterSelection>({});

  private readonly searchInput$ = new Subject<string>();
  private readonly debouncedSearch = toSignal(
    this.searchInput$.pipe(
      debounceTime(SEARCH_DEBOUNCE_MS),
      distinctUntilChanged(),
    ),
    { initialValue: '' },
  );

  readonly showCount = computed(
    () => this.total !== undefined && this.filtered !== undefined,
  );

  constructor() {
    let lastEmitted: string | undefined;
    effect(() => {
      const value = this.debouncedSearch();
      if (value !== lastEmitted) {
        lastEmitted = value;
        this.searchChange.emit(value);
      }
    });
  }

  onSearchInput(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.search.set(value);
    this.searchInput$.next(value);
  }

  clearSearch(): void {
    this.search.set('');
    this.searchInput$.next('');
  }

  onChipChange(key: string, event: MatChipListboxChange): void {
    const value = (event.value as string[]) ?? [];
    const next = { ...this.selection(), [key]: value };
    this.selection.set(next);
    this.filterChange.emit(next);
  }
}
