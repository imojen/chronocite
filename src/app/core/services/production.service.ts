import { Injectable } from '@angular/core';
import { GameStateService } from './game-state.service';

@Injectable({
  providedIn: 'root',
})
export class ProductionService {
  constructor(private gameState: GameStateService) {}

  calculateProduction() {
    // Logique de calcul de la production
  }

  applyMultipliers() {
    // Application des multiplicateurs
  }
}
