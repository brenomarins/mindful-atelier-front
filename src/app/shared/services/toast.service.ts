import { Injectable, signal } from '@angular/core';

export type ToastType = 'success' | 'neutral';

export interface ToastItem {
  id: number;
  message: string;
  type: ToastType;
}

@Injectable({ providedIn: 'root' })
export class ToastService {
  readonly toasts = signal<ToastItem[]>([]);
  private nextId = 1;

  show(message: string, type: ToastType = 'success', duration = 2500): void {
    const id = this.nextId++;
    this.toasts.update(list => [...list, { id, message, type }]);

    window.setTimeout(() => {
      this.dismiss(id);
    }, duration);
  }

  dismiss(id: number): void {
    this.toasts.update(list => list.filter(toast => toast.id !== id));
  }
}
