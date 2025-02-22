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
import { BUILDINGS } from '../../../../core/data/buildings.data';
import { SkillTreeComponent } from '../skill-tree/skill-tree.component';

@Component({
  selector: 'app-resource-display',
  standalone: true,
  imports: [CommonModule, NumberFormatPipe, SkillTreeComponent],
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
        <div class="stat-row">
          <div class="stat-value">
            <i class="fas fa-industry"></i>
            <span>+{{ productionPerTick | number : '1.1-1' }}/tick</span>
          </div>
        </div>

        <div class="stat-row">
          <div class="stat-value">
            <i class="fas fa-bolt"></i>
            <span>{{ tickRate / 1000 | number : '1.1-1' }}s</span>
            @if (tickRate <= 500) {
            <span class="boost max">MAX</span>
            } @else if (tickRate < 2000) {
            <span class="boost"
              >-{{ 100 - (tickRate / 2000) * 100 | number : '1.0-0' }}%</span
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

      @if (resources.temporalKnowledge > 0 ||
      hasBuildingUnlocked('temporal_echo_temple')) {
      <div class="stats-section temporal-knowledge">
        <div class="counter-section">
          <span class="amount">
            {{ resources.temporalKnowledge | number : '1.2-2' }}
            @if (resources.temporalKnowledge >= 5) {
            <span class="max-indicator">(Max)</span>
            }
          </span>
          <div class="label">
            <i class="fas fa-brain"></i>
            <span>Savoir Temporel</span>
          </div>
          @if (resources.temporalKnowledge < 5) {
          <div class="knowledge-progress">
            <div class="progress-track">
              <div
                class="progress-fill"
                [style.width.%]="getKnowledgeProgress()"
              >
                <div class="glow"></div>
              </div>
            </div>
            <div class="time-estimate">
              {{ getTimeToNextKnowledge() }}
            </div>
          </div>
          }
        </div>
      </div>
      } @if (hasTemporalInsight()) {
      <div class="stats-section temporal-insight">
        <div class="insight-grid">
          <div class="insight-item" title="Production par seconde">
            <i class="fas fa-chart-line"></i>
            <div class="insight-content">
              <div class="insight-label">Production</div>
              <div class="insight-value">
                {{ productionPerTick * (1000 / tickRate) | number : '1.1-1' }}/s
              </div>
            </div>
          </div>
          <div class="insight-item" title="Gain par minute">
            <i class="fas fa-arrow-trend-up"></i>
            <div class="insight-content">
              <div class="insight-label">Gain/min</div>
              <div class="insight-value">
                {{ getGainPerMinute() | number : '1.1-1' }}
              </div>
            </div>
          </div>

          @if (getActiveBoosts().length > 0) {
          <div class="insight-separator"></div>
          @for (boost of getActiveBoosts(); track boost.label) {
          <div class="insight-item" [title]="'Bonus actif: ' + boost.label">
            <i class="fas fa-star-half-alt"></i>
            <div class="insight-content">
              <div class="insight-label">{{ boost.label }}</div>
              <div class="insight-value">{{ boost.value }}</div>
            </div>
          </div>
          } }
        </div>
      </div>
      }

      <div
        class="prestige-points"
        [title]="
          'Vous avez ' +
          resources.prestigePoints +
          ' points de prestige non utilisés'
        "
        (click)="showSkillTree()"
        style="cursor: pointer;"
      >
        <i class="fas fa-star"></i>
        <span>{{ resources.prestigePoints | number : '1.0-0' }}</span>
      </div>
      @if (isSkillTreeVisible) {
      <app-skill-tree (closeModal)="hideSkillTree()" />
      }
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
        flex-direction: column;
        gap: 0.5rem;
        padding: 0.75rem;
        background: rgba(13, 17, 23, 0.4);
        border-radius: 6px;
        border: 1px solid rgba(79, 172, 254, 0.2);
      }

      .stat-row {
        display: flex;
        justify-content: center;
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
        height: 6px;
        background: rgba(13, 17, 23, 0.6);
        border-radius: 3px;
        overflow: hidden;
        position: relative;
        box-shadow: inset 0 0 10px rgba(0, 0, 0, 0.5);
        border: 1px solid rgba(79, 172, 254, 0.2);
      }

      .progress-fill {
        height: 100%;
        background: linear-gradient(
          90deg,
          #4facfe 0%,
          #00f2fe 50%,
          #4facfe 100%
        );
        position: relative;
        transition: width 0s linear;
        box-shadow: 0 0 15px rgba(79, 172, 254, 0.5);
      }

      .progress-fill::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: linear-gradient(
          90deg,
          transparent 0%,
          rgba(255, 255, 255, 0.2) 50%,
          transparent 100%
        );
        animation: shine 2s linear infinite;
      }

      .progress-fill::after {
        content: '';
        position: absolute;
        top: 0;
        right: 0;
        width: 20px;
        height: 100%;
        background: linear-gradient(
          90deg,
          transparent,
          rgba(79, 172, 254, 0.8)
        );
        filter: blur(3px);
      }

      @keyframes shine {
        0% {
          transform: translateX(-100%);
        }
        100% {
          transform: translateX(100%);
        }
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

      .tick-time {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        color: #4facfe;
        font-size: 0.9rem;
        text-shadow: 0 0 10px rgba(79, 172, 254, 0.3);
      }

      .tick-time i {
        color: #00f2fe;
        filter: drop-shadow(0 0 5px rgba(0, 242, 254, 0.5));
      }

      .boost {
        color: #00f2fe;
        font-size: 0.8em;
        padding: 0.2em 0.4em;
        background: rgba(0, 242, 254, 0.1);
        border-radius: 3px;
        border: 1px solid rgba(0, 242, 254, 0.2);
        box-shadow: 0 0 10px rgba(0, 242, 254, 0.2);
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

      .temporal-knowledge {
        margin-top: 1rem;
        background: rgba(147, 51, 234, 0.15);
        border: 1px solid rgba(147, 51, 234, 0.3);
        padding: 0.75rem;
        border-radius: 6px;
      }

      .temporal-knowledge .counter-section {
        text-align: center;
      }

      .temporal-knowledge .amount {
        font-size: 1.8rem;
        font-weight: 600;
        color: #9333ea;
        text-shadow: 0 0 15px rgba(147, 51, 234, 0.3);
        display: block;
        margin-bottom: 0.5rem;
      }

      .temporal-knowledge .label {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 0.5rem;
        color: #c084fc;
        font-size: 0.9rem;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }

      .temporal-knowledge i {
        color: #9333ea;
        font-size: 1rem;
        filter: drop-shadow(0 0 5px rgba(147, 51, 234, 0.5));
      }

      .temporal-knowledge .max-indicator {
        font-size: 0.9rem;
        color: #c084fc;
        margin-left: 0.5rem;
      }

      .knowledge-progress {
        width: 100%;
        margin-top: 0.75rem;
      }

      .knowledge-progress .progress-track {
        width: 100%;
        height: 4px;
        background: rgba(147, 51, 234, 0.2);
        border-radius: 2px;
        overflow: hidden;
        position: relative;
      }

      .knowledge-progress .progress-fill {
        height: 100%;
        background: #9333ea;
        position: relative;
        transition: width 0.2s ease;
      }

      .knowledge-progress .glow {
        position: absolute;
        top: 0;
        right: 0;
        height: 100%;
        width: 10px;
        background: linear-gradient(
          90deg,
          transparent,
          rgba(255, 255, 255, 0.3)
        );
        filter: blur(2px);
      }

      .time-estimate {
        font-size: 0.8rem;
        color: #c084fc;
        text-align: center;
        margin-top: 0.25rem;
        opacity: 0.8;
      }

      .prestige-points {
        position: absolute;
        top: 0.5rem;
        right: 0.5rem;
        display: flex;
        align-items: center;
        gap: 0.4rem;
        font-size: 0.9rem;
        color: #4ade80;
        text-shadow: 0 0 10px rgba(74, 222, 128, 0.5);
        font-family: 'Exo 2', sans-serif;
        letter-spacing: 0.5px;
        padding: 0.3rem 0.6rem;
        background: rgba(74, 222, 128, 0.1);
        border: 1px solid rgba(74, 222, 128, 0.2);
        border-radius: 4px;
        cursor: help;
      }

      .prestige-points i {
        font-size: 0.8rem;
        color: #4ade80;
        filter: drop-shadow(0 0 5px rgba(74, 222, 128, 0.5));
      }

      .temporal-insight {
        background: rgba(13, 17, 23, 0.8) !important;
        border: 1px solid rgba(255, 215, 0, 0.2) !important;
        padding: 0.4rem !important;
        margin: 0;
      }

      .insight-grid {
        display: flex;
        flex-direction: column;
        gap: 0.25rem;
        width: 100%;
      }

      .insight-item {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        font-size: 0.75rem;
        color: #ffd700;
        background: rgba(255, 215, 0, 0.05);
        padding: 0.25rem 0.5rem;
        border-radius: 3px;
        border: 1px solid rgba(255, 215, 0, 0.1);
      }

      .insight-item i {
        font-size: 0.7rem;
        opacity: 0.7;
        color: #ffd700;
        width: 12px;
      }

      .insight-content {
        display: flex;
        justify-content: space-between;
        align-items: center;
        flex: 1;
      }

      .insight-label {
        font-size: 0.75rem;
        opacity: 0.8;
        color: #ffd700;
      }

      .insight-value {
        font-size: 0.75rem;
        color: #ffd700;
        font-family: 'Exo 2', sans-serif;
        letter-spacing: 0.2px;
      }

      .insight-separator {
        height: 1px;
        background: rgba(255, 215, 0, 0.1);
        margin: 0.25rem 0;
      }

      .insight-item i.fa-star-half-alt {
        color: #ffd700;
        opacity: 0.9;
      }

      .boost.max {
        color: #ff4e4e;
        background: rgba(255, 78, 78, 0.1);
        border: 1px solid rgba(255, 78, 78, 0.2);
        box-shadow: 0 0 10px rgba(255, 78, 78, 0.2);
      }

      @media (max-width: 1024px) {
        .resource-panel {
          padding: 1rem;
          gap: 1rem;
        }

        .amount {
          font-size: 2rem;
        }
      }

      @media (max-width: 768px) {
        .resource-panel {
          padding: 0.75rem;
          gap: 0.75rem;
        }

        .counter-section {
          padding: 0.25rem;
        }

        .amount {
          font-size: 1.75rem;
          margin-bottom: 0.25rem;
        }

        .label {
          font-size: 0.8rem;
        }

        .stats-section {
          flex-direction: row;
          justify-content: space-around;
        }
      }

      @media (max-width: 480px) {
        .resource-panel {
          padding: 0.5rem;
          gap: 0.5rem;
        }

        .amount {
          font-size: 1.5rem;
        }

        .label {
          font-size: 0.75rem;
        }

        .stats-section {
          flex-wrap: wrap;
        }

        .stat-row {
          width: 100%;
        }
      }
    `,
  ],
})
export class ResourceDisplayComponent implements OnInit, OnDestroy {
  resources: GameState['resources'] = {
    timeFragments: 0,
    temporalKnowledge: 0,
    prestigePoints: 0,
  };
  productionPerSecond = 0;
  productionPerTick = 0;
  tickRate = 0;
  tickProgress = 0;
  private subscription?: Subscription;
  private lastTick = Date.now();
  private animationFrame?: number;
  private tickRateSubscription?: Subscription;
  isSkillTreeVisible = false;

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

  hasBuildingUnlocked(buildingId: string): boolean {
    return (
      this.gameService.getBuildingDefinition(buildingId)?.unlocked || false
    );
  }

  getTemporalKnowledgePerTick(): number {
    const temple = BUILDINGS['temporal_echo_temple'];
    const templeLevel = this.gameService.getBuildingAmount(
      'temporal_echo_temple'
    );
    if (!temple || !templeLevel) return 0;

    const effects = this.gameService.getCurrentEffects();
    const currentKnowledge = Math.floor(this.resources.temporalKnowledge);
    const multiplier = Math.pow(5, currentKnowledge);

    return (
      (temple.baseProduction * templeLevel * effects.knowledgeGainMultiplier) /
      multiplier
    );
  }

  getKnowledgeProgress(): number {
    const currentKnowledge = this.resources.temporalKnowledge;
    const currentLevel = Math.floor(currentKnowledge);
    const progress = currentKnowledge - currentLevel;
    return progress * 100;
  }

  getTimeToNextKnowledge(): string {
    const currentKnowledge = this.resources.temporalKnowledge;
    const currentLevel = Math.floor(currentKnowledge);
    const progress = currentKnowledge - currentLevel;

    // Calculer le temps restant
    const temple = BUILDINGS['temporal_echo_temple'];
    const templeLevel = this.gameService.getBuildingAmount(
      'temporal_echo_temple'
    );
    if (!temple || !templeLevel) return '';

    const multiplier = Math.pow(5, currentLevel);
    const productionPerSecond =
      (temple.baseProduction * templeLevel) / multiplier;
    const remainingProgress = 1 - progress;
    const secondsRemaining = remainingProgress / productionPerSecond;

    // Formater le temps de manière simplifiée
    if (secondsRemaining > 3600) {
      return `${Math.ceil(secondsRemaining / 3600)}h`;
    } else if (secondsRemaining > 60) {
      return `${Math.ceil(secondsRemaining / 60)}m`;
    } else {
      return `${Math.ceil(secondsRemaining)}s`;
    }
  }

  showSkillTree(): void {
    this.isSkillTreeVisible = true;
  }

  hideSkillTree(): void {
    this.isSkillTreeVisible = false;
  }

  hasTemporalInsight(): boolean {
    const state = this.gameService.getGameState();
    return state.skills['temporal_insight']?.purchased ?? false;
  }

  getOptimalProduction(): number {
    const currentProduction = this.productionPerTick * (1000 / this.tickRate);
    const effects = this.gameService.getCurrentEffects();
    const maxProduction =
      currentProduction * (1 + effects.globalProductionBoost);
    return maxProduction;
  }

  getOptimalCycleTime(): string {
    const currentKnowledge = this.resources.temporalKnowledge;
    if (currentKnowledge >= 5) {
      return 'Prêt pour le cycle';
    }

    const remainingKnowledge = 5 - currentKnowledge;
    const knowledgePerSecond =
      this.getTemporalKnowledgePerTick() * (1000 / this.tickRate);
    if (knowledgePerSecond <= 0) {
      return 'Temple requis';
    }

    const secondsRemaining = remainingKnowledge / knowledgePerSecond;
    const minutes = Math.floor(secondsRemaining / 60);
    const seconds = Math.floor(secondsRemaining % 60);
    return `${minutes}m ${seconds}s`;
  }

  getEfficiencyPercentage(): number {
    const effects = this.gameService.getCurrentEffects();
    const maxEfficiency =
      effects.globalProductionBoost + effects.knowledgeGainMultiplier;
    const currentEfficiency =
      (this.productionPerTick * (1000 / this.tickRate)) /
      this.getOptimalProduction();
    return Math.round(currentEfficiency * 100);
  }

  getTimeToNextBuilding(): string {
    const buildings = this.gameService.getAllBuildings();
    let cheapestCost = Infinity;
    let cheapestBuilding = null;

    for (const building of buildings) {
      const cost = this.gameService.getBuildingCost(building.id);
      if (cost > this.resources.timeFragments && cost < cheapestCost) {
        cheapestCost = cost;
        cheapestBuilding = building;
      }
    }

    if (!cheapestBuilding) return 'Tous débloqués';

    const missingFragments = cheapestCost - this.resources.timeFragments;
    const productionPerSecond = this.productionPerTick * (1000 / this.tickRate);
    if (productionPerSecond <= 0) return '∞';

    const seconds = Math.ceil(missingFragments / productionPerSecond);
    if (seconds > 3600) {
      return `${Math.floor(seconds / 3600)}h${Math.floor(
        (seconds % 3600) / 60
      )}m`;
    } else if (seconds > 60) {
      return `${Math.floor(seconds / 60)}m${seconds % 60}s`;
    }
    return `${seconds}s`;
  }

  getEstimatedPrestigePoints(): number {
    const effects = this.gameService.getCurrentEffects();
    return Math.ceil(
      this.resources.temporalKnowledge * effects.prestigeGainMultiplier
    );
  }

  getGainPerMinute(): number {
    const productionPerSecond = this.productionPerTick * (1000 / this.tickRate);
    return productionPerSecond * 60;
  }

  getActiveBoosts(): { label: string; value: string }[] {
    const effects = this.gameService.getCurrentEffects();
    const boosts: { label: string; value: string }[] = [];

    // Vérifier et ajouter les différents boosts
    if (effects.tickRateMultiplier < 1) {
      boosts.push({
        label: 'Réduction tick',
        value: `-${((1 - effects.tickRateMultiplier) * 100).toFixed(1)}%`,
      });
    }

    if (effects.resourceMultiplier > 1) {
      boosts.push({
        label: 'Multiplicateur',
        value: `×${effects.resourceMultiplier.toFixed(1)}`,
      });
    }

    // Ajouter les bonus spécifiques aux bâtiments
    Object.entries(effects.buildingMultipliers).forEach(
      ([buildingId, multiplier]) => {
        if (multiplier > 1) {
          const building = BUILDINGS[buildingId];
          boosts.push({
            label: `Bonus ${building.name}`,
            value: `×${multiplier.toFixed(1)}`,
          });
        }
      }
    );

    // Ajouter les bonus économiques
    if (effects.globalCostReduction < 1) {
      boosts.push({
        label: 'Réduction coûts',
        value: `-${((1 - effects.globalCostReduction) * 100).toFixed(1)}%`,
      });
    }

    return boosts;
  }
}
