import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GameService } from '../../../../core/services/game.service';
import { NumberFormatPipe } from '../../../../core/pipes/number-format.pipe';

@Component({
  selector: 'app-stats-display',
  standalone: true,
  imports: [CommonModule, NumberFormatPipe],
  template: `
    <div class="stats-container">
      <h2>Statistiques</h2>
      <div class="stats-list">
        <div class="stat-item">
          <span>Production totale:</span>
          <span>{{ getCurrentProduction() | numberFormat }}/s</span>
        </div>
        <div class="stat-item">
          <span>Temps de jeu:</span>
          <span>{{ formatPlayTime() }}</span>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      .stats-container {
        background: rgba(22, 27, 34, 0.8);
        border-radius: 8px;
        padding: 1rem;
      }

      h2 {
        color: #4facfe;
        margin: 0 0 1rem 0;
      }

      .stats-list {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
      }

      .stat-item {
        display: flex;
        justify-content: space-between;
        color: #64b5f6;
      }
    `,
  ],
})
export class StatsDisplayComponent {
  constructor(private gameService: GameService) {}

  getCurrentProduction(): number {
    return this.gameService.getCurrentProduction();
  }

  formatPlayTime(): string {
    const totalSeconds = Math.floor(this.gameService.getTotalPlayTime() / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return `${hours}h ${minutes}m ${seconds}s`;
  }
}
