import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-stats-display',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="stats-container">
      <!-- Contenu des stats -->
    </div>
  `,
  styles: [
    /* ... styles ... */
  ],
})
export class StatsDisplayComponent {}
