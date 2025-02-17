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
      [class.capturing]="isCapturing"
    >
      <i class="fas fa-bolt"></i>
      @if (isCapturing) {
      <div class="capture-effect">
        <div class="flash-ring"></div>
        <div class="energy-burst"></div>
        <div class="shockwave"></div>
      </div>
      }
    </div>
    }
  `,
  styles: [
    `
      :host {
        position: fixed;
        inset: 0;
        pointer-events: none;
        z-index: 999999;
      }

      .time-rift {
        position: fixed;
        width: 80px;
        height: 80px;
        background: radial-gradient(
          circle,
          rgba(79, 172, 254, 0.4) 0%,
          rgba(0, 242, 254, 0.3) 50%,
          transparent 70%
        );
        border: 2px solid transparent;
        border-image: linear-gradient(45deg, #4facfe, #00f2fe) 1;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        animation: pulse 2s infinite, rotate 8s linear infinite,
          fadeOut 5s linear;
        box-shadow: 0 0 30px rgba(79, 172, 254, 0.8);
        pointer-events: auto;
        transform-style: preserve-3d;
        perspective: 1000px;
        position: relative;
        overflow: visible;
      }

      .time-rift.capturing {
        animation: none;
        transform: scale(1.5);
        transition: transform 0.3s ease-out;
      }

      .capture-effect {
        position: absolute;
        inset: -100%;
        pointer-events: none;
      }

      .flash-ring {
        position: absolute;
        inset: -50%;
        border-radius: 50%;
        background: radial-gradient(
          circle,
          rgba(255, 255, 255, 1) 0%,
          rgba(79, 172, 254, 0.8) 30%,
          transparent 70%
        );
        animation: flash-expand 0.5s ease-out forwards;
      }

      .energy-burst {
        position: absolute;
        inset: -25%;
        border-radius: 50%;
        background: radial-gradient(
          circle,
          rgba(255, 255, 255, 1) 0%,
          #4facfe 30%,
          transparent 70%
        );
        animation: burst 0.5s ease-out forwards;
      }

      .shockwave {
        position: absolute;
        inset: -50%;
        border: 4px solid rgba(79, 172, 254, 0.8);
        border-radius: 50%;
        animation: shockwave 0.5s ease-out forwards;
      }

      @keyframes flash-expand {
        0% {
          transform: scale(0.1);
          opacity: 1;
        }
        100% {
          transform: scale(3);
          opacity: 0;
        }
      }

      @keyframes burst {
        0% {
          transform: scale(0.1);
          opacity: 1;
        }
        50% {
          opacity: 1;
          transform: scale(2);
        }
        100% {
          transform: scale(3);
          opacity: 0;
        }
      }

      @keyframes shockwave {
        0% {
          transform: scale(0.1);
          opacity: 1;
          border-width: 20px;
        }
        100% {
          transform: scale(4);
          opacity: 0;
          border-width: 1px;
        }
      }

      .time-rift::before {
        content: '';
        position: absolute;
        inset: -4px;
        border: 2px solid rgba(79, 172, 254, 0.5);
        animation: spin 3s linear infinite;
      }

      .time-rift::after {
        content: '';
        position: absolute;
        inset: -8px;
        border: 2px solid rgba(0, 242, 254, 0.4);
        animation: spin 4s linear infinite reverse;
      }

      .time-rift i {
        color: #4facfe;
        font-size: 2.5rem;
        filter: drop-shadow(0 0 15px rgba(79, 172, 254, 1));
        animation: glowPulse 2s infinite;
        z-index: 2;
      }

      @keyframes pulse {
        0% {
          transform: scale3d(1, 1, 1) rotate(0deg);
        }
        50% {
          transform: scale3d(1.2, 1.2, 1.2) rotate(180deg);
        }
        100% {
          transform: scale3d(1, 1, 1) rotate(360deg);
        }
      }

      @keyframes rotate {
        0% {
          transform: rotate(0deg);
        }
        100% {
          transform: rotate(360deg);
        }
      }

      @keyframes spin {
        0% {
          transform: rotate(0deg);
        }
        100% {
          transform: rotate(360deg);
        }
      }

      @keyframes glowPulse {
        0% {
          filter: drop-shadow(0 0 15px rgba(79, 172, 254, 1));
          transform: scale(1);
        }
        50% {
          filter: drop-shadow(0 0 25px rgba(0, 242, 254, 1));
          transform: scale(1.2);
        }
        100% {
          filter: drop-shadow(0 0 15px rgba(79, 172, 254, 1));
          transform: scale(1);
        }
      }

      @keyframes fadeOut {
        0% {
          opacity: 0;
          transform: scale3d(0.3, 0.3, 0.3) rotate(0deg);
        }
        10% {
          opacity: 1;
          transform: scale3d(1, 1, 1) rotate(36deg);
        }
        90% {
          opacity: 1;
          transform: scale3d(1, 1, 1) rotate(324deg);
        }
        100% {
          opacity: 0;
          transform: scale3d(0.3, 0.3, 0.3) rotate(360deg);
        }
      }
    `,
  ],
})
export class TimeRiftComponent implements OnInit, OnDestroy {
  isRiftVisible = false;
  isCapturing = false;
  riftPosition = { x: 0, y: 0 };
  private riftTimeout?: number;
  private spawnInterval?: number;
  private lastSpawnTime = 0;
  private readonly SPAWN_INTERVAL = 20000; // 10 secondes entre chaque spawn
  private readonly RIFT_DURATION = 3000; // 7 secondes de visibilité
  private readonly CHECK_INTERVAL = 5000; // Vérifier toutes les 2 secondes

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
    // Vérifier toutes les 2 secondes si on peut faire apparaître une faille
    this.spawnInterval = window.setInterval(() => {
      const now = Date.now();
      const canSpawn =
        this.gameService.isChronotronOnCooldown() &&
        now - this.lastSpawnTime >= this.SPAWN_INTERVAL &&
        !this.isRiftVisible;

      if (canSpawn) {
        this.spawnRift();
      }
    }, this.CHECK_INTERVAL);
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

    // Faire disparaître la faille après la durée spécifiée
    this.riftTimeout = window.setTimeout(() => {
      this.isRiftVisible = false;
    }, this.RIFT_DURATION);
  }

  catchRift() {
    if (!this.isRiftVisible) return;

    this.isCapturing = true;

    // Attendre la fin de l'animation avant de faire disparaître la faille
    setTimeout(() => {
      this.isRiftVisible = false;
      this.isCapturing = false;
      if (this.riftTimeout) {
        clearTimeout(this.riftTimeout);
      }

      // Réduire le cooldown du Chronotron
      this.gameService.reduceChronotronCooldown();
      this.notificationService.show(
        'Faille temporelle capturée ! Cooldown du Chronotron réduit de moitié !',
        'success'
      );
    }, 600);
  }
}
