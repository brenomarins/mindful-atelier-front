import {
  Component, inject, signal, computed, effect, DestroyRef,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { forkJoin } from 'rxjs';
import { StatsService } from '../../core/services/stats.service';
import { TaskService } from '../../core/services/task.service';
import { TagService } from '../../core/services/tag.service';
import { JournalService } from '../../core/services/journal.service';
import { StatsResponse, TrendPointDto, TaskStatPointDto } from '../../core/models/stats.model';
import { Task } from '../../core/models/task.model';
import { Tag } from '../../core/models/tag.model';
import { JournalEntry, Mood } from '../../core/models/journal.model';
import { TagBreakdown } from './components/time-allocation-chart/time-allocation-chart.component';
import { MoodPoint } from './components/emotional-rhythm-chart/emotional-rhythm-chart.component';
import { TimeAllocationChartComponent } from './components/time-allocation-chart/time-allocation-chart.component';
import { FocusSummaryCardComponent } from './components/focus-summary-card/focus-summary-card.component';
import { EmotionalRhythmChartComponent } from './components/emotional-rhythm-chart/emotional-rhythm-chart.component';

export type FilterLabel = 'This Week' | 'This Month' | 'This Year' | 'All Time';

// ── Pure helpers ───────────────────────────────────────────────────────────────

function getMonday(d: Date): Date {
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  const monday = new Date(d);
  monday.setDate(d.getDate() + diff);
  monday.setHours(0, 0, 0, 0);
  return monday;
}

function getWeekRange(): { from: string; to: string } {
  const monday = getMonday(new Date());
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  return {
    from: monday.toISOString().slice(0, 10),
    to:   sunday.toISOString().slice(0, 10),
  };
}

function buildTagBreakdown(
  taskStats: TaskStatPointDto[],
  tasks: Task[],
  tags: Tag[],
): TagBreakdown[] {
  const taskMap = new Map(tasks.map(t => [t.id, t]));
  const tagMap  = new Map(tags.map(t => [t.id, t]));
  const grouped = new Map<string, { tag: Tag; minutes: number }>();

  for (const stat of taskStats) {
    const task       = taskMap.get(stat.taskId);
    const firstTagId = task?.tagIds[0];
    const tag        = firstTagId ? tagMap.get(firstTagId) : undefined;
    const key        = tag?.id ?? '__untagged__';

    if (!grouped.has(key)) {
      grouped.set(key, {
        tag: tag ?? { id: '__untagged__', name: 'Untagged', color: '#c2c8bf' },
        minutes: 0,
      });
    }
    grouped.get(key)!.minutes += stat.minutesFocused;
  }

  const totalMin = [...grouped.values()].reduce((s, v) => s + v.minutes, 0);

  return [...grouped.values()]
    .map(({ tag, minutes }) => ({
      tagName:    tag.name,
      color:      tag.color,
      hours:      Math.round((minutes / 60) * 10) / 10,
      percentage: totalMin > 0 ? Math.round((minutes / totalMin) * 100) : 0,
    }))
    .sort((a, b) => b.hours - a.hours);
}

const MOOD_VALUES: Record<Mood, number> = {
  great: 5, good: 4, neutral: 3, low: 2, bad: 1,
};

const DAY_LABELS = ['M', 'T', 'W', 'Th', 'F', 'Sa', 'Su'];

function buildMoodByDay(entries: JournalEntry[]): MoodPoint[] {
  const today    = new Date();
  const todayISO = today.toISOString().slice(0, 10);
  const monday   = getMonday(today);
  const entryMap = new Map(entries.map(e => [e.date, e]));

  return Array.from({ length: 7 }, (_, i) => {
    const d   = new Date(monday);
    d.setDate(monday.getDate() + i);
    const iso   = d.toISOString().slice(0, 10);
    const entry = entryMap.get(iso);
    return {
      label:   DAY_LABELS[i],
      value:   entry ? (MOOD_VALUES[entry.mood] ?? 0) : 0,
      isToday: iso === todayISO,
    };
  });
}

// ── Component ─────────────────────────────────────────────────────────────────

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [
    TimeAllocationChartComponent,
    FocusSummaryCardComponent,
    EmotionalRhythmChartComponent,
  ],
  template: `
    <!-- Page Header -->
    <header class="px-10 py-8">
      <h2 class="font-headline font-bold text-4xl text-on-surface mb-2">Reports &amp; Insights</h2>
      <p class="text-on-surface-variant font-body text-sm">A reflection of your cognitive rhythm and creative output.</p>
    </header>

    <!-- Filter Bar + Error -->
    <div class="px-10 mb-8">
      <div class="flex gap-2 flex-wrap">
        @for (opt of filterOptions; track opt.label) {
          <button
            (click)="setFilter(opt.label, opt.apiFilter)"
            [class]="opt.label === filterLabel()
              ? 'bg-secondary-fixed-dim text-on-secondary-fixed-variant font-bold'
              : 'bg-surface-container text-on-surface-variant'"
            class="px-4 py-1.5 rounded-full text-xs font-body transition-all hover:opacity-80 active:scale-95"
          >
            {{ opt.label }}
          </button>
        }
      </div>
      @if (error()) {
        <div class="mt-4">
          <p class="text-error text-sm font-body">{{ error() }}</p>
          <button (click)="retryLoad()" class="text-primary text-sm font-body underline mt-1">Try again</button>
        </div>
      }
    </div>

    <!-- Bento Grid -->
    <section class="px-10 pb-12 max-w-[1600px] mx-auto w-full">
      <div class="grid grid-cols-12 gap-6 items-start">

        <!-- Row 1: Time Allocation -->
        <div class="col-span-12 lg:col-span-5 bg-surface-container-low rounded-xl p-8">
          <div class="flex justify-between items-center mb-6">
            <h3 class="font-headline font-bold text-xl text-primary">Time Allocation</h3>
            <span class="text-xs font-label uppercase tracking-widest text-on-surface-variant">{{ filterLabel() }}</span>
          </div>
          <app-time-allocation-chart
            [data]="tagBreakdown()"
            [totalHours]="focusHours()"
            [loading]="loading()"
          />
        </div>

        <!-- Row 1: Focus Summary -->
        <div class="col-span-12 lg:col-span-7">
          <app-focus-summary-card
            [focusScore]="focusScore()"
            [pomodoroCount]="pomodoroCount()"
            [trend]="weeklyTrend()"
            [totalCompleted]="totalCompleted()"
            [loading]="loading()"
          />
        </div>

        <!-- Row 2: Mindful Insights (static) -->
        <div class="col-span-12 mt-4">
          <div class="bg-tertiary-fixed rounded-xl p-10 flex flex-col md:flex-row gap-10 items-center overflow-hidden relative">
            <div class="absolute -right-20 -top-20 w-96 h-96 bg-tertiary-container/10 rounded-full blur-[100px]"></div>
            <div class="flex-shrink-0 w-24 h-24 bg-tertiary text-on-tertiary rounded-full flex items-center justify-center shadow-lg relative z-10">
              <span class="material-symbols-outlined text-5xl">auto_awesome</span>
            </div>
            <div class="flex-1 relative z-10">
              <h3 class="font-headline font-bold text-2xl text-on-tertiary-fixed mb-4">Mindful Insights</h3>
              <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div class="bg-white/40 backdrop-blur-sm p-6 rounded-2xl border border-white/40">
                  <div class="flex items-center gap-3 mb-2">
                    <span class="material-symbols-outlined text-tertiary text-sm">wb_sunny</span>
                    <span class="text-[10px] font-bold uppercase tracking-widest text-on-tertiary-fixed-variant">Peak Focus</span>
                  </div>
                  <p class="font-body text-on-tertiary-fixed leading-relaxed font-medium text-sm">
                    You're most productive between <strong>10 AM and 12 PM</strong>. Schedule your Deep Work blocks here for maximum output.
                  </p>
                </div>
                <div class="bg-white/40 backdrop-blur-sm p-6 rounded-2xl border border-white/40">
                  <div class="flex items-center gap-3 mb-2">
                    <span class="material-symbols-outlined text-tertiary text-sm">self_improvement</span>
                    <span class="text-[10px] font-bold uppercase tracking-widest text-on-tertiary-fixed-variant">Cognitive Rest</span>
                  </div>
                  <p class="font-body text-on-tertiary-fixed leading-relaxed font-medium text-sm">
                    Your creative resilience drops after <strong>4 PM</strong>. Consider shifting administrative tasks to the late afternoon.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Row 3: Momentum Streak (col-span-4) -->
        <div class="col-span-12 lg:col-span-4 bg-surface-container-low rounded-xl p-8 flex flex-col">
          <div class="flex items-center gap-4 mb-6">
            <div class="w-12 h-12 rounded-full bg-secondary-fixed text-secondary flex items-center justify-center flex-shrink-0">
              <span class="material-symbols-outlined">bolt</span>
            </div>
            <div>
              <h4 class="font-headline font-bold text-lg text-on-surface">Momentum Streak</h4>
              <p class="text-xs text-on-surface-variant font-body">Consistent performance</p>
            </div>
          </div>
          <div class="flex items-center gap-1 justify-between px-2">
            @for (day of weeklyTrend(); track $index) {
              <div
                class="w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold transition-all"
                [class]="day.hours > 0 ? 'bg-secondary text-white' : 'bg-surface-variant text-on-surface-variant'"
              >
                {{ ['M','T','W','Th','F','Sa','Su'][$index] }}
              </div>
            }
          </div>
        </div>

        <!-- Row 3: Creative Velocity (col-span-8) -->
        <div class="col-span-12 lg:col-span-8 bg-surface-container-lowest rounded-xl p-8 flex flex-col md:flex-row gap-8 items-center border border-outline-variant/10">
          <div class="flex-1">
            <h4 class="font-headline font-bold text-lg text-on-surface mb-2">Creative Velocity</h4>
            <p class="text-sm text-on-surface-variant font-body">
              You've closed <strong class="text-on-surface">{{ totalCompleted() }}</strong> sessions this period.
              Maintaining a steady output builds long-term creative resilience.
            </p>
          </div>
          <div class="flex-shrink-0 w-32 h-20 bg-surface-container-high rounded-xl overflow-hidden flex items-end p-2 gap-1">
            @for (stat of (stats()?.taskStats?.slice(0, 5) ?? []); track stat.taskId) {
              <div class="flex-1 bg-primary-container rounded-t-sm"
                   [style.height.%]="stat.started > 0 ? (stat.completed / stat.started) * 100 : 10">
              </div>
            }
          </div>
        </div>

        <!-- Row 4: Emotional Rhythm -->
        <div class="col-span-12 bg-surface-container-low rounded-xl p-8 border border-outline-variant/10">
          <div class="flex flex-col md:flex-row gap-10 items-start">
            <div class="flex-1">
              <div class="flex items-center gap-3 mb-4">
                <div class="w-10 h-10 rounded-full bg-tertiary-fixed text-tertiary flex items-center justify-center shadow-sm flex-shrink-0">
                  <span class="material-symbols-outlined">mood</span>
                </div>
                <h4 class="font-headline font-bold text-xl text-on-surface">Emotional Rhythm</h4>
              </div>
              <p class="text-sm text-on-surface-variant font-body leading-relaxed max-w-xl">
                Your mood this week, mapped day by day. A strong correlation between high-energy mornings
                and your <strong>Creative Velocity</strong> can indicate when to schedule deep work.
              </p>
            </div>
            <div class="flex-shrink-0 w-full md:w-80">
              <app-emotional-rhythm-chart [mood]="moodByDay()" [loading]="loading()" />
            </div>
          </div>
        </div>

      </div>
    </section>

    <footer class="py-12 px-10 text-on-surface-variant/30 text-[10px] uppercase tracking-widest text-center font-label">
      Mindful Atelier © 2026 • Data-Driven Reflection
    </footer>
  `,
})
export class ReportsComponent {
  private statsSvc   = inject(StatsService);
  private taskSvc    = inject(TaskService);
  private tagSvc     = inject(TagService);
  private journalSvc = inject(JournalService);
  private destroyRef = inject(DestroyRef);

  // ── Filter ─────────────────────────────────────────────────────────────────
  filter      = signal<'week' | 'all'>('week');
  filterLabel = signal<FilterLabel>('This Week');

  readonly filterOptions: { label: FilterLabel; apiFilter: 'week' | 'all' }[] = [
    { label: 'This Week',  apiFilter: 'week' },
    // TODO [backend]: month and year filters not yet supported; mapped to 'all'
    { label: 'This Month', apiFilter: 'all'  },
    { label: 'This Year',  apiFilter: 'all'  },
    { label: 'All Time',   apiFilter: 'all'  },
  ];

  // ── Raw data ───────────────────────────────────────────────────────────────
  stats       = signal<StatsResponse | null>(null);
  tasks       = signal<Task[]>([]);
  tags        = signal<Tag[]>([]);
  moodEntries = signal<JournalEntry[]>([]);
  loading     = signal(false);
  error       = signal<string | null>(null);

  // ── Computed ───────────────────────────────────────────────────────────────
  tagBreakdown = computed(() =>
    buildTagBreakdown(this.stats()?.taskStats ?? [], this.tasks(), this.tags())
  );

  moodByDay = computed(() => buildMoodByDay(this.moodEntries()));

  focusHours = computed(() =>
    Math.round(((this.stats()?.totalMinutesFocused ?? 0) / 60) * 10) / 10
  );

  focusScore = computed(() =>
    Math.round((this.stats()?.completionRate ?? 0) * 100)
  );

  pomodoroCount = computed(() => this.stats()?.totalCompleted ?? 0);

  weeklyTrend = computed(() => this.stats()?.weeklyTrend ?? []);

  totalCompleted = computed(() =>
    this.stats()?.taskStats?.reduce((s, t) => s + t.completed, 0) ?? 0
  );

  constructor() {
    effect(() => {
      this.loadData(this.filter());
    });
  }

  setFilter(label: FilterLabel, apiFilter: 'week' | 'all'): void {
    this.filterLabel.set(label);
    this.filter.set(apiFilter);
  }

  retryLoad(): void {
    this.loadData(this.filter());
  }

  loadData(filter: 'week' | 'all'): void {
    this.loading.set(true);
    this.error.set(null);
    const { from, to } = getWeekRange();

    forkJoin([
      this.statsSvc.getStats(filter),
      this.taskSvc.list(),
      this.tagSvc.list(),
      this.journalSvc.list(from, to),
    ]).pipe(
      takeUntilDestroyed(this.destroyRef),
    ).subscribe({
      next: ([stats, tasks, tags, moodEntries]) => {
        this.stats.set(stats);
        this.tasks.set(tasks);
        this.tags.set(tags);
        this.moodEntries.set(moodEntries);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Could not load report data. Please try again.');
        this.loading.set(false);
      },
    });
  }
}
