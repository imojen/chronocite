import {
  Component,
  OnInit,
  OnDestroy,
  ChangeDetectorRef,
  ChangeDetectionStrategy,
  NgZone,
} from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { GameService } from '../../../../core/services/game.service';
import { GameState } from '../../../../core/models/game-state.model';
import { Subscription } from 'rxjs';
import { NumberFormatPipe } from '../../../../core/pipes/number-format.pipe';

@Component({
  selector: 'app-resource-display',
  standalone: true,
  imports: [CommonModule, NumberFormatPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="resource-panel">
      <div class="main-display">
        <div class="counter-section">
          <span class="amount">{{
            resources.timeFragments | numberFormat
          }}</span>
          <div class="label">
            <i class="fas fa-clock pulse"></i>
            <span>Fragments de temps</span>
          </div>
        </div>
      </div>

      <div class="stats-section">
        <div class="stat-item">
          <div class="stat-value">
            <i class="fas fa-industry"></i>
            <span>+{{ productionPerTick | number : '1.1-1' }}/tick</span>
          </div>
        </div>

        <div class="stat-item">
          <div class="stat-value">
            <i class="fas fa-bolt"></i>
            <span>{{ tickRate / 1000 | number : '1.1-1' }}s</span>
            @if (tickRate < 1000) {
            <span class="boost"
              >-{{ 100 - (tickRate / 1000) * 100 | number : '1.0-0' }}%</span
            >
            }
          </div>
        </div>
      </div>

      <div class="progress-section">
        <div class="progress-track">
          <div class="progress-fill" [style.width.%]="tickProgress">
            <div class="glow"></div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      .resource-panel {
        background: linear-gradient(
          180deg,
          rgba(13, 17, 23, 0.95) 0%,
          rgba(30, 75, 210, 0.15) 100%
        );
        border: 1px solid rgba(79, 172, 254, 0.3);
        border-radius: 8px;
        padding: 1.5rem;
        display: flex;
        flex-direction: column;
        gap: 1.25rem;
        position: relative;
        overflow: hidden;
      }

      .resource-panel::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        height: 1px;
        background: linear-gradient(90deg, transparent, #4facfe, transparent);
      }

      .counter-section {
        text-align: center;
        padding: 0.5rem;
      }

      .amount {
        font-size: 2.5rem;
        font-weight: 600;
        color: #4facfe;
        text-shadow: 0 0 15px rgba(79, 172, 254, 0.5);
        letter-spacing: 1px;
        display: block;
        margin-bottom: 0.5rem;
      }

      .label {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 0.5rem;
        color: #a8b2c1;
        font-size: 0.9rem;
      }

      .label i {
        color: #4facfe;
      }

      .stats-section {
        display: flex;
        justify-content: space-around;
        padding: 0.75rem;
        background: rgba(13, 17, 23, 0.4);
        border-radius: 6px;
        border: 1px solid rgba(79, 172, 254, 0.2);
      }

      .stat-item {
        text-align: center;
      }

      .stat-value {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        color: #4facfe;
        font-size: 1rem;
      }

      .stat-value i {
        font-size: 0.9rem;
        opacity: 0.8;
      }

      .progress-section {
        padding: 0 0.5rem;
      }

      .progress-track {
        height: 4px;
        background: rgba(13, 17, 23, 0.6);
        border-radius: 2px;
        overflow: hidden;
        position: relative;
      }

      .progress-fill {
        height: 100%;
        background: linear-gradient(90deg, #4facfe, #00f2fe);
        position: relative;
        transition: width 0s linear;
      }

      .glow {
        position: absolute;
        top: 0;
        right: 0;
        bottom: 0;
        width: 20px;
        background: linear-gradient(
          90deg,
          transparent,
          rgba(79, 172, 254, 0.8)
        );
        filter: blur(2px);
      }

      .boost {
        color: #00f2fe;
        font-size: 0.8em;
        padding: 0.2em 0.4em;
        background: rgba(0, 242, 254, 0.1);
        border-radius: 3px;
        margin-left: 0.25rem;
      }

      @keyframes pulse {
        0% {
          transform: scale(1);
        }
        50% {
          transform: scale(1.1);
        }
        100% {
          transform: scale(1);
        }
      }

      .pulse {
        animation: pulse 2s infinite;
      }
    `,
  ],
})
export class ResourceDisplayComponent implements OnInit, OnDestroy {
  resources: GameState['resources'] = { timeFragments: 0 };
  productionPerSecond = 0;
  productionPerTick = 0;
  tickRate = 0;
  tickProgress = 0;
  private subscription?: Subscription;
  private lastTick = Date.now();
  private animationFrame?: number;
  private tickRateSubscription?: Subscription;

  constructor(
    private gameService: GameService,
    private cdr: ChangeDetectorRef,
    private ngZone: NgZone
  ) {
    this.tickRate = this.gameService.getCurrentTickRate();
  }

  ngOnInit(): void {
    this.subscription = this.gameService.gameState$.subscribe((state) => {
      this.resources = state.resources;
      this.productionPerSecond = this.gameService.getCurrentProduction();
      this.productionPerTick = this.gameService.getProductionPerTick();
      this.cdr.markForCheck();
    });

    this.tickRateSubscription = this.gameService.tickRate$.subscribe(
      (newTickRate) => {
        this.tickRate = newTickRate;
        this.lastTick = Date.now();
        this.tickProgress = 0;
        this.cdr.markForCheck();
      }
    );

    this.ngZone.runOutsideAngular(() => {
      const animate = () => {
        const now = Date.now();
        const elapsed = now - this.lastTick;

        this.tickProgress = (elapsed / this.tickRate) * 100;

        if (this.tickProgress >= 100) {
          this.lastTick = now;
          this.tickProgress = 0;
        }

        this.ngZone.run(() => {
          this.cdr.detectChanges();
        });

        this.animationFrame = requestAnimationFrame(animate);
      };

      this.animationFrame = requestAnimationFrame(animate);
    });
  }

  ngOnDestroy(): void {
    this.subscription?.unsubscribe();
    this.tickRateSubscription?.unsubscribe();
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
    }
  }
}
