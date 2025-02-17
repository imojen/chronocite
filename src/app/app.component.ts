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
import { map } from 'rxjs/operators';
import { NumberFormatPipe } from './core/pipes/number-format.pipe';
import { TimeRiftComponent } from './modules/gameplay/components/time-rift/time-rift.component';

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
    NumberFormatPipe,
    TimeRiftComponent,
  ],
  template: `
    <div class="app-layout" [class.menu-open]="isMenuOpen">
      <div class="mobile-top-bar">
        <div class="resource-info">
          <i class="fas fa-clock"></i>
          <span class="amount">{{ timeFragments$ | numberFormat }}</span>
        </div>
        <button class="mobile-menu-toggle" (click)="toggleMenu()">
          <i
            class="fas"
            [class.fa-bars]="!isMenuOpen"
            [class.fa-times]="isMenuOpen"
          ></i>
        </button>
      </div>
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
      <main class="main-content" (click)="closeMenu()">
        <router-outlet></router-outlet>
      </main>
    </div>
    <app-notifications></app-notifications>
    <app-confirmation-dialog></app-confirmation-dialog>
    <app-time-rift></app-time-rift>
  `,
  styles: [
    `
      .app-layout {
        height: 100vh;
        display: grid;
        grid-template-columns: 300px 1fr;
        background: #1b1f24;
        position: relative;
      }

      .mobile-top-bar {
        display: none;
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        height: 60px;
        background: rgba(22, 27, 34, 0.95);
        backdrop-filter: blur(10px);
        z-index: 1000;
        padding: 0 1rem;
        border-bottom: 1px solid rgba(79, 172, 254, 0.3);
        justify-content: space-between;
        align-items: center;
      }

      .resource-info {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        color: #4facfe;
        font-size: 1.2rem;
      }

      .resource-info i {
        font-size: 1.1rem;
      }

      .resource-info .amount {
        font-weight: 500;
        text-shadow: 0 0 10px rgba(79, 172, 254, 0.5);
      }

      .side-panel {
        background: #1b1f24;
        padding: 1rem;
        display: flex;
        flex-direction: column;
        gap: 1rem;
        border-right: 1px solid rgba(255, 255, 255, 0.1);
        transition: transform 0.3s ease, opacity 0.3s ease;
        z-index: 100;
      }

      .main-content {
        padding: 1rem;
        overflow-y: auto;
        height: 100%;
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

      .mobile-menu-toggle {
        display: none;
        background: rgba(22, 27, 34, 0.9);
        border: 1px solid rgba(79, 172, 254, 0.3);
        color: #4facfe;
        width: 44px;
        height: 44px;
        border-radius: 8px;
        cursor: pointer;
        transition: all 0.3s ease;
      }

      .mobile-menu-toggle:hover {
        background: rgba(22, 27, 34, 1);
        transform: scale(1.05);
      }

      .mobile-menu-toggle i {
        font-size: 1.2rem;
      }

      @media (max-width: 1024px) {
        .app-layout {
          grid-template-columns: 250px 1fr;
        }

        .game-logo {
          max-width: 150px;
        }
      }

      @media (max-width: 768px) {
        .app-layout {
          grid-template-columns: 1fr;
        }

        .mobile-top-bar {
          display: flex;
        }

        .mobile-menu-toggle {
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .side-panel {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100vh;
          transform: translateY(-100%);
          opacity: 0;
          visibility: hidden;
          background: rgba(27, 31, 36, 0.98);
          backdrop-filter: blur(10px);
          padding: 4rem 1rem 1rem 1rem;
          transition: all 0.3s ease;
          overflow-y: auto;
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .main-content {
          height: 100vh;
          padding-top: 4rem;
        }

        .app-layout.menu-open {
          overflow: hidden;
          position: fixed;
          width: 100%;
          height: 100%;
        }

        .app-layout.menu-open .side-panel {
          transform: translateY(0);
          opacity: 1;
          visibility: visible;
        }

        .game-logo {
          max-width: 120px;
        }

        .logo-container {
          flex-shrink: 0;
        }
      }

      @media (max-width: 480px) {
        .mobile-top-bar {
          height: 50px;
        }

        .resource-info {
          font-size: 1.1rem;
        }

        .side-panel {
          padding: 4rem 0.5rem 0.5rem 0.5rem;
          gap: 0.5rem;
        }

        .game-logo {
          max-width: 100px;
        }

        .mobile-menu-toggle {
          width: 40px;
          height: 40px;
        }
      }
    `,
  ],
})
export class AppComponent {
  isMenuOpen = false;
  timeFragments$: any;

  constructor(private gameService: GameService) {
    this.timeFragments$ = this.gameService.gameState$.pipe(
      map((state) => state.resources.timeFragments || 0)
    );
  }

  toggleMenu() {
    this.isMenuOpen = !this.isMenuOpen;
  }

  closeMenu() {
    if (this.isMenuOpen) {
      this.isMenuOpen = false;
    }
  }
}
