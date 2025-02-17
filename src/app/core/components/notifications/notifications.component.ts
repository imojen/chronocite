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
        bottom: 1.5rem;
        right: 1.5rem;
        z-index: 1000;
        display: flex;
        flex-direction: column-reverse;
        gap: 0.75rem;
        max-width: 350px;
      }

      .notification {
        padding: 0.75rem 1rem;
        border-radius: 0;
        background: rgba(15, 23, 42, 0.8);
        backdrop-filter: blur(10px);
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
        display: flex;
        justify-content: space-between;
        align-items: center;
        animation: slideIn 0.4s cubic-bezier(0.16, 1, 0.3, 1), glow 2s infinite;
        border: 1px solid rgba(255, 255, 255, 0.1);
        position: relative;
        overflow: hidden;
      }

      .notification::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        height: 1px;
        background: linear-gradient(
          90deg,
          transparent,
          rgba(255, 255, 255, 0.2),
          transparent
        );
        animation: shimmer 2s infinite;
      }

      @keyframes shimmer {
        0% {
          transform: translateX(-100%);
        }
        100% {
          transform: translateX(100%);
        }
      }

      @keyframes glow {
        0%,
        100% {
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
        }
        50% {
          box-shadow: 0 8px 32px rgba(var(--glow-color, 0, 0, 0), 0.5);
        }
      }

      @keyframes slideIn {
        0% {
          transform: translateX(120%);
          opacity: 0;
        }
        100% {
          transform: translateX(0);
          opacity: 1;
        }
      }

      .message {
        margin-right: 1rem;
        font-size: 0.8rem;
        color: rgba(255, 255, 255, 0.9);
        text-shadow: 0 0 10px rgba(255, 255, 255, 0.2);
        letter-spacing: 0.3px;
      }

      .close-button {
        background: none;
        border: none;
        font-size: 1rem;
        cursor: pointer;
        padding: 0;
        color: rgba(255, 255, 255, 0.6);
        transition: all 0.2s;
        width: 20px;
        height: 20px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 0;
      }

      .close-button:hover {
        color: rgba(255, 255, 255, 0.9);
        background: rgba(255, 255, 255, 0.1);
      }

      .success {
        --glow-color: 34, 197, 94;
        border-left: 3px solid rgb(34, 197, 94);
        background: linear-gradient(
          90deg,
          rgba(34, 197, 94, 0.1),
          rgba(15, 23, 42, 0.8)
        );
      }

      .info {
        --glow-color: 59, 130, 246;
        border-left: 3px solid rgb(59, 130, 246);
        background: linear-gradient(
          90deg,
          rgba(59, 130, 246, 0.1),
          rgba(15, 23, 42, 0.8)
        );
      }

      .warning {
        --glow-color: 245, 158, 11;
        border-left: 3px solid rgb(245, 158, 11);
        background: linear-gradient(
          90deg,
          rgba(245, 158, 11, 0.1),
          rgba(15, 23, 42, 0.8)
        );
      }

      .error {
        --glow-color: 239, 68, 68;
        border-left: 3px solid rgb(239, 68, 68);
        background: linear-gradient(
          90deg,
          rgba(239, 68, 68, 0.1),
          rgba(15, 23, 42, 0.8)
        );
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
