import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GameService } from '../../../../core/services/game.service';
import { Building } from '../../../../core/models/building.model';
import { Subscription } from 'rxjs';
import { NumberFormatPipe } from '../../../../core/pipes/number-format.pipe';
import { GameState } from '../../../../core/models/game-state.model';

type EffectType =
  | 'tick_rate'
  | 'cost_reduction'
  | 'production_boost'
  | 'resource_multiplier';

interface EffectIcons {
  tick_rate: string;
  cost_reduction: string;
  production_boost: string;
  resource_multiplier: string;
}

interface EffectLabels {
  tick_rate: string;
  cost_reduction: string;
  production_boost: string;
  resource_multiplier: string;
}

@Component({
  selector: 'app-building-display',
  standalone: true,
  imports: [CommonModule, NumberFormatPipe],
  template: `
    <div class="buildings-grid">
      @for (building of buildings$ | async; track building.id) {
      <div class="building-card" [class.locked]="!building.unlocked">
        <div
          class="building-image"
          [style.--building-image]="
            'url(/assets/images/' + building.imageIndex + '.webp)'
          "
        ></div>

        <div class="card-header">
          <div class="title">
            <div class="name-row">
              <h3>{{ building.name }}</h3>
            </div>

            <div class="stats-row">
              <div class="stat">
                <span class="value">{{ building.amount || 0 }}</span>
                <span class="label">POSSÉDÉS</span>
              </div>

              @if (building.baseProduction > 0) {
              <div class="stat">
                <span class="value">
                  {{
                    building.baseProduction * (building.amount || 0)
                      | numberFormat
                  }}/s
                </span>
                <span class="label">PRODUCTION</span>
              </div>
              } @if (building.effect) {
              <div
                class="stat effect"
                [class]="'effect-' + building.effect.type"
                (mouseenter)="showTooltip($event, building)"
                (mouseleave)="hideTooltip()"
              >
                <span class="value">
                  <i [class]="getEffectIcon(building.effect.type)"></i>
                  {{ getEffectShortDisplay(building.effect) }}
                </span>
                <span class="label">EFFET</span>
              </div>
              }
            </div>
          </div>
        </div>

        <div class="button-group">
          <button
            class="buy-button"
            [class.disabled]="!canPurchase(building.id)"
            (click)="purchase(building.id)"
          >
            <div class="button-frame">
              <span class="button-content">
                <span class="action">×1</span>
                <span class="price">
                  <span class="amount">{{
                    getBuildingCost(building.id) | numberFormat
                  }}</span>
                  <i class="fas fa-clock"></i>
                </span>
              </span>
            </div>
          </button>

          <button
            class="buy-button buy-max"
            [class.disabled]="getMaxPurchase(building.id) === 0"
            (click)="purchaseMax(building.id)"
          >
            <div class="button-frame">
              <span class="button-content">
                <span class="action">Max</span>
                <span class="price">
                  <span class="amount">×{{ getMaxPurchase(building.id) }}</span>
                </span>
              </span>
            </div>
          </button>
        </div>

        @if (!building.unlocked) {
        <div class="unlock-section">
          <p>Verrouillé</p>
          <button
            class="unlock-button"
            [disabled]="!canUnlock(building)"
            (click)="unlockBuilding(building)"
          >
            Débloquer ({{ building.unlockCost }} <i class="fas fa-clock"></i>)
          </button>
        </div>
        } @else {
        <div class="building-controls">
          <!-- ... -->
        </div>
        }
      </div>
      }
    </div>

    <div
      class="tooltip"
      *ngIf="activeTooltip"
      [style.left.px]="tooltipX"
      [style.top.px]="tooltipY"
      [class.visible]="activeTooltip"
    >
      {{ activeTooltip }}
    </div>
  `,
  styles: [
    `
      .buildings-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
        gap: 1rem;
        padding: 1rem;
      }

      .building-card {
        background: rgba(255, 255, 255, 0.05);
        border-radius: 12px;
        overflow: hidden;
        transition: transform 0.2s ease;
        position: relative;
      }

      .building-card:hover {
        transform: translateY(-2px);
      }

      .building-image {
        width: 100%;
        height: 160px;
        background-image: var(--building-image);
        background-size: cover;
        background-position: center;
        transition: transform 0.3s ease;
        position: relative;
      }

      .building-image::after {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: linear-gradient(
          to bottom,
          rgba(0, 0, 0, 0) 0%,
          rgba(0, 0, 0, 0.8) 100%
        );
      }

      .building-card:hover .building-image {
        transform: scale(1.1);
      }

      .card-header {
        position: relative;
        padding: 1rem;
        background: rgba(0, 0, 0, 0.7);
        backdrop-filter: blur(10px);
      }

      .name-row {
        display: flex;
        justify-content: center;
        align-items: center;
        padding: 0.5rem 0;
      }

      h3 {
        margin: 0;
        font-size: 1.2rem;
        color: #4facfe;
        text-shadow: 0 0 10px rgba(79, 172, 254, 0.5);
        text-align: center;
      }

      .stats-row {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(80px, 1fr));
        gap: 0.5rem;
        margin-top: 0.75rem;
      }

      .stat {
        display: flex;
        flex-direction: column;
        align-items: center;
        text-align: center;
        position: relative;
      }

      .stat .value {
        font-size: 0.9rem;
        font-weight: 500;
        display: flex;
        align-items: center;
        gap: 0.3rem;
      }

      .stat .label {
        font-size: 0.65rem;
        letter-spacing: 0.05em;
        opacity: 0.6;
        margin-top: 0.2rem;
      }

      .stat.effect {
        position: relative;
      }

      .effect-tick_rate .value {
        color: #64b5f6;
      }
      .effect-cost_reduction .value {
        color: #ba68c8;
      }
      .effect-production_boost .value {
        color: #ffb74d;
      }
      .effect-resource_multiplier .value {
        color: #e57373;
      }

      .effect i {
        font-size: 0.9rem;
      }

      .button-group {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 1px;
        margin: 0 -1px -1px -1px;
        background: rgba(79, 172, 254, 0.2);
      }

      .buy-button {
        width: 100%;
        padding: 0;
        border: none;
        background: none;
        cursor: pointer;
        position: relative;
        transition: all 0.2s ease;
      }

      .button-frame {
        background: linear-gradient(
          180deg,
          rgba(13, 17, 23, 0.95) 0%,
          rgba(13, 17, 23, 0.85) 100%
        );
        border: none;
        padding: 0.6rem;
        position: relative;
        overflow: hidden;
      }

      .button-frame::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        height: 1px;
        background: linear-gradient(
          90deg,
          transparent,
          rgba(79, 172, 254, 0.5),
          transparent
        );
      }

      .button-content {
        display: flex;
        justify-content: center;
        align-items: center;
        gap: 0.75rem;
        position: relative;
        z-index: 1;
      }

      .action {
        font-weight: 600;
        color: #fff;
        text-shadow: 0 0 10px rgba(79, 172, 254, 0.5);
      }

      .price {
        display: flex;
        align-items: center;
        gap: 0.4rem;
        padding: 0.2rem 0.4rem;
        background: rgba(79, 172, 254, 0.15);
        border-radius: 4px;
        font-size: 0.85rem;
        color: #64b5f6;
        border: 1px solid rgba(79, 172, 254, 0.2);
      }

      .buy-button:hover:not(.disabled) .button-frame {
        background: linear-gradient(
          180deg,
          rgba(79, 172, 254, 0.15) 0%,
          rgba(13, 17, 23, 0.95) 100%
        );
      }

      .buy-button.buy-max .button-frame {
        background: linear-gradient(
          180deg,
          rgba(13, 17, 23, 0.95) 0%,
          rgba(13, 17, 23, 0.85) 100%
        );
      }

      .buy-button.buy-max:hover:not(.disabled) .button-frame {
        background: linear-gradient(
          180deg,
          rgba(79, 172, 254, 0.15) 0%,
          rgba(13, 17, 23, 0.95) 100%
        );
      }

      .buy-button.disabled {
        cursor: not-allowed;
      }

      .buy-button.disabled .button-frame {
        opacity: 0.5;
      }

      .buy-button.disabled .price {
        opacity: 0.7;
      }

      .effect {
        cursor: help;
      }

      .effect .value {
        display: flex;
        align-items: center;
        gap: 0.3rem;
      }

      .effect-tick_rate .value {
        color: #64b5f6;
      }
      .effect-cost_reduction .value {
        color: #ba68c8;
      }
      .effect-production_boost .value {
        color: #ffb74d;
      }
      .effect-resource_multiplier .value {
        color: #e57373;
      }

      .tooltip {
        position: absolute;
        background: rgba(13, 17, 23, 0.95);
        color: #fff;
        padding: 0.6rem 1rem;
        border-radius: 8px;
        font-size: 0.85rem;
        max-width: 250px;
        z-index: 1000;
        pointer-events: none;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
        border: 1px solid rgba(79, 172, 254, 0.2);
        backdrop-filter: blur(8px);
        transform: translateY(10px);
        opacity: 0;
        transition: all 0.2s ease;
      }

      .tooltip.visible {
        transform: translateY(0);
        opacity: 1;
      }

      .tooltip::after {
        content: '';
        position: absolute;
        bottom: -6px;
        left: 50%;
        transform: translateX(-50%);
        width: 0;
        height: 0;
        border-left: 6px solid transparent;
        border-right: 6px solid transparent;
        border-top: 6px solid rgba(13, 17, 23, 0.95);
      }

      .buy-button.buy-max .action {
        color: #64b5f6;
      }

      .buy-button.buy-max .price {
        background: rgba(255, 255, 255, 0.1);
      }

      .buy-button.buy-max .amount {
        font-weight: 600;
        color: white;
      }

      .building-card.locked {
        opacity: 0.7;
        background: rgba(0, 0, 0, 0.3);
      }

      .unlock-section {
        text-align: center;
        padding: 1rem;
      }

      .unlock-button {
        background: #4facfe;
        color: white;
        border: none;
        padding: 0.5rem 1rem;
        border-radius: 4px;
        cursor: pointer;
        transition: background-color 0.2s;
      }

      .unlock-button:disabled {
        background: #666;
        cursor: not-allowed;
      }

      .unlock-button:hover:not(:disabled) {
        background: #2196f3;
      }
    `,
  ],
})
export class BuildingDisplayComponent implements OnInit, OnDestroy {
  buildings: Building[] = [];
  private subscription?: Subscription;
  activeTooltip: string | null = null;
  tooltipX = 0;
  tooltipY = 0;
  private currentState?: GameState;

  constructor(private gameService: GameService) {}

  ngOnInit(): void {
    this.subscription = this.gameService.gameState$.subscribe((state) => {
      this.buildings = this.gameService.getAllBuildings();
      this.currentState = state;
    });
  }

  ngOnDestroy(): void {
    this.subscription?.unsubscribe();
  }

  private updateBuildings(): void {
    this.buildings = this.gameService.getAllBuildings();
  }

  getBuildingCost(buildingId: string): number {
    return this.gameService.getBuildingCost(buildingId);
  }

  canPurchase(buildingId: string): boolean {
    return this.gameService.canPurchaseBuilding(buildingId);
  }

  purchase(buildingId: string): void {
    this.gameService.purchaseBuilding(buildingId);
  }

  getEffectIcon(type: EffectType): string {
    const icons: EffectIcons = {
      tick_rate: 'fas fa-bolt',
      cost_reduction: 'fas fa-tags',
      production_boost: 'fas fa-industry',
      resource_multiplier: 'fas fa-star',
    };
    return icons[type] || 'fas fa-cube';
  }

  getEffectLabel(type: EffectType): string {
    const labels: EffectLabels = {
      tick_rate: 'EFFET',
      cost_reduction: 'EFFET',
      production_boost: 'BOOST',
      resource_multiplier: 'MULTI',
    };
    return labels[type];
  }

  formatEffectValue(building: Building): string {
    const effect = building.effect;
    if (!effect) return '';

    const value = Math.round((effect.value - 1) * 100);
    const absValue = Math.abs(value);

    switch (effect.type) {
      case 'tick_rate':
        return `-${absValue}% vitesse`;
      case 'cost_reduction':
        return `-${absValue}% coûts`;
      case 'production_boost':
        if (effect.target) {
          const targetBuilding = this.gameService.getBuildingDefinition(
            effect.target
          );
          if (targetBuilding) {
            return `+${absValue}% ${targetBuilding.name}`;
          }
          return `+${absValue}% production`;
        }
        return `+${absValue}% production`;
      case 'resource_multiplier':
        return `×${effect.value} ressources`;
      default:
        return `${value}%`;
    }
  }

  getImagePosition(index: number): string {
    const row = Math.floor(index / 6);
    const col = index % 6;
    return `${col * 20}% ${row * 20}%`;
  }

  getEffectShortDisplay(effect: Building['effect']): string {
    if (!effect) return '';
    const value = Math.abs(Math.round((effect.value - 1) * 100));

    switch (effect.type) {
      case 'tick_rate':
        return `-${value}%`;
      case 'cost_reduction':
        return `-${value}%`;
      case 'production_boost':
        return `+${value}%`;
      case 'resource_multiplier':
        return `×${effect.value}`;
      default:
        return `${value}%`;
    }
  }

  getEffectDescription(building: Building): string {
    const effect = building.effect;
    if (!effect) return '';
    const value = Math.abs(Math.round((effect.value - 1) * 100));

    switch (effect.type) {
      case 'tick_rate':
        return `Réduit le temps entre chaque tick de ${value}%`;
      case 'cost_reduction':
        return `Réduit le coût de tous les bâtiments de ${value}%`;
      case 'production_boost':
        if (effect.target) {
          const targetBuilding = this.gameService.getBuildingDefinition(
            effect.target
          );
          return `Augmente la production des ${targetBuilding.name}s de ${value}%`;
        }
        return `Augmente la production globale de ${value}%`;
      case 'resource_multiplier':
        return `Multiplie la production de ressources par ${effect.value}`;
      default:
        return '';
    }
  }

  showTooltip(event: MouseEvent, building: Building) {
    const description = this.getEffectDescription(building);
    if (!description) return;

    const element = event.currentTarget as HTMLElement;
    const rect = element.getBoundingClientRect();

    this.activeTooltip = description;

    this.tooltipX = rect.left + rect.width / 2 - 125;
    this.tooltipY = rect.top - 60;
  }

  hideTooltip() {
    this.activeTooltip = null;
  }

  getMaxPurchase(buildingId: string): number {
    if (!this.currentState) return 0;

    let resources = this.currentState.resources.timeFragments;
    let maxPurchase = 0;
    const currentAmount = this.currentState.buildings[buildingId] || 0;

    // Calculer le coût pour chaque achat supplémentaire
    while (true) {
      // Simuler le coût comme si on avait déjà acheté maxPurchase bâtiments
      const nextCost = this.gameService.getBuildingCost(
        buildingId,
        maxPurchase
      );

      if (resources < nextCost) break;

      resources -= nextCost;
      maxPurchase++;

      // Limite de sécurité pour éviter une boucle infinie
      if (maxPurchase > 1000) break;
    }

    return maxPurchase;
  }

  purchaseMax(buildingId: string): void {
    const maxAmount = this.getMaxPurchase(buildingId);
    if (maxAmount > 0) {
      for (let i = 0; i < maxAmount; i++) {
        if (!this.gameService.canPurchaseBuilding(buildingId)) break;
        this.purchase(buildingId);
      }
    }
  }

  canUnlock(building: Building): boolean {
    return this.gameService.canUnlockBuilding(building.id);
  }

  unlockBuilding(building: Building): void {
    this.gameService.unlockBuilding(building.id);
  }
}
