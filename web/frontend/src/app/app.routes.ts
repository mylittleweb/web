import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    title: 'Home',
    loadComponent: () =>
      import('./pages/home.component').then((m) => m.HomeComponent),
  },
  {
    path: 'about',
    title: 'About',
    loadComponent: () =>
      import('./pages/about.component').then((m) => m.AboutComponent),
  },
  {
    path: 'services',
    title: 'Services',
    loadComponent: () =>
      import('./pages/services.component').then((m) => m.ServicesComponent),
  },
  {
    path: 'contact',
    title: 'Contact',
    loadComponent: () =>
      import('./pages/contact.component').then((m) => m.ContactComponent),
  },
  {
    path: 'visualizations/algorithms',
    title: 'Algorithms',
    loadComponent: () =>
      import('./pages/algorithms.component').then((m) => m.AlgorithmsComponent),
  },
  {
    path: 'visualizations/algorithms/:id',
    loadComponent: () =>
      import('./pages/algorithm-topic.component').then((m) => m.AlgorithmTopicComponent),
  },
  {
    path: 'visualizations/data-structures',
    title: 'Data Structures',
    loadComponent: () =>
      import('./pages/data-structures.component').then((m) => m.DataStructuresComponent),
  },
  {
    path: 'visualizations/data-structures/:id',
    loadComponent: () =>
      import('./pages/data-structure-topic.component').then(
        (m) => m.DataStructureTopicComponent,
      ),
  },
  {
    path: 'visualizations/systems',
    title: 'Systems',
    loadComponent: () =>
      import('./pages/systems.component').then((m) => m.SystemsComponent),
  },
  {
    path: 'visualizations/networks',
    title: 'Networks',
    loadComponent: () =>
      import('./pages/networks.component').then((m) => m.NetworksComponent),
  },
];
