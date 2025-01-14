import { Component, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { NotificationService } from '../../../core/services/notification.service';
import { GameService } from '../../../core/services/game.service';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-game-menu',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <nav class="menu">
      <div class="menu-items">
        <a class="menu-item" routerLink="/buildings" routerLinkActive="active">
          <i class="fas fa-building"></i>
          Bâtiments
        </a>
        <a class="menu-item" routerLink="/upgrades" routerLinkActive="active">
          <i class="fas fa-arrow-up"></i>
          Améliorations
          <span class="badge" *ngIf="availableUpgrades$ | async as count">
            {{ count }}
          </span>
        </a>
        <a class="menu-item" routerLink="/stats" routerLinkActive="active">
          <i class="fas fa-chart-bar"></i>
          Statistiques
        </a>
        <a class="menu-item" routerLink="/effects" routerLinkActive="active">
          <i class="fas fa-magic"></i>
          Effets
        </a>
      </div>

      <div class="menu-actions">
        <button class="action-button" (click)="saveGame()">
          <i class="fas fa-save"></i>
          Sauvegarder
        </button>
        <button class="action-button warning" (click)="resetGame()">
          <i class="fas fa-trash"></i>
          Réinitialiser
        </button>
      </div>
    </nav>
  `,
  styles: [
    `
      .menu {
        display: flex;
        flex-direction: column;
        height: 100%;
        gap: 0.5rem;
      }

      .menu-items {
        flex: 1;
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
      }

      .menu-item {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        padding: 0.75rem 1rem;
        color: #fff;
        text-decoration: none;
        border-radius: 4px;
        transition: background-color 0.2s;
        position: relative;
      }

      .menu-item i {
        width: 20px;
        text-align: center;
      }

      .menu-item:hover {
        background: rgba(255, 255, 255, 0.1);
      }

      .menu-item.active {
        background: #4facfe;
      }

      .badge {
        position: absolute;
        top: 50%;
        right: 1rem;
        transform: translateY(-50%);
        background: #f44336;
        color: white;
        border-radius: 50%;
        padding: 0.2rem 0.5rem;
        font-size: 0.8rem;
        min-width: 20px;
        text-align: center;
      }

      .menu-actions {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
        padding: 1rem 0;
        border-top: 1px solid rgba(255, 255, 255, 0.1);
      }

      .action-button {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 0.5rem;
        padding: 0.75rem;
        border: none;
        border-radius: 4px;
        background: #4facfe;
        color: white;
        cursor: pointer;
        transition: background-color 0.2s;
      }

      .action-button:hover {
        background: #2196f3;
      }

      .action-button.warning {
        background: #f44336;
      }

      .action-button.warning:hover {
        background: #d32f2f;
      }
    `,
  ],
})
export class GameMenuComponent implements OnInit {
  availableUpgrades$: Observable<number>;

  constructor(
    private notificationService: NotificationService,
    private gameService: GameService
  ) {
    this.availableUpgrades$ = this.notificationService.availableUpgradesCount$;
  }

  ngOnInit(): void {
    // Initialisation si nécessaire
  }

  saveGame(): void {
    this.gameService.saveGame();
  }

  resetGame(): void {
    if (confirm('Êtes-vous sûr de vouloir réinitialiser le jeu ?')) {
      this.gameService.resetGame();
      this.notificationService.show('Jeu réinitialisé', 'info');
    }
  }
}
