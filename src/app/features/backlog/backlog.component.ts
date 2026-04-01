import {
  Component, inject, signal, computed, effect, DestroyRef, OnInit,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import {
  DragDropModule, CdkDragDrop, moveItemInArray,
} from '@angular/cdk/drag-drop';
import { Subject } from 'rxjs';
import { debounceTime } from 'rxjs/operators';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { TaskService } from '../../core/services/task.service';
import { TagService } from '../../core/services/tag.service';
import { StatsService, CompletionStats, TipCard } from '../../core/services/stats.service';
import { Task, TaskStatus } from '../../core/models/task.model';
import { Tag } from '../../core/models/tag.model';

export interface WeekDay {
  label: string;    // "Mon, Mar 30"
  isoDate: string;  // "2026-03-30"
  isToday: boolean;
}

@Component({
  selector: 'app-backlog',
  standalone: true,
  imports: [CommonModule, FormsModule, DragDropModule],
  templateUrl: './backlog.component.html',
})
export class BacklogComponent implements OnInit {
  private taskSvc  = inject(TaskService);
  private tagSvc   = inject(TagService);
  private statsSvc = inject(StatsService);
  private router   = inject(Router);
  private destroyRef = inject(DestroyRef);

  // ── State signals ──────────────────────────────────────────────────────────
  tasks          = signal<Task[]>([]);
  tags           = signal<Tag[]>([]);
  loading        = signal(false);
  searchQuery    = signal('');
  statusFilter   = signal<TaskStatus | 'all'>('all');
  tagFilter      = signal<string | null>(null);
  sortDir        = signal<'asc' | 'desc'>('asc');
  completionRate = signal<CompletionStats | null>(null);
  tipCard        = signal<TipCard | null>(null);

  private togglingIds = new Set<string>();
  private draggingTaskId = signal<string | null>(null);

  // ── Computed ───────────────────────────────────────────────────────────────
  weekDays = computed<WeekDay[]>(() => {
    const today    = new Date();
    const todayStr = this.toLocalISO(today);
    const monday   = this.getMonday(today);
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      const isoDate = this.toLocalISO(d);
      return {
        label:   d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
        isoDate,
        isToday: isoDate === todayStr,
      };
    });
  });

  weekDayIds = computed(() => this.weekDays().map(d => 'day-' + d.isoDate));

  readonly emptyTaskList: Task[] = [];

  // ── Search debounce ────────────────────────────────────────────────────────
  private searchSubject = new Subject<string>();

  constructor() {
    // Debounce search input → update signal → effect re-fetches
    this.searchSubject.pipe(
      debounceTime(300),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe(q => this.searchQuery.set(q as string));

    // TODO: migrate reactive fetch to resource() API when stabilizing patterns.
    effect(() => {
      const search = this.searchQuery();
      const status = this.statusFilter();
      const tagId  = this.tagFilter();
      const order  = this.sortDir();
      this.fetchTasks({ search, status, tagId, order });
    });
  }

  ngOnInit(): void {
    this.tagSvc.list()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(tags => this.tags.set(tags));

    this.statsSvc.getCompletion()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next:  stats => this.completionRate.set(stats),
        error: () => {},  // hide card silently on error
      });

    this.statsSvc.getTipCard()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next:  tip => this.tipCard.set(tip),
        error: () => {},  // hide card silently on error
      });
  }

  // ── Public helpers ─────────────────────────────────────────────────────────

  hasDependencies(task: Task): boolean {
    return task.hasDependencies === true;
  }

  tagById(id: string): Tag | undefined {
    return this.tags().find(t => t.id === id);
  }

  // ── Event handlers ─────────────────────────────────────────────────────────

  onSearchInput(value: string): void {
    this.searchSubject.next(value);
  }

  onStatusChipClick(status: TaskStatus | 'all'): void {
    if (status === 'all') {
      this.statusFilter.set('all');
      this.tagFilter.set(null);
    } else {
      this.statusFilter.set(status);
    }
  }

  onTagChipClick(tagId: string | null): void {
    this.tagFilter.set(tagId);
  }

  onToggleSort(): void {
    this.sortDir.update(d => d === 'asc' ? 'desc' : 'asc');
  }

  onRowClick(task: Task): void {
    this.router.navigate(['/tasks', task.id]);
  }

  onAddTask(): void {
    this.router.navigate(['/tasks/new']);
  }

  onStatusToggle(event: Event, task: Task): void {
    event.stopPropagation();
    if (this.togglingIds.has(task.id)) return;
    if (this.draggingTaskId() === task.id) return;
    this.togglingIds.add(task.id);
    const newStatus: TaskStatus = task.status === 'done' ? 'backlog' : 'done';
    this.tasks.update(list =>
      list.map(t => t.id === task.id ? { ...t, status: newStatus } : t)
    );
    this.taskSvc.update(task.id, { status: newStatus })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next:  () => this.togglingIds.delete(task.id),
        error: () => {
          this.togglingIds.delete(task.id);
          this.tasks.update(list =>
            list.map(t => t.id === task.id ? { ...t, status: task.status } : t)
          );
        },
      });
  }

  onDragStarted(task: Task): void {
    this.draggingTaskId.set(task.id);
  }

  onDragEnded(): void {
    this.draggingTaskId.set(null);
  }

  onTableDrop(event: CdkDragDrop<Task[]>): void {
    if (event.previousContainer === event.container) {
      const updated = [...this.tasks()];
      moveItemInArray(updated, event.previousIndex, event.currentIndex);
      this.tasks.set(updated);
    }
  }

  onDropToDay(event: CdkDragDrop<Task[]>, isoDate: string): void {
    if (event.previousContainer !== event.container) {
      const task = event.previousContainer.data[event.previousIndex];
      // Optimistic update: remove from list immediately
      this.tasks.update(ts => ts.filter(t => t.id !== task.id));
      this.taskSvc.update(task.id, { scheduledDay: isoDate }).subscribe({
        error: () => this.refetchTasks(),
      });
    }
  }

  // ── Private ────────────────────────────────────────────────────────────────

  private fetchTasks(params: {
    search: string;
    status: TaskStatus | 'all';
    tagId: string | null;
    order: 'asc' | 'desc';
  }): void {
    this.loading.set(true);
    this.taskSvc.list({
      search:  params.search  || undefined,
      status:  params.status  === 'all' ? undefined : params.status,
      tagId:   params.tagId   ?? undefined,
      sortBy:  'dueDate',
      order:   params.order,
    }).subscribe({
      next:  tasks => { this.tasks.set(tasks); this.loading.set(false); },
      error: ()    => this.loading.set(false),
    });
  }

  private refetchTasks(): void {
    this.fetchTasks({
      search: this.searchQuery(),
      status: this.statusFilter(),
      tagId:  this.tagFilter(),
      order:  this.sortDir(),
    });
  }

  private getMonday(d: Date): Date {
    const date = new Date(d);
    const day  = date.getDay();
    const diff = day === 0 ? -6 : 1 - day;
    date.setDate(date.getDate() + diff);
    return date;
  }

  /** Returns local-timezone ISO date string (YYYY-MM-DD) — avoids UTC offset bugs. */
  private toLocalISO(d: Date): string {
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  }
}
