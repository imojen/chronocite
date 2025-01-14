import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UpgradesRoutingModule } from './upgrades-routing.module';
import { SharedModule } from '../../shared/shared.module';
import { UpgradePanelComponent } from './components/upgrade-panel/upgrade-panel.component';

@NgModule({
  imports: [
    CommonModule,
    UpgradesRoutingModule,
    SharedModule,
    UpgradePanelComponent,
  ],
})
export class UpgradesModule {}
