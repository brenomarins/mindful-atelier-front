import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-toast',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="fixed bottom-6 right-6 z-50 flex w-full max-w-sm flex-col gap-3 pointer-events-none">
      @for (toast of toastSvc.toasts(); track toast.id) {
        <div
          class="pointer-events-auto rounded-xl px-4 py-3 text-sm font-semibold shadow-lg transition-all duration-200"
          [class.bg-primary]="toast.type === 'success'"
          [class.text-on-primary]="toast.type === 'success'"
          [class.bg-inverse-surface]="toast.type === 'neutral'"
          [class.text-inverse-on-surface]="toast.type === 'neutral'"
        >
          <div class="flex items-center justify-between gap-3">
            <span>{{ toast.message }}</span>
            <button
              type="button"
              class="material-symbols-outlined text-base opacity-70 transition-opacity hover:opacity-100"
              aria-label="Dismiss notification"
              (click)="toastSvc.dismiss(toast.id)"
            >
              close
            </button>
          </div>
        </div>
      }
    </div>
  `,
})
export class ToastComponent {
  readonly toastSvc = inject(ToastService);
}
