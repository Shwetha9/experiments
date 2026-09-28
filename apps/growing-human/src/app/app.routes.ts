import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', title: 'Growing Human', loadComponent: () => import('./guide/growing-human').then((m) => m.GrowingHumanPage) },
  { path: 'about', title: 'For adults · Growing Human', loadComponent: () => import('./guide/about/about').then((m) => m.GrowingHumanAboutPage) },
  { path: '**', redirectTo: '' },
];
