import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { StatsDisplayComponent } from './components/stats-display/stats-display.component';

@NgModule({
  imports: [CommonModule, StatsDisplayComponent],
  exports: [CommonModule, StatsDisplayComponent],
})
export class SharedModule {}
