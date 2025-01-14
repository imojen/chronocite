import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { BuildingPanelComponent } from './components/building-panel/building-panel.component';

const routes: Routes = [
  {
    path: '',
    component: BuildingPanelComponent,
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class GameplayRoutingModule {}
