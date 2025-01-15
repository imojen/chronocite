import { Component } from '@angular/core';
import { RouterOutlet, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { GameMenuComponent } from './shared/components/game-menu/game-menu.component';
import { ResourceDisplayComponent } from './modules/gameplay/components/resource-display/resource-display.component';
import { NotificationsComponent } from './core/components/notifications/notifications.component';
import { GameService } from './core/services/game.service';
import { Resource } from './core/models/resource.model';
import { Observable } from 'rxjs';
import { ConfirmationDialogComponent } from './shared/components/confirmation-dialog/confirmation-dialog.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    RouterModule,
    GameMenuComponent,
    ResourceDisplayComponent,
    NotificationsComponent,
    ConfirmationDialogComponent,
  ],
  template: `
    <div class="app-layout">
      <aside class="side-panel">
        <div class="logo-container">
          <img
            src="assets/images/logo.png"
            alt="Chronocity"
            class="game-logo"
          />
        </div>
        <app-resource-display></app-resource-display>
        <app-game-menu></app-game-menu>
      </aside>
      <main class="main-content">
        <router-outlet></router-outlet>
      </main>
    </div>
    <app-notifications></app-notifications>
    <app-confirmation-dialog></app-confirmation-dialog>
  `,
  styles: [
    `
      .app-layout {
        height: 100vh;
        display: grid;
        grid-template-columns: 300px 1fr;
        background: #1b1f24;
      }

      .side-panel {
        background: rgba(22, 27, 34, 0.8);
        padding: 1rem;
        display: flex;
        flex-direction: column;
        gap: 1rem;
        border-right: 1px solid rgba(255, 255, 255, 0.1);
      }

      h1 {
        color: #4facfe;
        margin: 0;
        font-size: 2rem;
        text-align: center;
      }

      .main-content {
        padding: 1rem;
        overflow-y: auto;
      }

      .logo-container {
        padding: 0;
        text-align: center;
      }

      .game-logo {
        max-width: 200px;
        height: auto;
        filter: drop-shadow(0 0 10px rgba(79, 172, 254, 0.3));
        transition: filter 0.3s ease;
        max-height: 150px;
      }

      .game-logo:hover {
        filter: drop-shadow(0 0 15px rgba(79, 172, 254, 0.5));
      }
    `,
  ],
})
export class AppComponent {
  constructor(private gameService: GameService) {}
}
