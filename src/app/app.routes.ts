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
    path: 'growing-human',
    title: 'Growing Human',
    loadComponent: () => import('./growing-human/growing-human').then((m) => m.GrowingHumanPage),
  },
  { path: '**', redirectTo: '' },
];
