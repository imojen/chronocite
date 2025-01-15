import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GameplayRoutingModule } from './gameplay-routing.module';
import { SharedModule } from '../../shared/shared.module';
import { BuildingPanelComponent } from './components/building-panel/building-panel.component';
import { NumberFormatPipe } from '../../core/pipes/number-format.pipe';

@NgModule({
  imports: [
    CommonModule,
    GameplayRoutingModule,
    SharedModule,
    NumberFormatPipe,
    BuildingPanelComponent,
  ],
})
export class GameplayModule {}
