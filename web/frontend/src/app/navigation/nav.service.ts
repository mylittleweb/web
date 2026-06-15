import { Injectable, signal } from '@angular/core';

export interface NavLink {
  label: string;
  path: string;
  icon: string;
}

export interface NavSection {
  title?: string;
  items: NavLink[];
}

const DEFAULT_SECTIONS: NavSection[] = [
  {
    items: [{ label: 'Home', path: '/', icon: 'home' }],
  },
  {
    title: 'Company',
    items: [
      { label: 'About', path: '/about', icon: 'info' },
      { label: 'Services', path: '/services', icon: 'build' },
    ],
  },
  {
    title: 'Visualizations',
    items: [
      { label: 'Algorithms', path: '/visualizations/algorithms', icon: 'bolt' },
      { label: 'Data Structures', path: '/visualizations/data-structures', icon: 'account_tree' },
      { label: 'Systems', path: '/visualizations/systems', icon: 'hub' },
      { label: 'Networks', path: '/visualizations/networks', icon: 'lan' },
    ],
  },
  {
    title: 'Get in touch',
    items: [{ label: 'Contact', path: '/contact', icon: 'mail' }],
  },
];

@Injectable({ providedIn: 'root' })
export class NavService {
  private readonly _sections = signal<NavSection[]>(DEFAULT_SECTIONS);

  readonly sections = this._sections.asReadonly();

  setSections(sections: NavSection[]): void {
    this._sections.set(sections);
  }
}
