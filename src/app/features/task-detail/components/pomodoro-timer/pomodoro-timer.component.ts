import { Component, Input, OnInit, inject, signal, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription, interval, catchError, EMPTY } from 'rxjs';
import { SessionService } from '../../../../core/services/session.service';
import { Session } from '../../../../core/models/session.model';

type SessionType = 'work' | 'short_break' | 'long_break';

const PRESET_DURATIONS: Record<SessionType, number> = {
  work:        25 * 60,
  short_break:  5 * 60,
  long_break:  15 * 60,
};

@Component({
  selector: 'app-pomodoro-timer',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './pomodoro-timer.component.html',
})
export class PomodoroTimerComponent implements OnInit {
  @Input({ required: true }) taskId!: string;
  @Input() openSession: Session | null = null;

  private sessionSvc  = inject(SessionService);
  private destroyRef  = inject(DestroyRef);
  private subscription: Subscription | null = null;

  timeRemaining    = signal<number>(25 * 60);
  isRunning        = signal<boolean>(false);
  sessionType      = signal<SessionType>('work');
  currentSessionId = signal<string | null>(null);
  sessionComplete  = signal<boolean>(false);
  otherTaskRunning = signal<boolean>(false);
  totalMinutes     = signal<number>(0);
  pomodoroCount    = signal<number>(0);

  get presetDuration(): number { return PRESET_DURATIONS[this.sessionType()]; }

  get displayTime(): string {
    const t = this.timeRemaining();
    const m = Math.floor(t / 60);
    const s = t % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  }

  ngOnInit(): void {
    this.destroyRef.onDestroy(() => this.subscription?.unsubscribe());
    this.loadStats();
    this.handleResume();
  }

  private handleResume(): void {
    const s = this.openSession;
    if (!s) return;

    if (s.isOpen === 1 && s.taskId != null && s.taskId === this.taskId) {
      const startMs   = new Date(s.startedAt).getTime();
      const remaining = Math.floor((startMs + s.durationMinutes * 60 * 1000 - Date.now()) / 1000);
      if (remaining > 0) {
        this.timeRemaining.set(remaining);
        this.isRunning.set(true);
        this.currentSessionId.set(s.id);
        this.startInterval();
      } else {
        // Session expired while app was closed — auto-complete it
        this.sessionSvc.complete(s.id).pipe(catchError(() => EMPTY)).subscribe();
        this.timeRemaining.set(25 * 60);
      }
    } else if (s.isOpen === 1 && (s.taskId == null || s.taskId !== this.taskId)) {
      this.otherTaskRunning.set(true);
    }
  }

  private loadStats(): void {
    this.sessionSvc.listByTask(this.taskId).subscribe(sessions => {
      const completed = sessions.filter(s => s.completedAt !== null);
      this.totalMinutes.set(completed.reduce((acc, s) => acc + s.durationMinutes, 0));
      this.pomodoroCount.set(completed.filter(s => s.type === 'work').length);
    });
  }

  start(): void {
    if (this.otherTaskRunning()) return;
    this.sessionSvc.startWork({ taskId: this.taskId }).pipe(
      catchError(() => EMPTY),
    ).subscribe(session => {
      this.currentSessionId.set(session.id);
      this.isRunning.set(true);
      this.sessionComplete.set(false);
      this.startInterval();
    });
  }

  pause(): void {
    const id = this.currentSessionId();
    if (!id) return;
    const prevRunning = this.isRunning();
    const prevId      = id;
    this.isRunning.set(false);
    this.stopInterval();
    this.currentSessionId.set(null);
    this.sessionSvc.interrupt(id).pipe(
      catchError(() => {
        this.isRunning.set(prevRunning);
        this.currentSessionId.set(prevId);
        this.startInterval();
        return EMPTY;
      }),
    ).subscribe();
  }

  reset(): void {
    const id = this.currentSessionId();
    this.stopInterval();
    this.isRunning.set(false);
    this.currentSessionId.set(null);
    this.timeRemaining.set(this.presetDuration);
    this.sessionComplete.set(false);
    if (id) {
      this.sessionSvc.interrupt(id).pipe(catchError(() => EMPTY)).subscribe();
    }
  }

  switchPreset(type: SessionType): void {
    const id = this.currentSessionId();
    if (this.isRunning() && id) {
      this.sessionSvc.interrupt(id).pipe(catchError(() => EMPTY)).subscribe();
    }
    this.stopInterval();
    this.isRunning.set(false);
    this.currentSessionId.set(null);
    this.sessionType.set(type);
    this.timeRemaining.set(PRESET_DURATIONS[type]);
    this.sessionComplete.set(false);
  }

  private startInterval(): void {
    this.subscription = interval(1000).subscribe(() => {
      const remaining = this.timeRemaining() - 1;
      if (remaining <= 0) {
        this.timeRemaining.set(0);
        this.onTimerReachedZero();
      } else {
        this.timeRemaining.set(remaining);
      }
    });
  }

  private stopInterval(): void {
    this.subscription?.unsubscribe();
    this.subscription = null;
  }

  private onTimerReachedZero(): void {
    const id = this.currentSessionId();
    this.stopInterval();
    this.isRunning.set(false);
    this.currentSessionId.set(null);
    this.sessionComplete.set(true);
    if (id) {
      this.sessionSvc.complete(id).pipe(catchError(() => EMPTY))
        .subscribe(() => this.loadStats());
    }
  }
}
