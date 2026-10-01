import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', title: 'Growing Humans', loadComponent: () => import('./guide/growing-human').then((m) => m.GrowingHumanPage) },
  { path: 'about', title: 'For adults · Growing Humans', loadComponent: () => import('./guide/about/about').then((m) => m.GrowingHumanAboutPage) },
  { path: 'discover', title: 'Knowledge Explorer · Growing Humans', loadComponent: () => import('./guide/knowledge/knowledge-explorer').then((m) => m.KnowledgeExplorerPage) },
  { path: 'lab', title: 'STEAM Lab · Growing Humans', loadComponent: () => import('./guide/steam/steam-lab').then((m) => m.SteamLabPage) },
  { path: '**', redirectTo: '' },
];
