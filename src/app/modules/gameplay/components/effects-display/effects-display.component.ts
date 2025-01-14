import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GameService } from '../../../../core/services/game.service';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

interface Effects {
  globalProductionBoost: number;
  globalCostReduction: number;
}

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

      h2 {
        color: #4facfe;
        margin: 0 0 1rem 0;
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
  constructor(private gameService: GameService) {
    this.effects$ = this.gameService.gameState$.pipe(
      map(() => this.gameService.getCurrentEffects())
    );
  }

  effects$: Observable<Effects>;
}
