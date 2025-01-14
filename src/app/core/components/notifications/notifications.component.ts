import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  NotificationService,
  Notification,
} from '../../services/notification.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-notifications',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="notifications-container">
      @for (notification of notifications; track notification.id) {
      <div
        class="notification"
        [class]="notification.type"
        (click)="remove(notification.id)"
      >
        <span class="message">{{ notification.message }}</span>
        <button class="close-button" (click)="remove(notification.id)">
          ×
        </button>
      </div>
      }
    </div>
  `,
  styles: [
    `
      .notifications-container {
        position: fixed;
        top: 1rem;
        right: 1rem;
        z-index: 1000;
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
        max-width: 300px;
      }

      .notification {
        padding: 1rem;
        border-radius: 4px;
        background: white;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        display: flex;
        justify-content: space-between;
        align-items: center;
        animation: slideIn 0.3s ease-out;
      }

      @keyframes slideIn {
        from {
          transform: translateX(100%);
          opacity: 0;
        }
        to {
          transform: translateX(0);
          opacity: 1;
        }
      }

      .message {
        margin-right: 1rem;
      }

      .close-button {
        background: none;
        border: none;
        font-size: 1.2rem;
        cursor: pointer;
        padding: 0;
        color: inherit;
        opacity: 0.7;
      }

      .close-button:hover {
        opacity: 1;
      }

      .success {
        background: #4caf50;
        color: white;
      }

      .info {
        background: #2196f3;
        color: white;
      }

      .warning {
        background: #ff9800;
        color: white;
      }

      .error {
        background: #f44336;
        color: white;
      }
    `,
  ],
})
export class NotificationsComponent implements OnInit, OnDestroy {
  notifications: Notification[] = [];
  private subscription?: Subscription;

  constructor(private notificationService: NotificationService) {}

  ngOnInit(): void {
    this.subscription = this.notificationService.notifications$.subscribe(
      (notifications) => {
        this.notifications = notifications;
      }
    );
  }

  ngOnDestroy(): void {
    this.subscription?.unsubscribe();
  }

  remove(id: number): void {
    this.notificationService.remove(id);
  }
}
