import { Injectable, OnDestroy } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
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

  private readonly INITIAL_STATE: GameState = {
    resources: {
      timeFragments: 100,
    },
    buildings: {},
    upgrades: {},
    unlockedBuildings: {
      generator: true,
    },
    stats: {
      upgradesPurchased: 0,
    },
    lastUpdate: Date.now(),
    totalPlayTime: 0,
    totalProduction: 0,
  };

  // Initialiser d'abord gameState
  private gameState = new BehaviorSubject<GameState>(this.INITIAL_STATE);
  readonly gameState$ = this.gameState.asObservable();

  // Puis tickRateSubject avec le TICK_RATE initial
  private tickRateSubject = new BehaviorSubject<number>(this.TICK_RATE);
  readonly tickRate$ = this.tickRateSubject.asObservable();

  private gameLoop?: number;

  constructor(private notificationService: NotificationService) {
    // Charger le jeu après l'initialisation complète
    const savedState = this.loadGame();
    this.gameState.next(savedState);

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
    const state = this.gameState.value;
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
      if (!savedState) return this.INITIAL_STATE;

      const parsedState = JSON.parse(savedState);
      parsedState.lastUpdate = Date.now();

      // Charger l'état de déverrouillage des bâtiments
      this.loadUnlockedBuildings(parsedState);

      return parsedState;
    } catch (error) {
      console.error('Erreur lors du chargement:', error);
      return this.INITIAL_STATE;
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
    this.gameState.next(this.INITIAL_STATE);
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

    const currentAmount = this.gameState.value.buildings[buildingId] || 0;
    const effects = this.calculateEffects(this.gameState.value);

    // Calculer le coût avec l'augmentation progressive
    const cost =
      building.baseCost *
      Math.pow(this.COST_INCREASE_RATE, currentAmount + additionalPurchases);

    // Appliquer la réduction de coût globale
    return Math.floor(cost * effects.globalCostReduction);
  }

  canPurchaseBuilding(buildingId: string): boolean {
    const building = BUILDINGS[buildingId];
    if (!building || !building.unlocked) return false;

    const state = this.gameState.value;
    const cost = this.getBuildingCost(buildingId);
    return state.resources.timeFragments >= cost;
  }

  purchaseBuilding(buildingId: string): boolean {
    const state = { ...this.gameState.value };
    const cost = this.getBuildingCost(buildingId);

    if (state.resources.timeFragments < cost) return false;

    // Mettre à jour les ressources et les bâtiments
    state.resources.timeFragments -= cost;
    state.buildings[buildingId] = (state.buildings[buildingId] || 0) + 1;

    this.gameState.next(state);

    // Si c'est un compresseur temporel, émettre le nouveau tick rate
    const building = BUILDINGS[buildingId];
    if (building?.effect?.type === 'tick_rate') {
      this.tickRateSubject.next(this.getCurrentTickRate());
    }

    return true;
  }

  getBuildingAmount(buildingId: string): number {
    return this.gameState.value.buildings[buildingId] || 0;
  }

  // Nouvelles méthodes pour les améliorations
  getAvailableUpgrades(): Upgrade[] {
    const state = this.gameState.value;
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
    if (this.gameState.value.resources.timeFragments < upgrade.cost) {
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
    const currentState = { ...this.gameState.value };

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
    const effects = this.calculateEffects(this.gameState.value);
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
    const currentState = { ...this.gameState.value };
    const now = Date.now();
    const delta = (now - currentState.lastUpdate) / 1000;

    currentState.totalPlayTime += delta;
    currentState.lastUpdate = now;

    const productionPerSecond = this.calculateProduction(currentState);
    const production = productionPerSecond * delta;

    currentState.resources['timeFragments'] += production;
    currentState.totalProduction += production;

    this.updateState(currentState);
  }

  private calculateProduction(state: GameState): number {
    return Object.entries(state.buildings).reduce(
      (total, [buildingId, amount]) => {
        const building = BUILDINGS[buildingId];
        if (!building || !building.baseProduction) return total;

        const effects = this.calculateEffects(state);
        const buildingProduction =
          building.baseProduction * amount * effects.globalProductionBoost;

        return total + buildingProduction;
      },
      0
    );
  }

  private updateState(newState: GameState): void {
    this.gameState.next({ ...newState });
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
    const effects = this.calculateEffects(this.gameState.value);
    const baseProduction = this.calculateProduction(this.gameState.value);
    // Convertir la production par tick en production par seconde
    return (
      ((baseProduction * 1000) / this.getCurrentTickRate()) *
      effects.resourceMultiplier
    );
  }

  getProductionPerTick(): number {
    const effects = this.calculateEffects(this.gameState.value);
    const baseProduction = this.calculateProduction(this.gameState.value);
    return baseProduction * effects.resourceMultiplier;
  }

  getLastUpdate(): number {
    return this.gameState.value.lastUpdate;
  }

  private calculateEffects(state: GameState) {
    let effects = {
      globalProductionBoost: 1,
      globalCostReduction: 1,
      tickRateMultiplier: 1,
      resourceMultiplier: 1,
    };

    // Appliquer les effets des bâtiments
    Object.entries(state.buildings).forEach(([buildingId, amount]) => {
      const building = BUILDINGS[buildingId];
      if (building?.effect) {
        switch (building.effect.type) {
          case 'tick_rate':
            // Limite la réduction du tick rate à 50% maximum
            effects.tickRateMultiplier = Math.max(
              0.5,
              effects.tickRateMultiplier *
                Math.pow(building.effect.value, amount)
            );
            break;
          case 'cost_reduction':
            // Limite la réduction des coûts à 75% maximum
            effects.globalCostReduction = Math.max(
              0.25,
              effects.globalCostReduction *
                Math.pow(building.effect.value, amount)
            );
            break;
          case 'production_boost':
            if (building.effect.target) {
              // Pas de limite pour les bonus ciblés
              effects.globalProductionBoost *= Math.pow(
                building.effect.value,
                amount
              );
            } else {
              // Limite le bonus global à x5 maximum
              effects.globalProductionBoost = Math.min(
                5,
                effects.globalProductionBoost *
                  Math.pow(building.effect.value, amount)
              );
            }
            break;
          case 'resource_multiplier':
            // Limite le multiplicateur de ressources à x10 maximum
            effects.resourceMultiplier = Math.min(
              10,
              effects.resourceMultiplier *
                Math.pow(building.effect.value, amount)
            );
            break;
        }
      }
    });

    return effects;
  }

  // Ajouter une méthode pour obtenir le tick rate actuel
  getCurrentTickRate(): number {
    const effects = this.calculateEffects(this.gameState.value);
    return Math.max(1000, this.TICK_RATE * effects.tickRateMultiplier);
  }

  // Nouvelle méthode pour vérifier si un bâtiment peut encore être acheté
  canBuildingBeUpgraded(buildingId: string): boolean {
    const building = BUILDINGS[buildingId];
    if (!building) return false;

    // Si c'est un compresseur temporel, vérifier si la limite est atteinte
    if (building.effect?.type === 'tick_rate') {
      const effects = this.calculateEffects(this.gameState.value);
      const currentTickRate = this.TICK_RATE * effects.tickRateMultiplier;
      // Empêcher l'achat si le tick rate est <= 1000ms (1 seconde)
      return currentTickRate > 1000;
    }

    return true;
  }

  getCurrentEffects() {
    return this.calculateEffects(this.gameState.value);
  }

  private isUpgradePurchased(upgradeId: string): boolean {
    return !!this.gameState.value.upgrades[upgradeId];
  }

  getBuildingDefinition(buildingId: string): Building {
    return BUILDINGS[buildingId];
  }

  getResources$() {
    return this.gameState$.pipe(
      map((state) => ({
        name: 'Fragments de temps',
        amount: Math.floor(state.resources.timeFragments * 100) / 100,
        perTick: this.getProductionPerTick(),
      }))
    );
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
    return (
      building.baseProduction *
      amount *
      effects.globalProductionBoost *
      effects.resourceMultiplier
    );
  }

  getTotalPlayTime(): number {
    return (
      this.gameState.value.totalPlayTime +
      (Date.now() - this.gameState.value.lastUpdate)
    );
  }

  purchaseMaxBuilding(buildingId: string): void {
    let currentState = { ...this.gameState.value };
    let resources = currentState.resources.timeFragments;
    let purchased = 0;

    while (true) {
      const cost = this.getBuildingCost(buildingId);
      if (resources < cost) break;

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
        !this.gameState.value.buildings[building.requiredBuilding]
      ) {
        return false;
      }
    }

    return (
      this.gameState.value.resources.timeFragments >= (building.unlockCost || 0)
    );
  }

  unlockBuilding(buildingId: string): boolean {
    const state = { ...this.gameState.value };
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
    this.gameState.next({
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
    const state = { ...this.gameState.value };
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
    this.gameState.next(state);
  }
}
