import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-notification-badge',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="badge" *ngIf="count > 0">
      {{ count }}
    </div>
  `,
  styles: [
    `
      .badge {
        position: absolute;
        top: -8px;
        right: -8px;
        min-width: 18px;
        height: 18px;
        padding: 0 5px;
        border-radius: 9px;
        background: #ff5252;
        color: white;
        font-size: 12px;
        font-weight: bold;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 0 0 2px #0d1117;
        animation: pulse 2s infinite;
      }

      @keyframes pulse {
        0% {
          box-shadow: 0 0 0 0 rgba(255, 82, 82, 0.7);
        }
        70% {
          box-shadow: 0 0 0 6px rgba(255, 82, 82, 0);
        }
        100% {
          box-shadow: 0 0 0 0 rgba(255, 82, 82, 0);
        }
      }
    `,
  ],
})
export class NotificationBadgeComponent {
  @Input() count = 0;
}
