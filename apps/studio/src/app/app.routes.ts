import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    title: 'Shwetha',
    loadComponent: () => import('./landing/landing').then((m) => m.LandingPage),
  },
  {
    path: 'quotes',
    title: 'Quotes · Shwetha',
    loadComponent: () => import('./quotes/quotes').then((m) => m.QuotesPage),
  },
  {
    path: 'moonbeam-meadow',
    title: 'Moonbeam Meadow · Play',
    loadComponent: () => import('./meadow/meadow-game').then((m) => m.MeadowGamePage),
  },
  { path: '**', redirectTo: '' },
];
