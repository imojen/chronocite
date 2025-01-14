import { Injectable, NgZone, OnDestroy } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class GameLoopService implements OnDestroy {
  private readonly TICK_RATE = 100;
  private gameLoopTimer: number | null = null;
  private lastTick = Date.now();
  private isRunning = false;
  private maxUpdatesPerSecond = 60;
  private minTimeBetweenUpdates = 1000 / this.maxUpdatesPerSecond;

  private isPaused = new BehaviorSubject<boolean>(false);
  isPaused$ = this.isPaused.asObservable();

  constructor(private ngZone: NgZone) {
    console.log('7. GameLoopService initialized');
  }

  startGameLoop(tickCallback: (delta: number) => void): void {
    if (this.isRunning) {
      return;
    }

    this.isRunning = true;
    this.lastTick = Date.now();

    this.ngZone.runOutsideAngular(() => {
      this.gameLoopTimer = window.setInterval(() => {
        if (!this.isRunning || this.isPaused.value) {
          return;
        }

        const now = Date.now();
        const timeSinceLastTick = now - this.lastTick;

        if (timeSinceLastTick >= this.minTimeBetweenUpdates) {
          const delta = timeSinceLastTick / 1000;
          this.lastTick = now;

          if (delta > 1) {
            return;
          }

          this.ngZone.run(() => tickCallback(delta));
        }
      }, this.TICK_RATE);
    });
  }

  ngOnDestroy(): void {
    this.stopGameLoop();
  }

  stopGameLoop(): void {
    this.isRunning = false;
    if (this.gameLoopTimer !== null) {
      clearInterval(this.gameLoopTimer);
      this.gameLoopTimer = null;
    }
  }

  togglePause(): void {
    this.isPaused.next(!this.isPaused.value);
  }

  setPaused(paused: boolean): void {
    this.isPaused.next(paused);
  }
}
