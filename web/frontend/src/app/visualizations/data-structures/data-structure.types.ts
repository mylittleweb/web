import { Type } from '@angular/core';
import { TopicBase } from '../topic-base';

export type DataStructureCategory = 'linear' | 'tree' | 'graph' | 'hash' | 'heap';

export interface DataStructure extends TopicBase {
  category: DataStructureCategory;
  operations?: { time: Record<string, string>; space?: string };
  loadComponent?: () => Promise<Type<unknown>>;
}
