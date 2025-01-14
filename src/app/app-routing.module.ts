import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

const routes: Routes = [
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
    title: 'Bâtiments',
  },
  {
    path: 'upgrades',
    loadChildren: () =>
      import('./modules/upgrades/upgrades.module').then(
        (m) => m.UpgradesModule
      ),
    title: 'Améliorations',
  },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}
