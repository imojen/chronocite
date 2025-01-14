import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GameService } from '../../../core/services/game.service';

@Component({
  selector: 'app-effects-display',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="effects-container">
      <h3>Effets actifs</h3>
      @if (effects$ | async; as effects) {
      <div class="effects-list">
        <div class="effect-item">
          <span>Multiplicateur global:</span>
          <span>×{{ effects.globalProductionBoost.toFixed(2) }}</span>
        </div>
        <div class="effect-item">
          <span>Réduction des coûts:</span>
          <span
            >-{{ ((1 - effects.globalCostReduction) * 100).toFixed(0) }}%</span
          >
        </div>
      </div>
      }
    </div>
  `,
  styles: [
    `
      .effects-container {
        background: rgba(22, 27, 34, 0.8);
        border-radius: 8px;
        padding: 1rem;
      }
      .effects-list {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
      }
      .effect-item {
        display: flex;
        justify-content: space-between;
        color: #64b5f6;
      }
    `,
  ],
})
export class EffectsDisplayComponent {
  effects$ = this.gameService.getCurrentEffects$();

  constructor(private gameService: GameService) {}
}
