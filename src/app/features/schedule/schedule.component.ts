import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { DragDropModule, CdkDragDrop, moveItemInArray, transferArrayItem } from '@angular/cdk/drag-drop';
import { forkJoin } from 'rxjs';
import { TaskService } from '../../core/services/task.service';
import { TagService } from '../../core/services/tag.service';
import { JournalService } from '../../core/services/journal.service';
import { Task } from '../../core/models/task.model';
import { Tag } from '../../core/models/tag.model';
import { Mood } from '../../core/models/journal.model';
import { TaskCardComponent } from '../../shared/components/task-card/task-card.component';

export interface DayColumn {
  date: string;
  label: string;
  dayNumber: number;
  isToday: boolean;
  tasks: Task[];
}

@Component({
  selector: 'app-schedule',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, DragDropModule, TaskCardComponent],
  templateUrl: './schedule.component.html',
})
export class ScheduleComponent implements OnInit {
  private taskSvc    = inject(TaskService);
  private tagSvc     = inject(TagService);
  private journalSvc = inject(JournalService);

  tags      = signal<Tag[]>([]);
  columns   = signal<DayColumn[]>([]);
  weekStart = signal<Date>(this.getMonday(new Date()));

  // Daily Reflection
  today          = new Date().toISOString().slice(0, 10);
  reflectionText = signal('');
  savedMood      = signal<Mood | null>(null);
  showReflection = signal(localStorage.getItem('reflectionPanelOpen') !== 'false');

  dropListIds = computed(() => this.columns().map(c => `drop-${c.date}`));

  ngOnInit(): void {
    this.loadWeek();
    this.loadTodayJournal();
  }

  loadWeek(): void {
    const start = this.weekStart();
    const days  = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      return d;
    });

    const dayLabels = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'];

    forkJoin([
      this.taskSvc.list(),
      this.tagSvc.list(),
    ]).subscribe(([tasks, tags]) => {
      this.tags.set(tags);
      this.columns.set(days.map((d, i) => {
        const dateStr  = d.toISOString().slice(0, 10);
        const todayStr = new Date().toISOString().slice(0, 10);
        return {
          date:      dateStr,
          label:     dayLabels[i],
          dayNumber: d.getDate(),
          isToday:   dateStr === todayStr,
          tasks:     tasks.filter(t => t.scheduledDay === dateStr),
        };
      }));
    });
  }

  loadTodayJournal(): void {
    this.journalSvc.getByDate(this.today).subscribe({
      next:  entry => this.reflectionText.set(entry.achievements ?? ''),
      error: () => {},
    });
  }

  toggleReflection(): void {
    const next = !this.showReflection();
    this.showReflection.set(next);
    localStorage.setItem('reflectionPanelOpen', String(next));
  }

  drop(event: CdkDragDrop<Task[]>, targetDate: string): void {
    if (event.previousContainer === event.container) {
      moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
    } else {
      const task = event.previousContainer.data[event.previousIndex];
      transferArrayItem(event.previousContainer.data, event.container.data, event.previousIndex, event.currentIndex);
      this.taskSvc.update(task.id, { scheduledDay: targetDate }).subscribe();
    }
  }

  onStatusChange(task: Task, newStatus: 'backlog' | 'in-progress' | 'done'): void {
    this.taskSvc.update(task.id, { status: newStatus }).subscribe(updated => {
      this.columns.update(cols => cols.map(col => ({
        ...col,
        tasks: col.tasks.map(t => t.id === updated.id ? updated : t),
      })));
    });
  }

  saveReflection(): void {
    this.journalSvc.upsert(this.today, {
      mood: this.savedMood() ?? 'neutral',
      achievements: this.reflectionText(),
    }).subscribe();
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
    const day  = date.getDay();
    const diff = (day === 0 ? -6 : 1 - day);
    date.setDate(date.getDate() + diff);
    return date;
  }

  get weekLabel(): string {
    const start = this.weekStart();
    return start.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  }
}
