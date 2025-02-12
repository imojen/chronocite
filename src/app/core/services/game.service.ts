import { Injectable, OnDestroy } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { GameState } from '../models/game-state.model';
import { Building } from '../models/building.model';
import { BUILDINGS } from '../data/buildings.data';
import { Upgrade } from '../models/upgrade.model';
import { NotificationService } from '../services/notification.service';
import { map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class GameService implements OnDestroy {
  private readonly TICK_RATE = 2000;
  private readonly BASE_PRODUCTION = 0;
  private readonly COST_INCREASE_RATE = 1.12;
  private readonly SAVE_INTERVAL = 60000;
  private readonly SAVE_KEY = 'chronocity_save';
  private readonly MAX_TEMPORAL_KNOWLEDGE = 5; // Maximum de savoir par cycle

  private gameStateSubject = new BehaviorSubject<GameState>({
    resources: {
      timeFragments: 100,
      temporalKnowledge: 0,
      prestigePoints: 0,
    },
    buildings: {
      generator: 1,
    },
    upgrades: {},
    skills: {},
    multipliers: {
      global: 1,
      buildings: {},
      costs: 1,
      tickRate: 1,
    },
    unlockedBuildings: {
      generator: true,
    },
    stats: {
      upgradesPurchased: 0,
      cyclesCompleted: 0,
      totalTemporalKnowledge: 0,
      totalPrestigePoints: 0,
    },
    lastUpdate: Date.now(),
    totalPlayTime: 0,
    totalProduction: 0,
  });

  gameState$ = this.gameStateSubject.asObservable();

  private tickRateSubject = new BehaviorSubject<number>(this.TICK_RATE);
  readonly tickRate$ = this.tickRateSubject.asObservable();

  private gameLoop?: number;

  private lastTimeJump = 0;

  constructor(private notificationService: NotificationService) {
    // Charger le jeu après l'initialisation complète
    const savedState = this.loadGame();
    this.gameStateSubject.next(savedState);

    // Mettre à jour le tick rate après le chargement
    this.tickRateSubject.next(this.getCurrentTickRate());

    this.startGameLoop();
    this.startAutoSave();
    this.setupBeforeUnloadHandler();
  }

  private setupBeforeUnloadHandler(): void {
    window.addEventListener('beforeunload', () => {
      this.saveGame();
    });
  }

  ngOnDestroy(): void {
    this.stopGameLoop();
    window.removeEventListener('beforeunload', () => {
      this.saveGame();
    });
  }

  // Méthodes de sauvegarde
  saveGame(): void {
    const state = this.gameStateSubject.value;
    try {
      localStorage.setItem(this.SAVE_KEY, JSON.stringify(state));
      this.notificationService.show('Jeu sauvegardé', 'success');
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
      this.notificationService.show(
        'Erreur lors de la sauvegarde du jeu',
        'error'
      );
    }
  }

  private loadGame(): GameState {
    try {
      const savedState = localStorage.getItem(this.SAVE_KEY);
      if (!savedState) return this.gameStateSubject.value;

      const parsedState = JSON.parse(savedState);
      parsedState.lastUpdate = Date.now();

      // Charger l'état de déverrouillage des bâtiments
      this.loadUnlockedBuildings(parsedState);

      return parsedState;
    } catch (error) {
      console.error('Erreur lors du chargement:', error);
      return this.gameStateSubject.value;
    }
  }

  private startAutoSave(): void {
    setInterval(() => this.saveGame(), this.SAVE_INTERVAL);
  }

  // Méthode publique pour réinitialiser le jeu
  resetGame(): void {
    // Réinitialiser l'état des bâtiments dans BUILDINGS
    Object.keys(BUILDINGS).forEach((buildingId) => {
      BUILDINGS[buildingId] = {
        ...BUILDINGS[buildingId],
        unlocked: buildingId === 'generator', // Seul le générateur reste débloqué
      };
    });

    localStorage.removeItem(this.SAVE_KEY);
    this.gameStateSubject.next({
      resources: {
        timeFragments: 0,
        temporalKnowledge: 0,
        prestigePoints: 0,
      },
      buildings: {},
      upgrades: {},
      skills: {},
      multipliers: {
        global: 1,
        buildings: {},
        costs: 1,
        tickRate: 1,
      },
      unlockedBuildings: {},
      stats: {
        upgradesPurchased: 0,
        cyclesCompleted: 0,
        totalTemporalKnowledge: 0,
        totalPrestigePoints: 0,
      },
      lastUpdate: Date.now(),
      totalPlayTime: 0,
      totalProduction: 0,
    });
  }

  // Méthodes publiques pour les bâtiments
  getAllBuildings(): Building[] {
    return Object.values(BUILDINGS)
      .filter((building) => this.canBuildingBeUpgraded(building.id))
      .map((building) => ({
        ...building,
        amount: this.getBuildingAmount(building.id),
      }));
  }

  getBuildingCost(buildingId: string, additionalPurchases = 0): number {
    const building = BUILDINGS[buildingId];
    if (!building) return Infinity;

    const currentAmount =
      this.gameStateSubject.value.buildings[buildingId] || 0;
    const effects = this.calculateEffects(this.gameStateSubject.value);

    // Calculer le coût avec l'augmentation progressive
    // La réduction de progression des coûts s'applique au taux d'augmentation au-dessus de 1
    const baseRate = this.COST_INCREASE_RATE - 1; // 0.12
    const reducedRate = baseRate * (1 - effects.costProgressionReduction); // Réduire seulement la partie au-dessus de 1
    const costProgressionRate = 1 + reducedRate; // Réajouter 1 pour avoir le taux final

    const cost =
      building.baseCost *
      Math.pow(costProgressionRate, currentAmount + additionalPurchases);

    // Appliquer la réduction de coût globale
    return Math.floor(cost * effects.globalCostReduction);
  }

  canPurchaseBuilding(buildingId: string): boolean {
    const building = BUILDINGS[buildingId];
    if (!building || !building.unlocked) return false;

    const state = this.gameStateSubject.value;
    const cost = this.getBuildingCost(buildingId);
    return state.resources.timeFragments >= cost;
  }

  purchaseBuilding(buildingId: string): boolean {
    const state = { ...this.gameStateSubject.value };
    const cost = this.getBuildingCost(buildingId);

    if (
      state.resources.timeFragments < cost ||
      !this.canBuildingBeUpgraded(buildingId)
    )
      return false;

    // Mettre à jour les ressources et les bâtiments
    state.resources.timeFragments -= cost;
    state.buildings[buildingId] = (state.buildings[buildingId] || 0) + 1;

    this.gameStateSubject.next(state);

    // Forcer la mise à jour de la production
    this.startGameLoop();

    return true;
  }

  getBuildingAmount(buildingId: string): number {
    return this.gameStateSubject.value.buildings[buildingId] || 0;
  }

  // Nouvelles méthodes pour les améliorations
  getAvailableUpgrades(): Upgrade[] {
    const state = this.gameStateSubject.value;
    const definitions = this.getUpgradeDefinitions();

    return Object.entries(definitions)
      .filter(([id]) => !this.isUpgradePurchased(id))
      .map(([id, upgrade]) => ({
        ...upgrade,
        id,
        canPurchase: this.canPurchaseUpgrade(id),
      }));
  }

  canPurchaseUpgrade(upgradeId: string): boolean {
    const upgrade = this.getUpgradeDefinitions()[upgradeId];
    if (!upgrade || this.isUpgradePurchased(upgradeId)) return false;

    // Vérifier si on a assez de fragments de temps
    if (this.gameStateSubject.value.resources.timeFragments < upgrade.cost) {
      return false;
    }

    // Vérifier les prérequis de bâtiments
    if (upgrade.requirements?.buildings) {
      for (const [buildingId, requiredAmount] of Object.entries(
        upgrade.requirements.buildings
      )) {
        const currentAmount = this.getBuildingAmount(buildingId);
        if (currentAmount < requiredAmount) return false;
      }
    }

    // Vérifier les prérequis d'améliorations
    if (upgrade.requirements?.upgrades) {
      for (const [upgradeId, required] of Object.entries(
        upgrade.requirements.upgrades
      )) {
        if (required && !this.isUpgradePurchased(upgradeId)) return false;
      }
    }

    return true;
  }

  purchaseUpgrade(upgradeId: string): void {
    if (!this.canPurchaseUpgrade(upgradeId)) return;

    const upgrade = this.getUpgradeDefinitions()[upgradeId];
    const currentState = { ...this.gameStateSubject.value };

    // Déduire le coût
    currentState.resources.timeFragments -= upgrade.cost;

    // Marquer l'amélioration comme achetée
    currentState.upgrades[upgradeId] = true;

    this.updateState(currentState);
    this.notificationService.show(
      `Amélioration achetée : ${upgrade.name}`,
      'success'
    );
  }

  // Méthodes privées après les méthodes publiques
  private startGameLoop(): void {
    this.stopGameLoop();
    const effects = this.calculateEffects(this.gameStateSubject.value);
    const adjustedTickRate = Math.max(
      500,
      this.TICK_RATE * effects.tickRateMultiplier
    );
    this.gameLoop = window.setInterval(() => this.update(), adjustedTickRate);
  }

  private stopGameLoop(): void {
    if (this.gameLoop) {
      clearInterval(this.gameLoop);
      this.gameLoop = undefined;
    }
  }

  private update(): void {
    const currentState = { ...this.gameStateSubject.value };
    const now = Date.now();
    const delta = (now - currentState.lastUpdate) / this.getCurrentTickRate(); // Convertir en nombre de ticks
    const effects = this.calculateEffects(currentState);

    currentState.totalPlayTime += (now - currentState.lastUpdate) / 1000; // Garder le temps total en secondes
    currentState.lastUpdate = now;

    // Production de fragments de temps
    const fragmentsProduction = this.calculateProduction(currentState);
    const fragments = fragmentsProduction * delta; // Production par tick * nombre de ticks
    currentState.resources.timeFragments += fragments;
    currentState.totalProduction += fragments;

    // Production de savoir temporel avec progression exponentielle
    const templeLevel = currentState.buildings['temporal_echo_temple'] || 0;
    if (
      templeLevel > 0 &&
      currentState.resources.temporalKnowledge < this.MAX_TEMPORAL_KNOWLEDGE
    ) {
      const temple = BUILDINGS['temporal_echo_temple'];
      const currentKnowledge = Math.floor(
        currentState.resources.temporalKnowledge
      );
      const multiplier = Math.pow(5, currentKnowledge); // Chaque point est 5x plus long
      const knowledgeProduction =
        (temple.baseProduction *
          templeLevel *
          effects.knowledgeGainMultiplier) /
        multiplier;

      // Vérifier si on ne dépasse pas la limite
      const newKnowledge =
        currentState.resources.temporalKnowledge + knowledgeProduction * delta;
      currentState.resources.temporalKnowledge = Math.min(
        newKnowledge,
        this.MAX_TEMPORAL_KNOWLEDGE
      );
    }

    this.updateState(currentState);
  }

  private calculateProduction(state: GameState): number {
    let totalProduction = 0;

    // Calculer la production de chaque bâtiment
    Object.keys(state.buildings).forEach((buildingId) => {
      totalProduction += this.calculateBuildingProduction(buildingId, state);
    });

    // Garantir une production minimale de 0.5 par tick
    return Math.max(0.5, totalProduction);
  }

  private updateState(newState: GameState): void {
    this.gameStateSubject.next(newState);
  }

  private readonly UPGRADE_DEFINITIONS: { [key: string]: Upgrade } = {
    accelerator_boost: {
      id: 'accelerator_boost',
      name: 'Boost des Accélérateurs',
      description: 'Triple la production des accélérateurs',
      cost: 250,
      unlocked: false,
      purchased: false,
      effect: {
        type: 'building_multiplier',
        target: 'accelerator',
        multiplier: 3,
      },
      requirements: {
        buildings: {
          accelerator: 5,
        },
        upgrades: {},
      },
    },
    synergy: {
      id: 'synergy',
      name: 'Synergie Temporelle',
      description: 'Augmente la production de base de 50%',
      cost: 500,
      unlocked: false,
      purchased: false,
      effect: {
        type: 'base_production',
        multiplier: 1.5,
      },
      requirements: {
        buildings: {
          generator: 15,
          accelerator: 10,
        },
        upgrades: {},
      },
    },
    advanced_generators: {
      id: 'advanced_generators',
      name: 'Générateurs Avancés',
      description: 'Triple la production des générateurs temporels',
      cost: 1000,
      unlocked: false,
      purchased: false,
      effect: {
        type: 'building_multiplier',
        target: 'generator',
        multiplier: 3,
      },
      requirements: {
        buildings: {
          generator: 20,
        },
        upgrades: {
          better_generators: true,
        },
      },
    },
    accelerator_efficiency: {
      id: 'accelerator_efficiency',
      name: 'Efficacité des Accélérateurs',
      description: 'Réduit le coût des accélérateurs de 10%',
      cost: 750,
      unlocked: false,
      purchased: false,
      effect: {
        type: 'building_cost',
        target: 'accelerator',
        multiplier: 0.9,
      },
      requirements: {
        buildings: {
          accelerator: 8,
        },
      },
    },
    temporal_mastery: {
      id: 'temporal_mastery',
      name: 'Maîtrise Temporelle',
      description: 'Augmente toute la production de 25%',
      cost: 2000,
      unlocked: false,
      purchased: false,
      effect: {
        type: 'global_multiplier',
        multiplier: 1.25,
      },
      requirements: {
        buildings: {
          generator: 25,
          accelerator: 15,
        },
        upgrades: {
          better_generators: true,
          accelerator_boost: true,
        },
      },
    },
    temporal_efficiency: {
      id: 'temporal_efficiency',
      name: 'Efficacité Temporelle',
      description:
        'Augmente la production de base de 100% quand le tick rate est minimal',
      cost: 5000,
      unlocked: false,
      purchased: false,
      effect: {
        type: 'base_production',
        multiplier: 2,
      },
      requirements: {
        buildings: {
          time_compressor: 25,
        },
      },
    },
    quantum_synchronization: {
      id: 'quantum_synchronization',
      name: 'Synchronisation Quantique',
      description:
        'Double la production de tous les bâtiments quand le tick rate est minimal',
      cost: 10000,
      unlocked: false,
      purchased: false,
      effect: {
        type: 'global_multiplier',
        multiplier: 2,
      },
      requirements: {
        buildings: {
          time_compressor: 25,
          quantum_amplifier: 10,
        },
        upgrades: {
          temporal_efficiency: true,
        },
      },
    },
    temporal_mastery_2: {
      id: 'temporal_mastery_2',
      name: 'Maîtrise Temporelle II',
      description: 'Triple la production de tous les bâtiments',
      cost: 25000,
      unlocked: false,
      purchased: false,
      effect: {
        type: 'global_multiplier',
        multiplier: 3,
      },
      requirements: {
        buildings: {
          time_compressor: 25,
          generator: 50,
          accelerator: 30,
        },
        upgrades: {
          temporal_mastery: true,
          quantum_synchronization: true,
        },
      },
    },
  } as const;

  private getUpgradeDefinitions(): { [key: string]: Upgrade } {
    // Créer une copie mutable des définitions
    const definitions: { [key: string]: Upgrade } = {};
    Object.entries(this.UPGRADE_DEFINITIONS).forEach(([key, value]) => {
      definitions[key] = value as Upgrade;
    });
    return definitions;
  }

  // Nouvelles méthodes publiques pour accéder aux informations de production
  getTickRate(): number {
    return this.TICK_RATE;
  }

  getCurrentProduction(): number {
    const state = this.gameStateSubject.value;
    let totalProduction = 0;

    // Calculer la production de chaque bâtiment
    Object.keys(state.buildings).forEach((buildingId) => {
      totalProduction += this.calculateBuildingProduction(buildingId, state);
    });

    // Garantir une production minimale de 0.5 par tick
    return Math.max(0.5, totalProduction);
  }

  getProductionPerTick(): number {
    // Utiliser la même méthode que getCurrentProduction pour la cohérence
    return this.getCurrentProduction();
  }

  getLastUpdate(): number {
    return this.gameStateSubject.value.lastUpdate;
  }

  private calculateEffects(state: GameState) {
    let effects = {
      globalProductionBoost: 1,
      globalCostReduction: 1,
      tickRateMultiplier: 1,
      resourceMultiplier: 1,
      knowledgeGainMultiplier: 1,
      prestigeGainMultiplier: 1,
      costProgressionReduction: 0,
      buildingMultipliers: {} as { [key: string]: number },
    };

    // Appliquer les effets des bâtiments
    Object.entries(state.buildings).forEach(([buildingId, amount]) => {
      const building = BUILDINGS[buildingId];
      if (building?.effect) {
        switch (building.effect.type) {
          case 'tick_rate':
            effects.tickRateMultiplier *= Math.pow(
              building.effect.value ?? 1,
              amount
            );
            break;
          case 'cost_reduction':
            // Limite la réduction des coûts à 75% maximum
            effects.globalCostReduction = Math.max(
              0.25,
              effects.globalCostReduction *
                Math.pow(building.effect.value ?? 1, amount)
            );
            break;
          case 'production_boost':
            if (building.effect.target) {
              // Pour les bonus ciblés, on utilise une progression logarithmique
              // Cela donne une croissance plus rapide au début qui ralentit progressivement
              const targetBoost =
                Math.log10(amount + 1) *
                (building.effect.value ? (building.effect.value - 1) * 10 : 1);
              effects.buildingMultipliers[building.effect.target] =
                (effects.buildingMultipliers[building.effect.target] || 1) *
                (1 + targetBoost);
            } else {
              // Pour les bonus globaux, on utilise aussi une progression logarithmique
              // mais avec une limite plus basse pour éviter les bonus trop puissants
              const baseBoost = building.effect.value
                ? (building.effect.value - 1) * 5
                : 0.15;
              const globalBoost = Math.log10(amount + 1) * baseBoost;
              // On limite à x3 (300%) par bâtiment pour le bonus global
              const limitedBoost = Math.min(3, 1 + globalBoost);
              effects.globalProductionBoost *= limitedBoost;
            }
            break;
          case 'resource_multiplier':
            // Limite le multiplicateur de ressources à x10 maximum
            effects.resourceMultiplier = Math.min(
              10,
              effects.resourceMultiplier *
                Math.pow(building.effect.value ?? 1, amount)
            );
            break;
        }
      }
    });

    // Appliquer les effets des compétences
    if (state.skills) {
      // Maîtrise Temporelle : +25% production globale
      if (state.skills['temporal_mastery']?.purchased) {
        effects.globalProductionBoost *= 1.25;
      }

      // Expertise des Générateurs : +100% production des générateurs
      if (state.skills['generator_expertise']?.purchased) {
        effects.buildingMultipliers['generator'] =
          (effects.buildingMultipliers['generator'] || 1) * 2;
      }

      // Maîtrise des Accélérateurs : +100% production des accélérateurs
      if (state.skills['accelerator_mastery']?.purchased) {
        effects.buildingMultipliers['accelerator'] =
          (effects.buildingMultipliers['accelerator'] || 1) * 2;
      }

      // Efficacité Quantique : +50% production des compresseurs
      if (state.skills['quantum_efficiency']?.purchased) {
        effects.buildingMultipliers['time_compressor'] =
          (effects.buildingMultipliers['time_compressor'] || 1) * 1.5;
      }

      // Réduction des Coûts : -20% sur le coût des bâtiments
      if (state.skills['cost_reduction']?.purchased) {
        effects.globalCostReduction *= 0.8;
      }

      // Construction Efficace : -15% sur la progression des coûts
      if (state.skills['efficient_construction']?.purchased) {
        effects.costProgressionReduction = 0.15;
      }

      // Maîtrise du Savoir : +50% gain de savoir temporel
      if (state.skills['knowledge_mastery']?.purchased) {
        effects.knowledgeGainMultiplier *= 1.5;
      }

      // Optimisation des Cycles : +25% points de prestige
      if (state.skills['cycle_optimization']?.purchased) {
        effects.prestigeGainMultiplier *= 1.25;
      }

      // Maîtrise Économique : +10% production par niveau de réduction de coût
      if (state.skills['economic_mastery']?.purchased) {
        const costReductionSkills = [
          'cost_reduction',
          'efficient_construction',
        ];
        const costReductionLevel = Object.entries(state.skills).filter(
          ([id, skill]) => skill.purchased && costReductionSkills.includes(id)
        ).length;
        effects.globalProductionBoost *= 1 + 0.1 * costReductionLevel;
      }
    }

    return effects;
  }

  // Ajouter une méthode pour obtenir le tick rate actuel
  getCurrentTickRate(): number {
    const effects = this.calculateEffects(this.gameStateSubject.value);
    return Math.max(500, this.TICK_RATE * effects.tickRateMultiplier);
  }

  // Modifier la méthode pour vérifier si un bâtiment peut être amélioré
  canBuildingBeUpgraded(buildingId: string): boolean {
    const building = BUILDINGS[buildingId];
    if (!building) return false;

    // Vérifier si le niveau maximum est atteint
    const currentLevel = this.gameStateSubject.value.buildings[buildingId] || 0;
    if (building.maxLevel && currentLevel >= building.maxLevel) {
      return false;
    }

    // Si c'est un compresseur temporel, vérifier si la limite est atteinte
    if (building.effect?.type === 'tick_rate') {
      const effects = this.calculateEffects(this.gameStateSubject.value);
      const currentTickRate = this.TICK_RATE * effects.tickRateMultiplier;
      // Empêcher l'achat si le tick rate est <= 500ms (0.5 seconde)
      return currentTickRate > 500;
    }

    return true;
  }

  getCurrentEffects() {
    return this.calculateEffects(this.gameStateSubject.value);
  }

  private isUpgradePurchased(upgradeId: string): boolean {
    return !!this.gameStateSubject.value.upgrades[upgradeId];
  }

  getBuildingDefinition(buildingId: string): Building {
    return BUILDINGS[buildingId];
  }

  getResources$() {
    return this.gameState$.pipe(map((state) => state.resources));
  }

  getAllBuildings$() {
    return this.gameState$.pipe(
      map((state) => {
        const availableBuildings = Object.values(BUILDINGS).filter(
          (building) => {
            if (building.id === 'generator') return true;
            if (building.requiredBuilding) {
              const requiredBuilding = BUILDINGS[building.requiredBuilding];
              return requiredBuilding.unlocked;
            }
            return true;
          }
        );

        return availableBuildings.map((building) => ({
          ...building,
          amount: state.buildings[building.id] || 0,
          production: this.calculateBuildingProduction(building.id, state),
          unlocked: building.unlocked,
        }));
      })
    );
  }

  private calculateBuildingProduction(
    buildingId: string,
    state: GameState
  ): number {
    const building = BUILDINGS[buildingId];
    const amount = state.buildings[buildingId] || 0;
    const effects = this.calculateEffects(state);

    // Production de base du bâtiment
    let production = building.baseProduction * amount;

    // Appliquer le multiplicateur global de production
    production *= effects.globalProductionBoost;

    // Appliquer le multiplicateur spécifique au bâtiment
    if (effects.buildingMultipliers[buildingId]) {
      production *= effects.buildingMultipliers[buildingId];
    }

    // Appliquer le multiplicateur de ressources
    production *= effects.resourceMultiplier;

    // Garantir une production minimale de 0.5 par tick si c'est le seul bâtiment
    if (
      Object.keys(state.buildings).length === 1 &&
      buildingId === 'generator'
    ) {
      production = Math.max(0.5, production);
    }

    return production;
  }

  getTotalPlayTime(): number {
    return (
      this.gameStateSubject.value.totalPlayTime +
      (Date.now() - this.gameStateSubject.value.lastUpdate)
    );
  }

  purchaseMaxBuilding(buildingId: string): void {
    let currentState = { ...this.gameStateSubject.value };
    if (!this.canBuildingBeUpgraded(buildingId)) return;

    let resources = currentState.resources.timeFragments;
    let purchased = 0;

    while (true) {
      const cost = this.getBuildingCost(buildingId);
      if (resources < cost || !this.canBuildingBeUpgraded(buildingId)) break;

      resources -= cost;
      purchased++;
      currentState.buildings[buildingId] =
        (currentState.buildings[buildingId] || 0) + 1;
    }

    if (purchased > 0) {
      currentState.resources.timeFragments = resources;
      this.updateState(currentState);

      const building = BUILDINGS[buildingId];
      this.notificationService.show(
        `${purchased} ${building.name}${purchased > 1 ? 's' : ''} acheté${
          purchased > 1 ? 's' : ''
        }`,
        'success'
      );

      // Redémarrer le game loop si le bâtiment affecte le tick rate
      if (building?.effect?.type === 'tick_rate') {
        this.startGameLoop();
      }
    }
  }

  canUnlockBuilding(buildingId: string): boolean {
    const building = BUILDINGS[buildingId];
    if (!building || building.unlocked) return false;

    // Vérifier si le bâtiment requis est débloqué et possédé
    if (building.requiredBuilding) {
      const requiredBuilding = BUILDINGS[building.requiredBuilding];
      if (
        !requiredBuilding.unlocked ||
        !this.gameStateSubject.value.buildings[building.requiredBuilding]
      ) {
        return false;
      }
    }

    return (
      this.gameStateSubject.value.resources.timeFragments >=
      (building.unlockCost || 0)
    );
  }

  unlockBuilding(buildingId: string): boolean {
    const state = { ...this.gameStateSubject.value };
    const building = BUILDINGS[buildingId];

    if (!building || building.unlocked || !this.canUnlockBuilding(buildingId)) {
      return false;
    }

    // Déduire le coût de déverrouillage
    state.resources.timeFragments -= building.unlockCost || 0;

    // Créer une copie du bâtiment avec l'état déverrouillé
    BUILDINGS[buildingId] = {
      ...building,
      unlocked: true,
    };

    // Ajouter l'état de déverrouillage dans le gameState
    if (!state.unlockedBuildings) {
      state.unlockedBuildings = {};
    }
    state.unlockedBuildings[buildingId] = true;

    // Mettre à jour l'état global
    this.gameStateSubject.next({
      ...state,
      buildings: {
        ...state.buildings,
        [buildingId]: 0, // Initialiser le compteur du bâtiment
      },
    });

    // Sauvegarder immédiatement après le déverrouillage
    this.saveGame();

    this.notificationService.show(`${building.name} débloqué !`, 'success');
    return true;
  }

  // Ajouter une méthode pour charger l'état de déverrouillage au démarrage
  private loadUnlockedBuildings(state: GameState): void {
    if (state.unlockedBuildings) {
      Object.keys(state.unlockedBuildings).forEach((buildingId) => {
        if (BUILDINGS[buildingId]) {
          BUILDINGS[buildingId] = {
            ...BUILDINGS[buildingId],
            unlocked: true,
          };
        }
      });
    }
  }

  mineTimeFragment(): void {
    const state = { ...this.gameStateSubject.value };
    const timeMiner = BUILDINGS['time_miner'];

    if (!timeMiner.unlocked) return;

    // Calculer la valeur du clic en fonction du niveau
    const minerLevel = state.buildings['time_miner'] || 0;
    const baseValue = timeMiner.clickValue || 1;
    const increase = timeMiner.clickIncrease || 0;

    // Retirer Math.floor pour avoir la valeur exacte
    const clickValue = baseValue * (1 + minerLevel * increase);

    // Ajouter les fragments de temps
    state.resources.timeFragments += clickValue;

    // Mettre à jour l'état
    this.gameStateSubject.next(state);
  }

  // Ajouter une méthode pour gérer le reset du cycle
  resetCycle(): void {
    const currentState = this.gameStateSubject.value;
    const prestigePoints = this.calculatePrestigePoints();

    // Réinitialiser l'état unlocked de tous les bâtiments sauf le générateur
    Object.values(BUILDINGS).forEach((building) => {
      if (building.id !== 'generator') {
        building.unlocked = false;
      }
    });

    // Créer un nouvel état avec les valeurs par défaut
    const newState: GameState = {
      resources: {
        timeFragments: 0,
        temporalKnowledge: 0,
        prestigePoints: currentState.resources.prestigePoints + prestigePoints,
      },
      buildings: {},
      multipliers: {
        global: 1,
        buildings: {},
        costs: 1,
        tickRate: 1,
      },
      skills: { ...currentState.skills }, // Conserver les compétences
      upgrades: { ...currentState.upgrades }, // Conserver les améliorations
      totalPlayTime: currentState.totalPlayTime,
      lastUpdate: Date.now(),
      unlockedBuildings: { generator: true }, // Réinitialiser les bâtiments débloqués
      stats: {
        ...currentState.stats,
        cyclesCompleted: currentState.stats.cyclesCompleted + 1,
        totalTemporalKnowledge:
          currentState.stats.totalTemporalKnowledge +
          currentState.resources.temporalKnowledge,
        totalPrestigePoints:
          currentState.stats.totalPrestigePoints + prestigePoints,
      },
      totalProduction: 0,
      chronotronCooldownEndTime: undefined, // Réinitialiser le cooldown du Chronotron
    };

    // Réinitialiser l'état du jeu
    this.gameStateSubject.next(newState);

    // Redémarrer le game loop avec le nouveau tick rate
    this.startGameLoop();

    // Notification
    this.notificationService.show(
      `Cycle terminé ! +${prestigePoints} points de prestige`,
      'success'
    );
  }

  getGameState(): GameState {
    return this.gameStateSubject.value;
  }

  spendPrestigePoints(amount: number): void {
    const currentState = this.gameStateSubject.value;
    if (currentState.resources.prestigePoints >= amount) {
      this.updateGameState({
        ...currentState,
        resources: {
          ...currentState.resources,
          prestigePoints: currentState.resources.prestigePoints - amount,
        },
      });
    }
  }

  addBuildingMultiplier(buildingId: string, value: number): void {
    const currentState = this.gameStateSubject.value;
    this.updateGameState({
      ...currentState,
      multipliers: {
        ...currentState.multipliers,
        buildings: {
          ...currentState.multipliers.buildings,
          [buildingId]:
            (currentState.multipliers.buildings[buildingId] || 1) * (1 + value),
        },
      },
    });
  }

  addGlobalMultiplier(value: number): void {
    const currentState = this.gameStateSubject.value;
    this.updateGameState({
      ...currentState,
      multipliers: {
        ...currentState.multipliers,
        global: currentState.multipliers.global * (1 + value),
      },
    });
  }

  addCostMultiplier(value: number): void {
    const currentState = this.gameStateSubject.value;
    this.updateGameState({
      ...currentState,
      multipliers: {
        ...currentState.multipliers,
        costs: currentState.multipliers.costs * (1 - value),
      },
    });
  }

  addTickRateMultiplier(value: number): void {
    const currentState = this.gameStateSubject.value;
    this.updateGameState({
      ...currentState,
      multipliers: {
        ...currentState.multipliers,
        tickRate: currentState.multipliers.tickRate * (1 - value),
      },
    });
  }

  updateGameState(newState: GameState): void {
    this.gameStateSubject.next(newState);
  }

  getPrestigePoints$(): Observable<number> {
    return this.gameState$.pipe(
      map((state) => state.resources.prestigePoints ?? 0)
    );
  }

  calculatePrestigePoints(): number {
    const currentState = this.gameStateSubject.value;
    const temporalKnowledge = currentState.resources.temporalKnowledge;
    const effects = this.calculateEffects(currentState);
    return Math.ceil(temporalKnowledge * effects.prestigeGainMultiplier);
  }

  activateChronotron(): void {
    const state = this.getGameState();
    const chronotron = this.findBuildingById('chronotron');
    if (!chronotron || !chronotron.effect) return;

    const level = state.buildings['chronotron'] || 0;
    if (!chronotron.unlocked || level === 0) return;

    // Calculer la durée du saut
    const baseJumpDuration = chronotron.effect.jumpDuration ?? 60; // 60 secondes par défaut
    const durationIncrease =
      (chronotron.effect.durationIncrease ?? 0.05) * level;
    const jumpDuration = Math.floor(baseJumpDuration * (1 + durationIncrease));

    // Calculer le nombre de ticks pendant le saut
    const tickRate = this.getCurrentTickRate();
    const numberOfTicks = Math.floor(jumpDuration / tickRate);

    // Calculer la production totale pendant le saut
    let totalProduction = 0;
    Object.entries(state.buildings).forEach(([buildingId, amount]) => {
      if (amount > 0) {
        totalProduction += this.calculateBuildingProduction(buildingId, state);
      }
    });

    const totalGain = Math.floor(totalProduction * numberOfTicks);

    // Mettre à jour les ressources
    const newState = {
      ...state,
      resources: {
        ...state.resources,
        timeFragments: state.resources.timeFragments + totalGain,
      },
      // Sauvegarder le timestamp de fin du cooldown
      chronotronCooldownEndTime:
        Date.now() + this.calculateChronotronCooldown(chronotron) * 1000,
    };

    this.saveGameState(newState);

    // Notification du gain
    this.notificationService.show(
      `Bond dans le temps effectué ! +${totalGain} fragments de temps`,
      'success'
    );
  }

  isChronotronOnCooldown(): boolean {
    const state = this.getGameState();
    if (!state.chronotronCooldownEndTime) return false;
    return Date.now() < state.chronotronCooldownEndTime;
  }

  getChronotronRemainingCooldown(): number {
    const state = this.getGameState();
    if (!state.chronotronCooldownEndTime) return 0;
    const remaining = state.chronotronCooldownEndTime - Date.now();
    return remaining > 0 ? remaining : 0;
  }

  private findBuildingById(id: string): Building | undefined {
    return BUILDINGS[id];
  }

  private calculateChronotronCooldown(chronotron: Building): number {
    const state = this.getGameState();
    const level = state.buildings['chronotron'] || 0;

    if (!chronotron.unlocked || level === 0 || !chronotron.effect) return 0;

    // Retourner la durée en secondes
    const baseCooldown = chronotron.effect.cooldown ?? 300; // 300 secondes = 5 minutes
    const cooldownReduction =
      (chronotron.effect.cooldownReduction ?? 0.05) * level;
    return Math.floor(baseCooldown * (1 - cooldownReduction)); // Arrondir à la seconde inférieure
  }

  private saveGameState(state: GameState): void {
    this.gameStateSubject.next(state);
  }
}
