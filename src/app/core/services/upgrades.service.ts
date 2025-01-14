import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { Upgrade } from '../models/upgrade.model';
import { GameState } from '../models/game-state.model';
import { UPGRADES } from '../data/upgrades.data';

@Injectable({
  providedIn: 'root',
})
export class UpgradesService {
  private upgrades = new BehaviorSubject<Upgrade[]>([]);
  upgrades$ = this.upgrades.asObservable();

  constructor() {
    this.initializeUpgrades();
  }

  private initializeUpgrades(): void {
    const initialUpgrades = Object.values(UPGRADES).map((upgrade) => ({
      ...upgrade,
      unlocked: false,
      purchased: false,
    }));
    this.upgrades.next(initialUpgrades);
  }

  updateUpgrades(state: GameState): void {
    const currentUpgrades = this.upgrades.value;
    let hasChanges = false;

    const updatedUpgrades = currentUpgrades.map((upgrade) => {
      const previousState = { ...upgrade };
      const meetsRequirements = this.checkRequirements(state, upgrade);

      if (!upgrade.unlocked && meetsRequirements) {
        upgrade = { ...upgrade, unlocked: true };
        hasChanges = true;
      }

      if (
        previousState.unlocked !== upgrade.unlocked ||
        previousState.purchased !== upgrade.purchased
      ) {
        hasChanges = true;
      }

      return upgrade;
    });

    if (hasChanges) {
      this.upgrades.next(updatedUpgrades);
    }
  }

  private checkRequirements(state: GameState, upgrade: Upgrade): boolean {
    const {
      buildings = {},
      resources = {},
      upgrades = {},
    } = upgrade.requirements;

    // Vérifier les bâtiments requis
    for (const [buildingId, required] of Object.entries(buildings)) {
      if ((state.buildings[buildingId] || 0) < required) return false;
    }

    // Vérifier les ressources requises
    for (const [resourceId, required] of Object.entries(resources)) {
      if ((state.resources[resourceId] || 0) < required) return false;
    }

    // Vérifier les améliorations requises
    for (const [upgradeId, required] of Object.entries(upgrades)) {
      if (required && !state.upgrades[upgradeId]) return false;
    }

    return true;
  }

  getAvailableUpgrades(): Upgrade[] {
    return this.upgrades.value.filter(
      (upgrade) => upgrade.unlocked && !upgrade.purchased
    );
  }

  canPurchaseUpgrade(upgradeId: string, state: GameState): boolean {
    const upgrade = this.upgrades.value.find((u) => u.id === upgradeId);
    if (!upgrade || !upgrade.unlocked || upgrade.purchased) return false;

    return state.resources.timeFragments >= upgrade.cost;
  }

  purchaseUpgrade(upgradeId: string, state: GameState): boolean {
    const upgrade = this.upgrades.value.find((u) => u.id === upgradeId);
    if (!upgrade || !this.canPurchaseUpgrade(upgradeId, state)) return false;

    // Mettre à jour l'état du jeu
    state.resources.timeFragments -= upgrade.cost;
    state.upgrades[upgradeId] = true;

    // Mettre à jour l'amélioration
    const updatedUpgrades = this.upgrades.value.map((u) =>
      u.id === upgradeId ? { ...u, purchased: true } : u
    );
    this.upgrades.next(updatedUpgrades);

    // Mettre à jour les statistiques
    if (!state.stats) state.stats = { upgradesPurchased: 0 };
    state.stats.upgradesPurchased++;

    return true;
  }
}
