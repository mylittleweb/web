import { Component, computed, effect, inject, signal, Type } from '@angular/core';
import { NgComponentOutlet } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { findAlgorithm } from '../visualizations/algorithms/algorithms.data';

@Component({
  standalone: true,
  imports: [RouterLink, NgComponentOutlet],
  templateUrl: './algorithm-topic.component.html',
})
export class AlgorithmTopicComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly params = toSignal(this.route.paramMap, {
    initialValue: this.route.snapshot.paramMap,
  });

  readonly id = computed(() => this.params().get('id') ?? '');
  readonly algorithm = computed(() => findAlgorithm(this.id()));
  readonly loaded = signal<Type<unknown> | null>(null);

  constructor() {
    effect(() => {
      const algo = this.algorithm();
      if (algo?.loadComponent) {
        algo.loadComponent().then((cmp) => {
          if (this.algorithm()?.id === algo.id) {
            this.loaded.set(cmp);
          }
        });
      } else {
        this.loaded.set(null);
      }
    });
  }
}
