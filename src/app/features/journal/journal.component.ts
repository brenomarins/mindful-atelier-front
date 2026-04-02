import {
  Component, inject, signal, computed, effect, DestroyRef,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DatePipe } from '@angular/common';
import { Router } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { JournalService } from '../../core/services/journal.service';
import { Mood, JournalEntry, JournalEntryRequest } from '../../core/models/journal.model';
import { ToastService } from '../../shared/services/toast.service';

@Component({
  selector: 'app-journal',
  standalone: true,
  imports: [DatePipe],
  templateUrl: './journal.component.html',
})
export class JournalComponent {
  private journalSvc = inject(JournalService);
  private router = inject(Router);
  private destroyRef = inject(DestroyRef);
  private toastSvc = inject(ToastService);

  // ── State signals ──────────────────────────────────────────────────────────
  selectedDate = signal<string>(this.todayIso());
  entry        = signal<JournalEntry | null>(null);
  mood         = signal<Mood | null>(null);
  achievements = signal<string>('');
  difficulties = signal<string>('');
  loading      = signal<boolean>(false);
  saving       = signal<boolean>(false);
  loadError    = signal<string | null>(null);
  saveError    = signal<string | null>(null);

  // ── Computed ───────────────────────────────────────────────────────────────
  selectedDateObj = computed(() => new Date(this.selectedDate() + 'T12:00:00'));
  canSave = computed(() => this.mood() !== null && !this.saving() && !this.loading());
  isToday = computed(() => this.selectedDate() === this.todayIso());

  // ── Mood config ────────────────────────────────────────────────────────────
  readonly moods: { value: Mood; label: string; icon: string }[] = [
    { value: 'great',   label: 'Great',   icon: 'sentiment_very_satisfied' },
    { value: 'good',    label: 'Good',    icon: 'sentiment_satisfied' },
    { value: 'neutral', label: 'Neutral', icon: 'sentiment_neutral' },
    { value: 'low',     label: 'Low',     icon: 'sentiment_dissatisfied' },
    { value: 'bad',     label: 'Bad',     icon: 'sentiment_very_dissatisfied' },
  ];

  constructor() {
    effect(() => {
      this.loadEntry(this.selectedDate());
    });
  }

  // ── Date navigation ────────────────────────────────────────────────────────
  prevDay(): void {
    const d = new Date(this.selectedDate() + 'T12:00:00');
    d.setDate(d.getDate() - 1);
    this.selectedDate.set(d.toISOString().slice(0, 10));
  }

  nextDay(): void {
    if (this.isToday()) return;
    const d = new Date(this.selectedDate() + 'T12:00:00');
    d.setDate(d.getDate() + 1);
    this.selectedDate.set(d.toISOString().slice(0, 10));
  }

  // ── Actions ────────────────────────────────────────────────────────────────
  saveDraft(): void {
    if (!this.canSave()) return;
    this.upsert(false);
  }

  completeReflection(): void {
    if (!this.canSave()) return;
    this.upsert(true);
  }

  // ── Private ────────────────────────────────────────────────────────────────
  private loadEntry(date: string): void {
    this.loading.set(true);
    this.loadError.set(null);
    this.saveError.set(null);

    this.journalSvc.getByDate(date).pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: entry => {
        this.entry.set(entry);
        this.mood.set(entry.mood);
        this.achievements.set(entry.achievements ?? '');
        this.difficulties.set(entry.difficulties ?? '');
        this.loading.set(false);
      },
      error: (err: HttpErrorResponse) => {
        if (err.status === 404) {
          this.entry.set(null);
          this.mood.set(null);
          this.achievements.set('');
          this.difficulties.set('');
        } else {
          this.loadError.set('Could not load entry — try again');
        }
        this.loading.set(false);
      },
    });
  }

  private upsert(navigateAfter: boolean): void {
    this.saving.set(true);
    this.saveError.set(null);

    const req: JournalEntryRequest = {
      mood:         this.mood()!,
      achievements: this.achievements(),
      difficulties: this.difficulties(),
    };

    this.journalSvc.upsert(this.selectedDate(), req).pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: (saved) => {
        this.entry.set(saved);
        this.saving.set(false);
        this.toastSvc.show(navigateAfter ? 'Reflection complete' : 'Reflection saved');
        if (navigateAfter) {
          this.router.navigate(['/schedule']);
        }
      },
      error: () => {
        this.saving.set(false);
        this.saveError.set('Failed to save — please try again');
      },
    });
  }

  private todayIso(): string {
    return new Date().toISOString().slice(0, 10);
  }
}
