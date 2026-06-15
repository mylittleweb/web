import { Type } from '@angular/core';
import { TopicBase } from '../topic-base';

export type Paradigm = 'divide-and-conquer' | 'greedy' | 'dp' | 'graph';

export interface Algorithm extends TopicBase {
  complexity: { time: string; space: string };
  paradigm?: Paradigm;
  loadComponent?: () => Promise<Type<unknown>>;
}
