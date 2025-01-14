import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'buildings',
    pathMatch: 'full',
  },
  {
    path: 'buildings',
    loadChildren: () =>
      import('./modules/gameplay/gameplay.module').then(
        (m) => m.GameplayModule
      ),
  },
  {
    path: 'upgrades',
    loadChildren: () =>
      import('./modules/upgrades/upgrades.module').then(
        (m) => m.UpgradesModule
      ),
  },
  {
    path: 'stats',
    loadComponent: () =>
      import(
        './modules/gameplay/components/stats-display/stats-display.component'
      ).then((m) => m.StatsDisplayComponent),
  },
  {
    path: 'effects',
    loadComponent: () =>
      import(
        './modules/gameplay/components/effects-display/effects-display.component'
      ).then((m) => m.EffectsDisplayComponent),
  },
  {
    path: '**',
    redirectTo: 'buildings',
  },
];
