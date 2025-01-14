import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { GameService } from '../../../../core/services/game.service';
import { Upgrade, UpgradeEffect } from '../../../../core/models/upgrade.model';
import { NumberFormatPipe } from '../../../../core/pipes/number-format.pipe';

@Component({
  selector: 'app-upgrade-display',
  standalone: true,
  imports: [CommonModule, NumberFormatPipe],
  template: `
    <div class="upgrades-grid">
      @for (upgrade of upgrades; track upgrade.id) {
      <div class="upgrade-card" [class.unlocked]="upgrade.unlocked">
        <div class="card-header">
          <div class="title">
            <div class="name-row">
              <h3>{{ upgrade.name }}</h3>
              <div class="cost">
                {{ upgrade.cost | numberFormat }}
                <i class="fas fa-clock"></i>
              </div>
            </div>

            <div class="stats-row">
              <div class="stat">
                <span class="value">
                  <i [class]="getEffectIcon(upgrade.effect.type)"></i>
                  {{ formatEffectValue(upgrade.effect) }}
                </span>
                <span class="label">EFFET</span>
              </div>
            </div>

            @if (upgrade.requirements.buildings) {
            <div class="requirements-row">
              @for (requirement of
              getRequirements(upgrade.requirements.buildings); track
              requirement[0]) {
              <div
                class="stat"
                [class.met]="
                  isBuildingRequirementMet(requirement[0], requirement[1])
                "
              >
                <span class="value">
                  <i class="fas fa-building"></i>
                  {{ requirement[1] }}
                </span>
                <span class="label">{{ getBuildingName(requirement[0]) }}</span>
              </div>
              }
            </div>
            }
          </div>
        </div>

        <div class="footer">
          <button
            class="buy-button"
            [class.disabled]="!canPurchase(upgrade.id)"
            (click)="purchase(upgrade.id)"
          >
            Acheter
          </button>
        </div>
      </div>
      }
    </div>
  `,
})
export class UpgradeDisplayComponent implements OnInit, OnDestroy {
  upgrades: Upgrade[] = [];
  private subscription?: Subscription;

  constructor(private gameService: GameService) {}

  ngOnInit(): void {
    console.log('UpgradeDisplayComponent initialized');
    this.subscription = this.gameService.gameState$.subscribe(() => {
      console.log('Updating upgrades');
      this.upgrades = this.gameService.getAvailableUpgrades();
      console.log('Available upgrades:', this.upgrades);
    });
  }

  ngOnDestroy(): void {
    this.subscription?.unsubscribe();
  }

  getEffectIcon(type: UpgradeEffect['type']): string {
    const icons = {
      building_multiplier: 'fas fa-industry',
      base_production: 'fas fa-tachometer-alt',
      building_cost: 'fas fa-tags',
      global_multiplier: 'fas fa-star',
      tick_rate: 'fas fa-bolt',
      cost_reduction: 'fas fa-percentage',
      production_boost: 'fas fa-arrow-up',
      resource_multiplier: 'fas fa-cube',
    };
    return icons[type] || 'fas fa-cube';
  }

  formatEffectValue(effect: UpgradeEffect): string {
    const multiplier = effect.multiplier;
    switch (effect.type) {
      case 'building_multiplier':
        return `+${(multiplier - 1) * 100}% ${effect.target || 'production'}`;
      case 'base_production':
        return `+${(multiplier - 1) * 100}% production de base`;
      case 'building_cost':
        return `-${(1 - multiplier) * 100}% coût`;
      case 'global_multiplier':
        return `×${multiplier} production globale`;
      case 'tick_rate':
        return `-${(1 - multiplier) * 100}% vitesse`;
      case 'cost_reduction':
        return `-${(1 - multiplier) * 100}% coûts`;
      case 'production_boost':
        return `+${(multiplier - 1) * 100}% production`;
      case 'resource_multiplier':
        return `×${multiplier} ressources`;
      default:
        return `${multiplier}`;
    }
  }

  getRequirements(requirements: { [key: string]: number }): [string, number][] {
    return Object.entries(requirements);
  }

  getBuildingName(buildingId: string): string {
    const building = this.gameService.getBuildingDefinition(buildingId);
    return building?.name || buildingId;
  }

  isBuildingRequirementMet(buildingId: string, required: number): boolean {
    const current = this.gameService.getBuildingAmount(buildingId);
    return current >= required;
  }

  canPurchase(upgradeId: string): boolean {
    return this.gameService.canPurchaseUpgrade(upgradeId);
  }

  purchase(upgradeId: string): void {
    if (this.canPurchase(upgradeId)) {
      this.gameService.purchaseUpgrade(upgradeId);
    }
  }
}
