import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'chronocity',
    pathMatch: 'full',
  },
  {
    path: 'chronocity',
    loadChildren: () =>
      import('./modules/gameplay/gameplay.module').then(
        (m) => m.GameplayModule
      ),
  },
  {
    path: '**',
    redirectTo: 'buildings',
  },
];
