import { Injectable } from '@angular/core';
import { GameState } from '../models/game-state.model';
import { Building } from '../models/building.model';
import { BUILDINGS } from '../data/buildings.data';

@Injectable({
  providedIn: 'root',
})
export class ProductionCalculatorService {
  calculateResourceProduction(
    state: GameState,
    delta: number
  ): { [key: string]: number } {
    const production: { [key: string]: number } = {
      timeFragments: 1 * delta, // Production de base
    };

    // Ajouter la production des bâtiments
    Object.entries(state.buildings).forEach(([buildingId, amount]) => {
      const building = this.getBuildingConfig(buildingId);
      if (building) {
        Object.entries(building.baseProduction).forEach(
          ([resourceId, baseProduction]) => {
            production[resourceId] =
              (production[resourceId] || 0) + baseProduction * amount * delta;
          }
        );
      }
    });

    return production;
  }

  getBuildingConfig(buildingId: string): Building | null {
    return BUILDINGS[buildingId] || null;
  }
}
