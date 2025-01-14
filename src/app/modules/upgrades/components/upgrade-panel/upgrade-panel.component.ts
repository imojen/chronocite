import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UpgradeDisplayComponent } from '../upgrade-display/upgrade-display.component';

@Component({
  selector: 'app-upgrade-panel',
  standalone: true,
  imports: [CommonModule, UpgradeDisplayComponent],
  template: `
    <div class="panel">
      <app-upgrade-display></app-upgrade-display>
    </div>
  `,
  styles: [
    `
      .panel {
        height: 100%;
        overflow-y: auto;
      }
    `,
  ],
})
export class UpgradePanelComponent {}
