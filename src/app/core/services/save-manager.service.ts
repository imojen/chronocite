import { Injectable } from '@angular/core';
import { GameState } from '../models/game-state.model';

@Injectable({
  providedIn: 'root',
})
export class SaveManagerService {
  private readonly SAVE_KEY = 'chronocite_save';
  private readonly AUTO_SAVE_INTERVAL = 60000; // 1 minute
  private autoSaveTimer: number | null = null;

  constructor() {
    this.startAutoSave();
  }

  saveGame(state: GameState): void {
    try {
      localStorage.setItem(this.SAVE_KEY, JSON.stringify(state));
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
    }
  }

  loadGame(): GameState | null {
    try {
      const savedState = localStorage.getItem(this.SAVE_KEY);
      return savedState ? JSON.parse(savedState) : null;
    } catch (error) {
      console.error('Erreur lors du chargement:', error);
      return null;
    }
  }

  startAutoSave(): void {
    if (this.autoSaveTimer === null) {
      this.autoSaveTimer = window.setInterval(() => {
        // La sauvegarde automatique sera gérée par le GameService
      }, this.AUTO_SAVE_INTERVAL);
    }
  }

  stopAutoSave(): void {
    if (this.autoSaveTimer !== null) {
      clearInterval(this.autoSaveTimer);
      this.autoSaveTimer = null;
    }
  }

  clearSave(): void {
    localStorage.removeItem(this.SAVE_KEY);
  }
}
