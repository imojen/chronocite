import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GameService } from '../../../../core/services/game.service';
import { NotificationService } from '../../../../core/services/notification.service';

@Component({
  selector: 'app-time-rift',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (isRiftVisible) {
    <div
      class="time-rift"
      [style.left.px]="riftPosition.x"
      [style.top.px]="riftPosition.y"
      (click)="catchRift()"
    >
      <i class="fas fa-bolt"></i>
    </div>
    }
  `,
  styles: [
    `
      .time-rift {
        position: fixed;
        width: 50px;
        height: 50px;
        background: rgba(79, 172, 254, 0.2);
        border: 2px solid #4facfe;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        animation: pulse 2s infinite, fadeOut 5s linear;
        z-index: 99999;
        box-shadow: 0 0 20px rgba(79, 172, 254, 0.5);
        pointer-events: auto;
      }

      .time-rift i {
        color: #4facfe;
        font-size: 1.5rem;
        filter: drop-shadow(0 0 5px rgba(79, 172, 254, 0.8));
      }

      @keyframes pulse {
        0% {
          transform: scale(1);
        }
        50% {
          transform: scale(1.2);
        }
        100% {
          transform: scale(1);
        }
      }

      @keyframes fadeOut {
        0% {
          opacity: 0;
        }
        10% {
          opacity: 1;
        }
        90% {
          opacity: 1;
        }
        100% {
          opacity: 0;
        }
      }
    `,
  ],
})
export class TimeRiftComponent implements OnInit, OnDestroy {
  isRiftVisible = false;
  riftPosition = { x: 0, y: 0 };
  private riftTimeout?: number;
  private spawnInterval?: number;
  private lastSpawnTime = 0;
  private readonly SPAWN_INTERVAL = 15000; // 15 secondes entre chaque spawn
  private readonly RIFT_DURATION = 5000; // 5 secondes de visibilité

  constructor(
    private gameService: GameService,
    private notificationService: NotificationService
  ) {}

  ngOnInit() {
    this.startRiftSpawning();
  }

  ngOnDestroy() {
    this.stopRiftSpawning();
  }

  private startRiftSpawning() {
    // Vérifier toutes les 5 secondes si on peut faire apparaître une faille
    this.spawnInterval = window.setInterval(() => {
      if (
        this.gameService.isChronotronOnCooldown() &&
        Date.now() - this.lastSpawnTime >= this.SPAWN_INTERVAL &&
        !this.isRiftVisible
      ) {
        this.spawnRift();
      }
    }, 5000);
  }

  private stopRiftSpawning() {
    if (this.spawnInterval) {
      clearInterval(this.spawnInterval);
    }
    if (this.riftTimeout) {
      clearTimeout(this.riftTimeout);
    }
  }

  private spawnRift() {
    // Calculer une position aléatoire dans la fenêtre
    const maxX = window.innerWidth - 100;
    const maxY = window.innerHeight - 100;
    this.riftPosition = {
      x: Math.floor(Math.random() * maxX) + 50,
      y: Math.floor(Math.random() * maxY) + 50,
    };

    this.isRiftVisible = true;
    this.lastSpawnTime = Date.now();

    // Faire disparaître la faille après 5 secondes
    this.riftTimeout = window.setTimeout(() => {
      this.isRiftVisible = false;
    }, this.RIFT_DURATION);
  }

  catchRift() {
    if (!this.isRiftVisible) return;

    this.isRiftVisible = false;
    if (this.riftTimeout) {
      clearTimeout(this.riftTimeout);
    }

    // Réduire le cooldown du Chronotron
    this.gameService.reduceChronotronCooldown();
    this.notificationService.show(
      'Faille temporelle capturée ! Cooldown du Chronotron réduit de moitié !',
      'success'
    );
  }
}
