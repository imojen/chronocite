import { Component, inject } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { GameService } from '../../../core/services/game.service';
import { map } from 'rxjs/operators';

interface DisplayResource {
  id: string;
  name: string;
  amount: number;
  perSecond: number;
}

@Component({
  selector: 'app-resource-panel',
  standalone: true,
  imports: [CommonModule, DecimalPipe],
  template: `
    <div class="resource-panel">
      @if (resources$ | async; as resources) { @for (resource of resources;
      track resource.id) {
      <div class="resource-item">
        <div class="resource-name">{{ resource.name }}</div>
        <div class="resource-amount">
          {{ resource.amount | number : '1.0-2' }}
        </div>
        @if (resource.perSecond > 0) {
        <div class="resource-rate">
          (+{{ resource.perSecond | number : '1.0-2' }}/s)
        </div>
        }
      </div>
      } } @else {
      <div>Chargement des ressources...</div>
      }
    </div>
  `,
  styles: [
    `
      .resource-panel {
        padding: 1rem;
        background: #f5f5f5;
        border-radius: 8px;
      }
      .resource-item {
        display: flex;
        gap: 1rem;
        padding: 0.5rem;
      }
    `,
  ],
})
export class ResourcePanelComponent {
  private gameService = inject(GameService);
  protected resources$ = this.gameService.gameState$.pipe(
    map((state) => {
      console.log('État actuel:', state);
      return Object.entries(state.resources).map(
        ([id, amount]): DisplayResource => ({
          id,
          name: id === 'timeFragments' ? 'Fragments de Temps' : 'Chronons',
          amount,
          perSecond: 0,
        })
      );
    })
  );
}
