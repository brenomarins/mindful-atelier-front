import {
  Component, inject, AfterViewChecked, QueryList, ViewChildren, ElementRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastService } from '../../services/toast.service';
import { AnimationService } from '../../services/animation.service';

@Component({
  selector: 'app-toast',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="fixed bottom-6 right-6 z-50 flex w-full max-w-sm flex-col gap-3 pointer-events-none">
      @for (toast of toastSvc.toasts(); track toast.id) {
        <div
          #toastEl
          class="pointer-events-auto rounded-xl px-4 py-3 text-sm font-semibold shadow-lg"
          [class.bg-primary]="toast.type === 'success'"
          [class.text-on-primary]="toast.type === 'success'"
          [class.bg-inverse-surface]="toast.type === 'neutral'"
          [class.text-inverse-on-surface]="toast.type === 'neutral'"
          style="opacity: 0; transform: translateY(20px);"
        >
          <div class="flex items-center justify-between gap-3">
            <span>{{ toast.message }}</span>
            <button
              type="button"
              class="material-symbols-outlined text-base opacity-70 transition-opacity hover:opacity-100"
              aria-label="Dismiss notification"
              (click)="dismissToast(toast.id)"
            >
              close
            </button>
          </div>
        </div>
      }
    </div>
  `,
})
export class ToastComponent implements AfterViewChecked {
  readonly toastSvc = inject(ToastService);
  private animSvc = inject(AnimationService);

  @ViewChildren('toastEl') toastEls!: QueryList<ElementRef<HTMLElement>>;

  private knownIds = new Set<number>();

  ngAfterViewChecked(): void {
    const currentIds = new Set(this.toastSvc.toasts().map(t => t.id));
    const newIds = [...currentIds].filter(id => !this.knownIds.has(id));

    if (newIds.length > 0) {
      // Nudge existing toasts up before animating new one in
      const existingEls = this.toastEls.toArray()
        .slice(0, -newIds.length)
        .map(r => r.nativeElement);
      if (existingEls.length > 0) {
        this.animSvc.nudgeToastsUp(existingEls);
      }

      // Animate new toasts in
      newIds.forEach(id => {
        const idx = this.toastSvc.toasts().findIndex(t => t.id === id);
        const elRef = this.toastEls.toArray()[idx];
        if (elRef) this.animSvc.animateToastIn(elRef.nativeElement);
        this.knownIds.add(id);
      });
    }

    // Clean up IDs that are no longer present
    const removedIds = [...this.knownIds].filter(id => !currentIds.has(id));
    if (removedIds.length > 0) {
      removedIds.forEach(id => this.knownIds.delete(id));
    }
  }

  dismissToast(id: number): void {
    const idx = this.toastSvc.toasts().findIndex(t => t.id === id);
    const elRef = this.toastEls.toArray()[idx];
    if (elRef) {
      this.animSvc.animateToastOut(elRef.nativeElement)
        .then(() => this.toastSvc.dismiss(id));
    } else {
      this.toastSvc.dismiss(id);
    }
  }
}
