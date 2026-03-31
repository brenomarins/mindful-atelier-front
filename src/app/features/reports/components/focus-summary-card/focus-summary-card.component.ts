import {
  Component, Input, OnChanges, ChangeDetectionStrategy, ChangeDetectorRef, inject,
} from '@angular/core';
import { TrendPointDto } from '../../../../core/models/stats.model';
import { WeeklyProgressChartComponent } from '../weekly-progress-chart/weekly-progress-chart.component';

export interface StreakDay {
  label: string;
  active: boolean;
}

@Component({
  selector: 'app-focus-summary-card',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [WeeklyProgressChartComponent],
  template: `
    @if (loading) {
      <div data-testid="skeleton" class="animate-pulse space-y-4">
        <div class="h-48 bg-surface-container rounded-xl"></div>
        <div class="h-48 bg-surface-container rounded-xl mt-6"></div>
      </div>
    } @else {
      <!-- Focus Score hero card -->
      <div class="bg-primary-container text-on-primary rounded-xl p-8">
        <p class="text-sm font-medium tracking-widest uppercase opacity-70 mb-4">Focus Score</p>
        <div class="flex items-end gap-6 mb-6">
          <span class="font-headline font-extrabold text-on-primary text-7xl leading-none">
            {{ focusScore }}
          </span>
          <span class="text-2xl opacity-70 mb-2">/100</span>
        </div>

        <!-- Pomodoro glass sub-card -->
        <div class="bg-white/10 backdrop-blur-md p-6 rounded-2xl border border-white/10 flex items-center gap-4">
          <div>
            <p class="text-3xl font-bold text-on-primary">{{ pomodoroCount }}</p>
            <p class="text-sm opacity-70 mt-1">Pomodoros completed</p>
          </div>
        </div>
      </div>

      <!-- Weekly Progress chart -->
      <div class="bg-surface-container-lowest rounded-xl p-8 mt-6">
        <p class="text-sm font-medium tracking-widest uppercase text-on-surface-variant mb-4">
          Weekly Progress
        </p>
        <app-weekly-progress-chart [trend]="trend" [loading]="false" />
      </div>
    }
  `,
})
export class FocusSummaryCardComponent implements OnChanges {
  private cdr = inject(ChangeDetectorRef);

  @Input() focusScore: number = 0;
  @Input() pomodoroCount: number = 0;
  @Input() trend: TrendPointDto[] = [];
  @Input() totalCompleted: number = 0;
  @Input() loading: boolean = false;

  streakDays: StreakDay[] = [];

  ngOnChanges(): void {
    const DAY_LABELS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
    this.streakDays = DAY_LABELS.map((label, i) => ({
      label,
      active: (this.trend[i]?.hours ?? 0) > 0,
    }));
    this.cdr.markForCheck();
  }
}
