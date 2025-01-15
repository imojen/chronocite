import {
  Component,
  inject,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  NgZone,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { GameService } from '../../../../core/services/game.service';
import { Observable } from 'rxjs';
import { Building } from '../../../../core/models/building.model';
import { BUILDINGS } from '../../../../core/data/buildings.data';
import { GameState } from '../../../../core/models/game-state.model';
import { map } from 'rxjs/operators';
import { DialogService } from '../../../../core/services/dialog.service';

interface BuildingWithProduction extends Building {
  amount: number;
  production: number;
}

@Component({
  selector: 'app-building-panel',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="buildings-grid">
      @for (building of buildings$ | async; track building.id) {
      <div
        class="building-card"
        [attr.data-id]="building.id"
        [class.locked]="!building.unlocked"
      >
        <div class="card-header">
          <div class="name-row">
            <h3>{{ building.name }}</h3>
            <div class="level-badge" *ngIf="building.id !== 'chronosphere'">
              <div class="level-ring"></div>
              <span class="level-text">Niv. {{ building.amount }}</span>
            </div>
          </div>
        </div>
        <div class="card-image">
          <img
            [src]="'assets/images/' + building.imageIndex + '.webp'"
            [alt]="building.name"
            loading="lazy"
          />
        </div>
        <div class="description-area">
          <p>{{ building.description }}</p>
          @if (building.isClickable && building.unlocked) {
          <button
            class="mining-button"
            (click)="mineTimeFragment($event, building)"
          >
            <div class="mining-button-content">
              <i class="fas fa-hammer"></i>
              <span>Miner</span>
            </div>
            @for (floatingNumber of floatingNumbers; track floatingNumber.id) {
            <div
              class="floating-number"
              [style.--x]="floatingNumber.x + 'px'"
              [style.--y]="floatingNumber.y + 'px'"
            >
              +{{ floatingNumber.value | number : '1.1-1' }}
            </div>
            }
          </button>
          }
        </div>
        <div class="stats-container" *ngIf="building.id !== 'chronosphere'">
          <div class="stat-item">
            @if (building.isClickable) {
            <div class="stat-label">Fragments de temps par minage</div>
            <div class="stat-value">
              +{{ getMiningValue(building) | number : '1.1-1' }}
            </div>
            } @else if (building.effect?.type === 'tick_rate') {
            <div class="stat-label">Réduction du tick</div>
            <div class="stat-value">
              -{{
                calculateEffectValue(building.effect?.value, building)
                  | number : '1.1-1'
              }}%
            </div>
            } @else if (building.effect?.type === 'cost_reduction') {
            <div class="stat-label">Réduction des coûts</div>
            <div class="stat-value">
              -{{
                calculateEffectValue(building.effect?.value, building)
                  | number : '1.1-1'
              }}%
            </div>
            } @else if (building.effect?.type === 'production_boost') { @if
            (building.effect?.target) {
            <div class="stat-label">
              Bonus {{ getBuildingName(building.effect?.target || '') }}
            </div>
            } @else {
            <div class="stat-label">Bonus global</div>
            }
            <div class="stat-value">
              +{{
                calculateBoostValue(building.effect?.value) | number : '1.1-1'
              }}%
            </div>
            } @else if (building.effect?.type === 'resource_multiplier') {
            <div class="stat-label">Multiplicateur de ressources</div>
            <div class="stat-value">
              ×{{ building.effect?.value || 1 | number : '1.1-1' }}
            </div>
            } @else if (building.effect?.type === 'resource_production') {
            <div class="stat-label">Production de savoir</div>
            <div class="stat-value">
              +{{
                building.baseProduction * building.amount | number : '1.3-3'
              }}/tick
            </div>
            } @else {
            <div class="stat-label">Production</div>
            <div class="stat-value">
              {{ building.production | number : '1.1-1' }}/tick
            </div>
            }
          </div>
        </div>
        <div class="card-footer">
          <div class="action-buttons">
            @if (building.id === 'chronosphere') {
            <button
              class="buy-button activate-button"
              [class.disabled]="!building.unlocked"
              (click)="activateChronosphere()"
            >
              <div class="button-frame">
                <span>Activation</span>
              </div>
            </button>
            } @else {
            <button
              class="upgrade-button"
              [disabled]="!canPurchase(building.id)"
              (click)="purchase(building.id)"
            >
              <i class="fas fa-arrow-trend-up"></i>
              <span>Améliorer</span>
              <span class="cost">{{ getBuildingCost(building.id) }}</span>
            </button>
            <button class="max-button" (click)="purchaseMax(building.id)">
              Max
            </button>
            }
          </div>
        </div>

        @if (!building.unlocked) {
        <div class="lock-layer">
          <div class="lock-content">
            <i class="fas fa-lock lock-icon"></i>
            <h3>{{ building.name }}</h3>
            <p>Bâtiment verrouillé</p>
            <div class="unlock-cost">
              <span>Coût : </span>
              <span class="cost-value">
                {{ building.unlockCost }}
                <i class="fas fa-clock"></i>
              </span>
            </div>
            <button
              class="unlock-button"
              [disabled]="!canUnlock(building)"
              (click)="unlockBuilding(building)"
            >
              Débloquer
            </button>
          </div>
        </div>
        } @if (purchaseEffects[building.id]) {
        <div class="particles-container">
          @for (i of [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16]; track i) {
          <div
            class="particle"
            [style.--angle]="(360 / 16) * i + 'deg'"
            [style.--delay]="i * 30 + 'ms'"
            [style.--distance]="80 + Math.random() * 40 + 'px'"
          ></div>
          }
        </div>
        }
      </div>
      }
    </div>
  `,
  styles: [
    `
      .buildings-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
        gap: 1.5rem;
        padding: 1rem;
      }

      h2 {
        color: #fff;
        margin-bottom: 1.5rem;
        font-size: 1.5rem;
        grid-column: 1/-1;
      }

      .building-card {
        background: rgba(30, 36, 44, 0.8);
        overflow: hidden;
        display: flex;
        flex-direction: column;
        transition: transform 0.2s;
        position: relative;
        border-radius: 0;
      }

      .building-card:hover {
        transform: translateY(-2px);
      }

      .card-header {
        padding: 0.75rem 1rem;
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
      }

      .name-row {
        display: flex;
        justify-content: space-between;
        align-items: center;
        min-height: 32px;
        margin-bottom: 0rem;
      }

      h3 {
        margin: 0;
        color: #4facfe;
        font-size: 1.1rem;
        text-shadow: 0 0 10px rgba(79, 172, 254, 0.5);
        line-height: 1;
      }

      .amount {
        background: #2d3748;
        color: #64b5f6;
        padding: 0.25rem 0.75rem;
        border-radius: 1rem;
        font-size: 0.9rem;
      }

      .card-image {
        width: 100%;
        height: 160px;
        overflow: hidden;
        position: relative;
      }

      .card-image img {
        width: 100%;
        height: 100%;
        object-fit: cover;
        transition: transform 0.3s;
      }

      .building-card:hover .card-image img {
        transform: scale(1.05);
      }

      .description {
        color: #a8b2c1;
        margin: 0;
        padding: 1rem;
        font-size: 0.9rem;
        flex-grow: 1;
      }

      .production-info {
        padding: 0.5rem 1rem;
        color: #64b5f6;
        font-size: 0.9rem;
        background: rgba(22, 27, 34, 0.4);
      }

      .card-footer {
        display: grid;
        grid-template-columns: 1fr auto;
        gap: 0.75rem;
        background: rgba(22, 27, 34, 0.8);
        margin-top: auto;
        display: flex;
      }

      button {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 0;
        border: none;
        border-radius: 0;
        padding: 0.75rem 1rem;
        cursor: pointer;
        transition: all 0.2s;
        font-weight: 500;
      }

      .buy-button {
        background: linear-gradient(45deg, #4facfe 0%, #00f2fe 100%);
        color: white;
        text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
      }

      .buy-button:hover:not(:disabled) {
        transform: translateY(-1px);
        box-shadow: 0 4px 12px rgba(79, 172, 254, 0.3);
      }

      .buy-max-button {
        background: linear-gradient(45deg, #2d3748 0%, #4a5568 100%);
        color: white;
      }

      .buy-max-button:hover:not(:disabled) {
        transform: translateY(-1px);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
      }

      button:disabled {
        background: #1a202c;
        color: #718096;
        cursor: not-allowed;
        transform: none !important;
        box-shadow: none !important;
      }

      .amount-badge {
        background: linear-gradient(45deg, #2d3748, #4a5568);
        color: #64b5f6;
        padding: 0.4rem 0.8rem;
        border-radius: 0;
        font-size: 0.9rem;
        display: flex;
        align-items: center;
        gap: 0.5rem;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
      }

      .stats-container {
        padding: 0.75rem 1rem;
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
      }

      .stat-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        color: #a8b2c1;
      }

      .stat-label {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        font-size: 0.9rem;
      }

      .stat-value {
        color: #4facfe;
        font-weight: 500;
      }

      .stat-label i {
        color: #4facfe;
        width: 16px;
        text-align: center;
      }

      .lock-layer {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.85);
        backdrop-filter: blur(2px);
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: inherit;
        z-index: 10;
      }

      .lock-content {
        text-align: center;
        color: white;
        padding: 1rem;
      }

      .lock-icon {
        font-size: 2rem;
        color: #4facfe;
        margin-bottom: 1rem;
      }

      .unlock-button {
        margin-top: 0.5rem;
        background: linear-gradient(45deg, #1e3c72 0%, #4facfe 100%);
        color: rgba(255, 255, 255, 0.95);
        border: none;
        padding: 0.75rem 1rem;
        border-radius: 4px;
        cursor: pointer;
        transition: all 0.3s ease;
        font-size: 0.9rem;
        text-transform: uppercase;
        letter-spacing: 1px;
        position: relative;
        overflow: hidden;
        width: 160px;
        height: 40px;
        margin-left: auto;
        margin-right: auto;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 0 15px rgba(79, 172, 254, 0.3);
        text-shadow: 0 0 5px rgba(255, 255, 255, 0.5);
        white-space: nowrap;
        flex-shrink: 0;
      }

      .unlock-button:before {
        content: '';
        position: absolute;
        top: 0;
        left: -100%;
        width: 100%;
        height: 100%;
        background: linear-gradient(
          120deg,
          transparent,
          rgba(255, 255, 255, 0.2),
          transparent
        );
        transition: 0.5s;
      }

      .unlock-button:hover:not(:disabled) {
        transform: translateY(-2px);
        box-shadow: 0 0 20px rgba(79, 172, 254, 0.5);
      }

      .unlock-button:hover:not(:disabled):before {
        left: 100%;
      }

      .unlock-button:disabled {
        background: linear-gradient(45deg, #2a2a2a 0%, #444 100%);
        cursor: not-allowed;
        opacity: 0.7;
      }

      .unlock-button:active:not(:disabled) {
        transform: translateY(0);
        box-shadow: 0 0 10px rgba(79, 172, 254, 0.4);
      }

      .cost {
        display: flex;
        align-items: center;
        gap: 0.25rem;
      }

      .cost i {
        font-size: 0.9rem;
      }

      .unlock-cost {
        margin: 1rem 0;
        font-size: 1.1rem;
        color: #4facfe;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 0.5rem;
      }

      .cost-value {
        display: flex;
        align-items: center;
        gap: 0.25rem;
        font-weight: bold;
      }

      .cost-value i {
        font-size: 0.9rem;
      }

      .particles-container {
        position: absolute;
        inset: 0;
        pointer-events: none;
        z-index: 10;
        perspective: 1000px;
      }

      .particle {
        position: absolute;
        width: 6px;
        height: 6px;
        top: 50%;
        left: 50%;
        background: #4facfe;
        border-radius: 50%;
        box-shadow: 0 0 20px 4px rgba(79, 172, 254, 0.8),
          0 0 8px 1px rgba(0, 242, 254, 0.6);
        animation: explode 0.8s cubic-bezier(0.12, 0, 0.39, 0) forwards;
        animation-delay: var(--delay);
      }

      @keyframes explode {
        0% {
          opacity: 1;
          transform: translate(-50%, -50%) rotate(var(--angle)) translateY(0)
            scale(0.3);
        }
        50% {
          opacity: 1;
          transform: translate(-50%, -50%) rotate(var(--angle))
            translateY(calc(var(--distance) * -0.5)) scale(1.2);
        }
        100% {
          opacity: 0;
          transform: translate(-50%, -50%) rotate(var(--angle))
            translateY(calc(var(--distance) * -1)) scale(0.2);
        }
      }

      .building-card.purchasing {
        animation: purchase-pulse 0.8s ease-out;
      }

      @keyframes purchase-pulse {
        0% {
          transform: scale(1);
          box-shadow: 0 0 0 0 rgba(79, 172, 254, 0.4);
        }
        30% {
          transform: scale(1.03);
          box-shadow: 0 0 30px 15px rgba(79, 172, 254, 0.3);
        }
        100% {
          transform: scale(1);
          box-shadow: 0 0 0 0 rgba(79, 172, 254, 0);
        }
      }

      .building-card::before {
        content: '';
        position: absolute;
        inset: 0;
        background: radial-gradient(
          circle at center,
          rgba(79, 172, 254, 0.3),
          transparent 70%
        );
        opacity: 0;
        transition: opacity 0.3s;
        z-index: 1;
        pointer-events: none;
      }

      .building-card.purchasing::before {
        animation: glow 0.8s ease-out;
      }

      @keyframes glow {
        0% {
          opacity: 0;
        }
        50% {
          opacity: 1;
        }
        100% {
          opacity: 0;
        }
      }

      .mining-section {
        padding: 1rem;
      }

      .mining-info {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 1rem;
      }

      .description {
        color: #a8b2c1;
        margin: 0;
        font-size: 0.9rem;
        flex: 1;
      }

      .mining-button {
        background: linear-gradient(135deg, #0a2463 0%, #1e4bd2 100%);
        border: none;
        color: #4facfe;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 0 1.5rem;
        font-size: 0.85rem;
        transition: all 0.2s ease;
        white-space: nowrap;
        position: relative;
        overflow: visible;
        border-left: 1px solid rgba(79, 172, 254, 0.2);
        height: 56px;
        min-width: 80px;
        border-radius: 0;
      }

      .mining-button-content {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 0.3rem;
        z-index: 1;
      }

      .mining-button i {
        font-size: 1.2rem;
        color: #4facfe;
      }

      .mining-button span {
        font-size: 0.8rem;
        color: #4facfe;
      }

      .mining-button::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        height: 1px;
        background: linear-gradient(90deg, transparent, #4facfe, transparent);
      }

      .mining-button:hover {
        background: linear-gradient(135deg, #0a2463 0%, #2857e5 100%);
        box-shadow: inset 0 0 15px rgba(79, 172, 254, 0.2);
      }

      .mining-button:active {
        transform: translateY(1px);
      }

      .mining-button-container {
        position: relative;
        display: flex;
        align-items: center;
      }

      .floating-number {
        position: absolute;
        color: #4facfe;
        font-weight: 500;
        font-size: 0.9rem;
        pointer-events: none;
        animation: float-up 1s ease-out forwards;
        text-shadow: 0 0 10px rgba(79, 172, 254, 0.5);
        z-index: 10;
        left: 50%;
        top: 0;
        transform: translate(-50%, -100%);
        white-space: nowrap;
      }

      @keyframes float-up {
        0% {
          opacity: 0;
          transform: translate(-50%, -100%) scale(0.8);
        }
        20% {
          opacity: 1;
          transform: translate(-50%, -120%) scale(1.1);
        }
        100% {
          opacity: 0;
          transform: translate(-50%, -200%) scale(1);
        }
      }

      .upgrade-button {
        flex: 1;
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 0.75rem 1rem;
        background: linear-gradient(135deg, #0a2463 0%, #1e4bd2 100%);
        border: none;
        border-radius: 0;
        color: #4facfe;
        font-size: 0.9rem;
        cursor: pointer;
        transition: all 0.2s ease;
        position: relative;
        overflow: hidden;
      }

      .upgrade-button::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        height: 1px;
        background: linear-gradient(90deg, transparent, #4facfe, transparent);
      }

      .upgrade-button i {
        font-size: 1rem;
        background: rgba(79, 172, 254, 0.1);
        padding: 0.5rem;
        border-radius: 4px;
        box-shadow: 0 0 10px rgba(79, 172, 254, 0.2);
      }

      .upgrade-button .cost {
        background: rgba(79, 172, 254, 0.1);
        padding: 0.5rem 0.75rem;
        border-radius: 4px;
        font-weight: 500;
        border: 1px solid rgba(79, 172, 254, 0.3);
        box-shadow: 0 0 10px rgba(79, 172, 254, 0.2);
      }

      .upgrade-button:not(:disabled):hover {
        background: linear-gradient(135deg, #0a2463 0%, #2857e5 100%);
        transform: translateY(-1px);
        box-shadow: 0 0 20px rgba(79, 172, 254, 0.2),
          inset 0 0 15px rgba(79, 172, 254, 0.2);
      }

      .upgrade-button:disabled {
        opacity: 0.6;
        cursor: not-allowed;
        background: linear-gradient(135deg, #1a1f2e 0%, #2d3748 100%);
        color: #718096;
      }

      .max-button {
        padding: 0.75rem 1.25rem;
        background: rgba(13, 17, 23, 0.8);
        border: none;
        border-radius: 0;
        color: #4facfe;
        cursor: pointer;
        transition: all 0.2s ease;
        position: relative;
        overflow: hidden;
      }

      .max-button::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        height: 1px;
        background: linear-gradient(90deg, transparent, #4facfe, transparent);
      }

      .max-button:hover {
        background: rgba(20, 26, 35, 0.9);
        box-shadow: inset 0 0 15px rgba(79, 172, 254, 0.2);
      }

      .max-button:active {
        transform: translateY(1px);
      }

      .action-buttons {
        display: flex;
        gap: 2px;
        background: rgba(13, 17, 23, 0.6);
        border-radius: 0 0 8px 8px;
        flex: 1;
      }

      .description-area {
        padding: 0;
        display: flex;
        align-items: center;
        height: 56px;
        border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        background: rgba(13, 17, 23, 0.6);
        position: relative;
        overflow: visible;
      }

      .description-area p {
        color: #a8b2c1;
        margin: 0;
        font-size: 0.8rem;
        line-height: 1.4;
        flex: 1;
        padding: 0.75rem 1rem;
        overflow: hidden;
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
        opacity: 0.9;
        align-self: center;
      }

      .mining-button {
        background: linear-gradient(135deg, #0a2463 0%, #1e4bd2 100%);
        border: none;
        color: #4facfe;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 0 1.5rem;
        font-size: 0.85rem;
        transition: all 0.2s ease;
        white-space: nowrap;
        position: relative;
        overflow: visible;
        border-left: 1px solid rgba(79, 172, 254, 0.2);
        height: 100%;
        min-width: 80px;
      }

      .mining-button::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        height: 1px;
        background: linear-gradient(90deg, transparent, #4facfe, transparent);
      }

      .mining-button:hover {
        background: linear-gradient(135deg, #0a2463 0%, #2857e5 100%);
        box-shadow: inset 0 0 15px rgba(79, 172, 254, 0.2);
      }

      .mining-button:active {
        transform: translateY(1px);
      }

      .mining-button i {
        font-size: 1rem;
        color: #4facfe;
      }

      .level-badge {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        padding: 0.3rem 0.6rem;
        background: linear-gradient(
          135deg,
          rgba(13, 17, 23, 0.8) 0%,
          rgba(30, 75, 210, 0.2) 100%
        );
        border: 1px solid rgba(79, 172, 254, 0.3);
        border-radius: 4px;
        position: relative;
        overflow: hidden;
        height: 32px;
      }

      .level-badge::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        height: 1px;
        background: linear-gradient(90deg, transparent, #4facfe, transparent);
      }

      .level-ring {
        width: 20px;
        height: 20px;
        border: 2px solid #4facfe;
        border-radius: 50%;
        position: relative;
        display: flex;
        align-items: center;
        justify-content: center;
        animation: pulse 2s infinite;
      }

      .level-ring::after {
        content: '';
        position: absolute;
        width: 12px;
        height: 12px;
        background: radial-gradient(circle, #4facfe 0%, transparent 70%);
        border-radius: 50%;
        opacity: 0.5;
      }

      .level-text {
        color: #4facfe;
        font-size: 0.85rem;
        font-weight: 500;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        text-shadow: 0 0 10px rgba(79, 172, 254, 0.5);
      }

      @keyframes pulse {
        0% {
          box-shadow: 0 0 0 0 rgba(79, 172, 254, 0.4);
        }
        70% {
          box-shadow: 0 0 0 6px rgba(79, 172, 254, 0);
        }
        100% {
          box-shadow: 0 0 0 0 rgba(79, 172, 254, 0);
        }
      }

      .stat-label {
        color: #a8b2c1;
        font-size: 0.85rem;
      }

      .stat-value {
        color: #4facfe;
        font-weight: 500;
        font-size: 0.9rem;
      }

      .activate-button {
        background: rgba(220, 38, 38, 0.1) !important;
        color: #ef4444 !important;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        height: 104px;
      }

      .activate-button:hover:not(.disabled) {
        background: rgba(220, 38, 38, 0.2) !important;
      }

      .activate-button .button-frame {
        padding: 1rem;
      }
    `,
  ],
})
export class BuildingPanelComponent {
  resources$: Observable<GameState['resources']>;
  buildings$: Observable<BuildingWithProduction[]>;
  selectedBuilding: Building | null = null;
  purchaseEffects: { [key: string]: boolean } = {};
  protected Math = Math;
  floatingNumbers: Array<{ id: number; value: number; x: number; y: number }> =
    [];
  private nextId = 0;

  private readonly BUILDING_IMAGE_MAP: { [key: string]: number } = {
    generator: 1,
    time_miner: 8,
    accelerator: 2,
    time_compressor: 3,
    efficiency_hub: 4,
    quantum_amplifier: 5,
    temporal_nexus: 6,
    temporal_conduit: 7,
  };

  constructor(
    private gameService: GameService,
    private cdr: ChangeDetectorRef,
    private ngZone: NgZone,
    private dialogService: DialogService
  ) {
    this.resources$ = this.gameService.gameState$.pipe(
      map((state) => state.resources)
    );
    this.buildings$ = this.gameService.getAllBuildings$();
  }

  purchase(buildingId: string): void {
    if (this.canPurchase(buildingId)) {
      this.gameService.purchaseBuilding(buildingId);
      this.triggerPurchaseEffect(buildingId);
    }
  }

  private triggerPurchaseEffect(buildingId: string): void {
    const card = document.querySelector(
      `.building-card[data-id="${buildingId}"]`
    );

    // Activer l'effet
    this.purchaseEffects[buildingId] = true;
    card?.classList.add('purchasing');

    // Nettoyer après l'animation
    setTimeout(() => {
      this.purchaseEffects[buildingId] = false;
      card?.classList.remove('purchasing');
    }, 600);
  }

  canPurchase(buildingId: string): boolean {
    return this.gameService.canPurchaseBuilding(buildingId);
  }

  getBuildingCost(buildingId: string): number {
    return this.gameService.getBuildingCost(buildingId);
  }

  purchaseMax(buildingId: string): void {
    this.gameService.purchaseMaxBuilding(buildingId);
  }

  getBuildingImageNumber(buildingId: string): number {
    return this.BUILDING_IMAGE_MAP[buildingId] || 1;
  }

  canUnlock(building: Building): boolean {
    return this.gameService.canUnlockBuilding(building.id);
  }

  unlockBuilding(building: Building): void {
    if (this.canUnlock(building)) {
      this.gameService.unlockBuilding(building.id);
    }
  }

  isUnlocked(building: Building): boolean {
    return building.unlocked || false;
  }

  mineTimeFragment(event: MouseEvent, building: Building): void {
    const rect = (event.target as HTMLElement).getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    this.ngZone.runOutsideAngular(() => {
      const id = this.nextId++;
      const value = this.getMiningValue(building);

      this.floatingNumbers.push({ id, value, x, y });
      this.gameService.mineTimeFragment();

      // Forcer la détection des changements
      this.ngZone.run(() => {
        this.cdr.detectChanges();
      });

      // Nettoyer après l'animation
      setTimeout(() => {
        this.ngZone.run(() => {
          this.floatingNumbers = this.floatingNumbers.filter(
            (n) => n.id !== id
          );
          this.cdr.detectChanges();
        });
      }, 1000);
    });
  }

  getMiningValue(building: Building): number {
    if (!building.clickValue) return 0;
    const level = this.gameService.getBuildingAmount(building.id);
    const increase = building.clickIncrease || 0;
    return building.clickValue * (1 + level * increase);
  }

  getBuildingName(buildingId: string): string {
    const building = BUILDINGS[buildingId];
    return building ? building.name : '';
  }

  calculatePercentage(value?: number): number {
    if (!value) return 0;
    return (1 - value) * 100;
  }

  calculateBoostPercentage(value?: number): number {
    if (!value) return 0;
    return (value - 1) * 100;
  }

  calculateEffectValue(value?: number, building?: Building): number {
    if (!value || !building) return 0;

    const amount = this.gameService.getBuildingAmount(building.id);

    switch (building.effect?.type) {
      case 'tick_rate':
      case 'cost_reduction':
        const totalReduction = 1 - Math.pow(value, amount);
        return Math.round(totalReduction * 10000) / 100;

      default:
        return (value - 1) * 100;
    }
  }

  calculateBoostValue(value?: number): number {
    if (!value) return 0;
    return (value - 1) * 100;
  }

  async activateChronosphere(): Promise<void> {
    if (!BUILDINGS['chronosphere'].unlocked) return;

    const confirmed = await this.dialogService.confirm({
      title: 'Confirmer le Reset',
      message:
        'Activer la Chronosphère réinitialisera votre cycle actuel. ' +
        'Votre savoir temporel sera converti en points de prestige. ' +
        'Êtes-vous sûr de vouloir continuer ?',
      confirmText: 'Activer',
      cancelText: 'Annuler',
      type: 'warning',
    });

    if (confirmed) {
      this.gameService.resetCycle();
    }
  }
}
