import { Component } from '@angular/core';

@Component({
  selector: 'app-main-view',
  template: `
    <div class="game-container">
      <div class="resources-panel">
        <!-- Composants de ressources -->
      </div>
      <div class="buildings-panel">
        <app-building-list></app-building-list>
      </div>
      <div class="upgrades-panel">
        <!-- Panel des améliorations -->
      </div>
    </div>
  `,
  styles: [
    `
      .game-container {
        display: grid;
        grid-template-columns: 250px 1fr 250px;
        gap: 1rem;
        padding: 1rem;
        height: 100vh;
      }
    `,
  ],
})
export class MainViewComponent {}
