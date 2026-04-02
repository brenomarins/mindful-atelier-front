import {
  Component, inject, signal, computed, OnInit, AfterViewInit, OnDestroy,
  QueryList, ElementRef, ViewChildren, ViewChild,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import {
  animate, style, transition, trigger,
} from '@angular/animations';
import {
  DragDropModule, CdkDragDrop, moveItemInArray, transferArrayItem,
} from '@angular/cdk/drag-drop';
import { forkJoin } from 'rxjs';
import { TaskService } from '../../core/services/task.service';
import { TagService } from '../../core/services/tag.service';
import { JournalService } from '../../core/services/journal.service';
import { Task } from '../../core/models/task.model';
import { Tag } from '../../core/models/tag.model';
import { Mood } from '../../core/models/journal.model';
import { TaskCardComponent } from '../../shared/components/task-card/task-card.component';
import { Router } from '@angular/router';
import { ToastService } from '../../shared/services/toast.service';
import { toLocalISO } from '../../core/utils/date.utils';
import { AnimationService } from '../../shared/services/animation.service';

type KillableTween = { kill(): void };

export interface DayColumn {
  date: string;
  label: string;
  dayNumber: number;
  isToday: boolean;
  tasks: Task[];
  hadTasks: boolean;
  allDone: boolean;
}

interface EmptyStateContext {
  headline: string;
  subtext: string;
  showCta: boolean;
  isCelebration?: boolean;
}

@Component({
  selector: 'app-schedule',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, DragDropModule, TaskCardComponent],
  templateUrl: './schedule.component.html',
  animations: [
    trigger('fadeIn', [
      transition(':enter', [
        style({ opacity: 0 }),
        animate('400ms ease-out', style({ opacity: 1 })),
      ]),
    ]),
  ],
})
export class ScheduleComponent implements OnInit, AfterViewInit, OnDestroy {
  private taskSvc = inject(TaskService);
  private tagSvc = inject(TagService);
  private journalSvc = inject(JournalService);
  private router = inject(Router);
  private toastSvc = inject(ToastService);
  private animSvc = inject(AnimationService);

  tags = signal<Tag[]>([]);
  columns = signal<DayColumn[]>([]);
  loading = signal(true);
  weekStart = signal<Date>(this.getMonday(new Date()));

  // Daily Reflection
  today = toLocalISO(new Date());
  reflectionText = signal('');
  savedMood = signal<Mood | null>(null);
  showReflection = signal(localStorage.getItem('reflectionPanelOpen') !== 'false');
  skeletonColumns = Array.from({ length: 7 }, (_, index) => index);

  dropListIds = computed(() => this.columns().map(c => `drop-${c.date}`));
  gridTemplateColumns = computed(() => this.columns().map(col => col.isToday ? '2.5fr' : '1fr').join(' '));
  @ViewChildren('dayNumberEl') dayNumberEls!: QueryList<ElementRef<HTMLElement>>;
  @ViewChildren('dayLabelEl')  dayLabelEls!: QueryList<ElementRef<HTMLElement>>;
  @ViewChild('todayGlowEl',      { static: false }) todayGlowElRef?: ElementRef<HTMLElement>;
  @ViewChild('reflectionBodyEl', { static: false }) reflectionBodyElRef?: ElementRef<HTMLElement>;
  @ViewChildren('dropColumnEl') dropColumnEls!: QueryList<ElementRef<HTMLElement>>;
  @ViewChild(TaskCardComponent, { static: false }) private _firstTaskCard?: TaskCardComponent;
  @ViewChildren(TaskCardComponent, { read: ElementRef }) taskCardEls!: QueryList<ElementRef<HTMLElement>>;
  @ViewChildren('todayClearEl') todayClearEls!: QueryList<ElementRef<HTMLElement>>;
  private ambientTweens: KillableTween[] = [];

  ngOnInit(): void {
    this.loadWeek();
    this.loadTodayJournal();
  }

  ngAfterViewInit(): void {
    this._startAmbientAnimations();
  }

  ngOnDestroy(): void {
    this.ambientTweens.forEach(t => t.kill());
    this.ambientTweens = [];
  }

  onAddTask(): void {
    this.router.navigate(['/tasks/new']);
  }

  loadWeek(): void {
    this.loading.set(true);
    const start = this.weekStart();
    const days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      return d;
    });

    const dayLabels = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

    forkJoin([
      this.taskSvc.list(),
      this.tagSvc.list(),
    ]).subscribe({
      next: ([tasks, tags]) => {
        this.tags.set(tags);
        this.columns.set(days.map((d, i) => {
          const dateStr = toLocalISO(d);
          const todayStr = toLocalISO(new Date());
          const dayTasks = tasks.filter(t => t.scheduledDay === dateStr);
          return {
            date: dateStr,
            label: dayLabels[i],
            dayNumber: d.getDate(),
            isToday: dateStr === todayStr,
            tasks: dayTasks,
            hadTasks: dayTasks.length > 0,
            allDone: dayTasks.length > 0 && dayTasks.every(task => task.status === 'done'),
          };
        }));
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  loadTodayJournal(): void {
    this.journalSvc.getByDate(this.today).subscribe({
      next:  entry => this.reflectionText.set(entry.achievements ?? ''),
      error: () => {},
    });
  }

  toggleReflection(): void {
    if (this.showReflection()) {
      if (this.reflectionBodyElRef?.nativeElement) {
        this.animSvc.animateReflectionClose(this.reflectionBodyElRef.nativeElement)
          .then(() => {
            this.showReflection.set(false);
            localStorage.setItem('reflectionPanelOpen', 'false');
          });
      } else {
        this.showReflection.set(false);
        localStorage.setItem('reflectionPanelOpen', 'false');
      }
    } else {
      this.showReflection.set(true);
      localStorage.setItem('reflectionPanelOpen', 'true');
      setTimeout(() => {
        if (this.reflectionBodyElRef?.nativeElement) {
          this.animSvc.animateReflectionOpen(this.reflectionBodyElRef.nativeElement);
        }
      });
    }
  }

  drop(event: CdkDragDrop<Task[]>, targetDate: string): void {
    if (event.previousContainer === event.container) {
      moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
      this.columns.update(cols => this.withColumnMeta(cols));
      const columnEl = this.dropColumnEls?.toArray()[this.columns().findIndex(col => col.date === targetDate)]?.nativeElement;
      if (columnEl) this.animSvc.animateDropColumnPulse(columnEl);
    } else {
      const task = event.previousContainer.data[event.previousIndex];
      transferArrayItem(event.previousContainer.data, event.container.data, event.previousIndex, event.currentIndex);
      this.columns.update(cols => this.withColumnMeta(cols));
      const columnEl = this.dropColumnEls?.toArray()[this.columns().findIndex(col => col.date === targetDate)]?.nativeElement;
      if (columnEl) this.animSvc.animateDropColumnPulse(columnEl);
      this.taskSvc.update(task.id, { scheduledDay: targetDate }).subscribe();
    }
  }

  onStatusChange(task: Task, newStatus: 'backlog' | 'in-progress' | 'done'): void {
    this.taskSvc.update(task.id, { status: newStatus }).subscribe(updated => {
      this.columns.update(cols => this.withColumnMeta(cols.map(col => ({
        ...col,
        tasks: col.tasks.map(t => t.id === updated.id ? updated : t),
      }))));
      this.toastSvc.show(newStatus === 'done' ? 'Task moved to Done' : 'Task reopened');
    });
  }

  saveReflection(): void {
    this.journalSvc.upsert(this.today, {
      mood: this.savedMood() ?? 'neutral',
      achievements: this.reflectionText(),
    }).subscribe(() => {
      this.toastSvc.show('Reflection saved');
    });
  }

  prevWeek(): void {
    const d = new Date(this.weekStart());
    d.setDate(d.getDate() - 7);
    this.weekStart.set(d);
    this.loadWeek();
  }

  nextWeek(): void {
    const d = new Date(this.weekStart());
    d.setDate(d.getDate() + 7);
    this.weekStart.set(d);
    this.loadWeek();
  }

  private getMonday(d: Date): Date {
    const date = new Date(d);
    const day = date.getDay();
    const diff = day === 0 ? -6 : 1 - day;
    date.setDate(date.getDate() + diff);
    return date;
  }

  getEmptyStateContext(date: string, hadTasks: boolean, allDone: boolean, now = new Date()): EmptyStateContext {
    const hour = now.getHours();
    const dayOfWeek = new Date(`${date}T12:00:00`).getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    const isPast = date < this.today;
    const isToday = date === this.today;

    if (isToday && allDone) {
      return {
        headline: "Today's clear.",
        subtext: 'You focused on what mattered.',
        showCta: false,
        isCelebration: true,
      };
    }

    if (isWeekend) {
      return {
        headline: 'Rest is part of the work.',
        subtext: 'Nothing scheduled. Good.',
        showCta: false,
      };
    }

    if (dayOfWeek === 1 && hour < 12) {
      return {
        headline: 'Start your week.',
        subtext: 'What needs your focus today?',
        showCta: true,
      };
    }

    if (dayOfWeek === 5 && hour >= 15) {
      return {
        headline: 'Light day ahead.',
        subtext: 'Use the space to wrap up or rest.',
        showCta: true,
      };
    }

    if (isPast && hadTasks && !allDone) {
      return {
        headline: "These didn't make it.",
        subtext: 'Move them forward or let them go.',
        showCta: false,
      };
    }

    return {
      headline: 'Nothing here yet',
      subtext: 'Drag a task from the backlog or create a new one.',
      showCta: true,
    };
  }

  get weekLabel(): string {
    const start = this.weekStart();
    return start.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  }

  private withColumnMeta(columns: DayColumn[]): DayColumn[] {
    return columns.map(col => ({
      ...col,
      hadTasks: col.hadTasks || col.tasks.length > 0,
      allDone: col.tasks.length > 0 && col.tasks.every(task => task.status === 'done'),
    }));
  }

  private _startAmbientAnimations(): void {
    const cols = this.columns();
    const todayIndex = cols.findIndex(c => c.isToday);

    // Stagger day numbers in (left-to-right; today uses elastic ease)
    const numberEntries = this.dayNumberEls.toArray().map((ref, i) => ({
      el: ref.nativeElement,
      isToday: i === todayIndex,
    }));
    this.animSvc.animateDayNumbers(numberEntries);

    // Task cards stagger in
    const cardEls = this.taskCardEls.toArray().map(r => r.nativeElement);
    if (cardEls.length > 0) this.animSvc.animateTaskCardsIn(cardEls);

    // Today glow ring
    if (this.todayGlowElRef?.nativeElement) {
      const glow = this.animSvc.startTodayGlow(this.todayGlowElRef.nativeElement);
      this.ambientTweens.push(glow);
    }

    // Today header color cycle
    if (todayIndex >= 0) {
      const todayLabelEl = this.dayLabelEls.toArray()[todayIndex];
      if (todayLabelEl) {
        const cycle = this.animSvc.startTodayHeaderCycle(todayLabelEl.nativeElement);
        this.ambientTweens.push(cycle);
      }
    }
  }
}
