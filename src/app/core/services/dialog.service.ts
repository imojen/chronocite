import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface DialogConfig {
  title: string;
  message: string;
  confirmText: string;
  cancelText?: string;
  type: 'warning' | 'info' | 'success';
}

@Injectable({
  providedIn: 'root',
})
export class DialogService {
  private dialogSubject = new BehaviorSubject<{
    isOpen: boolean;
    config?: DialogConfig;
    resolve?: (value: boolean) => void;
  }>({ isOpen: false });

  dialog$ = this.dialogSubject.asObservable();

  confirm(config: DialogConfig): Promise<boolean> {
    const finalConfig = {
      ...config,
      cancelText: config.cancelText?.trim() || undefined,
    };

    return new Promise((resolve) => {
      this.dialogSubject.next({ isOpen: true, config: finalConfig, resolve });
    });
  }

  close(result: boolean) {
    const { resolve } = this.dialogSubject.value;
    resolve?.(result);
    this.dialogSubject.next({ isOpen: false });
  }
}
