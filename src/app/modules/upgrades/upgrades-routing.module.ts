import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { UpgradePanelComponent } from './components/upgrade-panel/upgrade-panel.component';

const routes: Routes = [
  {
    path: '',
    component: UpgradePanelComponent,
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class UpgradesRoutingModule {}
