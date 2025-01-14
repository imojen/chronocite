import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface Notification {
  id: number;
  message: string;
  type: 'success' | 'info' | 'warning' | 'error';
  timestamp: number;
}

@Injectable({
  providedIn: 'root',
})
export class NotificationService {
  private notifications = new BehaviorSubject<Notification[]>([]);
  notifications$ = this.notifications.asObservable();
  private nextId = 1;

  private availableUpgradesCount = new BehaviorSubject<number>(0);
  availableUpgradesCount$ = this.availableUpgradesCount.asObservable();

  show(
    message: string,
    type: 'success' | 'info' | 'warning' | 'error' = 'info'
  ): void {
    const notification: Notification = {
      id: this.nextId++,
      message,
      type,
      timestamp: Date.now(),
    };

    const current = this.notifications.value;
    this.notifications.next([...current, notification]);

    setTimeout(() => this.remove(notification.id), 5000);
  }

  remove(id: number): void {
    const current = this.notifications.value;
    this.notifications.next(current.filter((n) => n.id !== id));
  }

  updateAvailableUpgradesCount(count: number): void {
    this.availableUpgradesCount.next(count);
  }
}
