import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DialogService } from '../../../core/services/dialog.service';

@Component({
  selector: 'app-confirmation-dialog',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (dialogService.dialog$ | async; as dialog) { @if (dialog.isOpen) {
    <div class="dialog-overlay">
      <div class="dialog-container" [class]="dialog.config?.type">
        <h2>{{ dialog.config?.title }}</h2>
        <p>{{ dialog.config?.message }}</p>
        <div class="button-group">
          @if (dialog.config?.cancelText) {
          <button class="cancel" (click)="dialogService.close(false)">
            {{ dialog.config?.cancelText }}
          </button>
          }
          <button class="confirm" (click)="dialogService.close(true)">
            {{ dialog.config?.confirmText }}
          </button>
        </div>
      </div>
    </div>
    } }
  `,
  styles: [
    `
      .dialog-overlay {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.7);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 1000;
        backdrop-filter: blur(4px);
      }

      .dialog-container {
        background: #1b1f24;
        border-radius: 8px;
        padding: 2rem;
        max-width: 400px;
        width: 90%;
        border: 1px solid rgba(239, 68, 68, 0.2);
        box-shadow: 0 0 30px rgba(239, 68, 68, 0.1);
        animation: slideIn 0.3s ease;
      }

      .warning {
        border-color: rgba(239, 68, 68, 0.3);
      }

      h2 {
        color: #ef4444;
        margin-bottom: 1rem;
        font-size: 1.5rem;
      }

      p {
        color: #a8b7c5;
        margin-bottom: 2rem;
        line-height: 1.6;
      }

      .button-group {
        display: flex;
        gap: 1rem;
        justify-content: space-between;
        margin-top: 2rem;
        background: none;
        border: none;
      }

      button {
        padding: 0.75rem 1.5rem;
        border-radius: 6px;
        border: none;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.2s;
        font-size: 0.9rem;
        min-width: 120px;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }

      .cancel {
        background: #2d333b;
        color: #a8b7c5;
        border: 1px solid rgba(255, 255, 255, 0.1);
      }

      .confirm {
        background: #ef4444;
        color: white;
        border: 1px solid rgba(239, 68, 68, 0.3);
        box-shadow: 0 0 15px rgba(239, 68, 68, 0.15);
      }

      .cancel:hover {
        background: #353b44;
        border-color: rgba(255, 255, 255, 0.15);
      }

      .confirm:hover {
        background: #dc2626;
        border-color: rgba(239, 68, 68, 0.4);
        box-shadow: 0 0 20px rgba(239, 68, 68, 0.2);
      }

      @keyframes slideIn {
        from {
          transform: translateY(-20px);
          opacity: 0;
        }
        to {
          transform: translateY(0);
          opacity: 1;
        }
      }
    `,
  ],
})
export class ConfirmationDialogComponent {
  constructor(public dialogService: DialogService) {}
}
