import { Component, computed, effect, inject, signal, Type } from '@angular/core';
import { NgComponentOutlet } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { findDataStructure } from '../visualizations/data-structures/data-structures.data';

@Component({
  standalone: true,
  imports: [RouterLink, NgComponentOutlet],
  templateUrl: './data-structure-topic.component.html',
})
export class DataStructureTopicComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly params = toSignal(this.route.paramMap, {
    initialValue: this.route.snapshot.paramMap,
  });

  readonly id = computed(() => this.params().get('id') ?? '');
  readonly dataStructure = computed(() => findDataStructure(this.id()));
  readonly loaded = signal<Type<unknown> | null>(null);

  constructor() {
    effect(() => {
      const ds = this.dataStructure();
      if (ds?.loadComponent) {
        ds.loadComponent().then((cmp) => {
          if (this.dataStructure()?.id === ds.id) {
            this.loaded.set(cmp);
          }
        });
      } else {
        this.loaded.set(null);
      }
    });
  }
}
