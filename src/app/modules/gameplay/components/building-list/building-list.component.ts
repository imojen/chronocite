import { Component } from '@angular/core';
import { GameStateService } from '../../../../core/services/game-state.service';

@Component({
  selector: 'app-building-list',
  template: `
    <div class="buildings-container">
      <h2>Bâtiments</h2>
      <!-- Liste des bâtiments sera implémentée ici -->
    </div>
  `,
})
export class BuildingListComponent {
  constructor(private gameState: GameStateService) {}
}
