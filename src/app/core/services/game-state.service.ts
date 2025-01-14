import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { Resource, TimeFragment, Chronon } from '../models/resource.model';
import { Building } from '../models/building.model';
import { Cycle } from '../models/cycle.model';

@Injectable({
  providedIn: 'root',
})
export class GameStateService {
  private readonly SAVE_KEY = 'chronocite_save';

  private gameState = new BehaviorSubject<{
    resources: { [key: string]: Resource };
    buildings: { [key: string]: Building };
    currentCycle: Cycle;
    lastUpdate: number;
    totalPlayTime: number;
  }>(this.getInitialState());

  constructor() {
    this.loadGame();
    this.startGameLoop();
  }

  private getInitialState() {
    return {
      resources: {
        timeFragments: {
          id: 'timeFragments',
          name: 'Fragments de Temps',
          amount: 0,
          perSecond: 0,
          unlocked: true,
          multiplier: 1,
        } as TimeFragment,
        chronons: {
          id: 'chronons',
          name: 'Chronons',
          amount: 0,
          perSecond: 0,
          unlocked: false,
          totalEarned: 0,
        } as Chronon,
      },
      buildings: {},
      currentCycle: {
        id: 1,
        timeElapsed: 0,
        chrononsEarned: 0,
        achievements: [],
        stats: {
          totalFragmentsGenerated: 0,
          buildingsConstructed: 0,
          upgradesPurchased: 0,
        },
      },
      lastUpdate: Date.now(),
      totalPlayTime: 0,
    };
  }

  private startGameLoop() {
    setInterval(() => this.update(), 100); // 10 fois par seconde
  }

  private update() {
    // Logique de mise à jour du jeu
  }

  private loadGame() {
    const savedState = localStorage.getItem(this.SAVE_KEY);
    if (savedState) {
      this.gameState.next(JSON.parse(savedState));
    }
  }

  private saveGame() {
    localStorage.setItem(this.SAVE_KEY, JSON.stringify(this.gameState.value));
  }
}
