import { Injectable, signal } from '@angular/core';

export type ToastVariant = 'success' | 'error';

export interface ToastItem {
  id: number;
  message: string;
  variant: ToastVariant;
}

@Injectable({
  providedIn: 'root'
})
export class ToastService {
  private nextId = 1;
  private clearTimer: ReturnType<typeof setTimeout> | null = null;

  readonly active = signal<ToastItem | null>(null);

  showSuccess(message: string, durationMs = 4500): void {
    this.show({ message, variant: 'success' }, durationMs);
  }

  showError(message: string, durationMs = 6500): void {
    this.show({ message, variant: 'error' }, durationMs);
  }

  dismiss(): void {
    if (this.clearTimer) {
      clearTimeout(this.clearTimer);
      this.clearTimer = null;
    }
    this.active.set(null);
  }

  private show(partial: Omit<ToastItem, 'id'>, durationMs: number): void {
    this.dismiss();
    const id = this.nextId++;
    this.active.set({ id, ...partial });
    this.clearTimer = setTimeout(() => {
      this.active.update((current) => (current?.id === id ? null : current));
      this.clearTimer = null;
    }, durationMs);
  }
}
