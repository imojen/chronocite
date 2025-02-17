import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadChildren: () =>
      import('./modules/gameplay/gameplay.module').then(
        (m) => m.GameplayModule
      ),
  },
  {
    path: '**',
    redirectTo: '',
  },
];
