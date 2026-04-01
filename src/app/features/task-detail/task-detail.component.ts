import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { forkJoin } from 'rxjs';
import { TaskService } from '../../core/services/task.service';
import { TagService } from '../../core/services/tag.service';
import { SessionService } from '../../core/services/session.service';
import { Task } from '../../core/models/task.model';
import { Tag } from '../../core/models/tag.model';
import { Session } from '../../core/models/session.model';
import { PomodoroTimerComponent } from './components/pomodoro-timer/pomodoro-timer.component';
import { SubtaskListComponent } from './components/subtask-list/subtask-list.component';
import { DependencyPanelComponent } from './components/dependency-panel/dependency-panel.component';

@Component({
  selector: 'app-task-detail',
  standalone: true,
  imports: [CommonModule, PomodoroTimerComponent, SubtaskListComponent, DependencyPanelComponent],
  templateUrl: './task-detail.component.html',
})
export class TaskDetailComponent implements OnInit {
  private route      = inject(ActivatedRoute);
  private taskSvc    = inject(TaskService);
  private tagSvc     = inject(TagService);
  private sessionSvc = inject(SessionService);
  readonly location  = inject(Location);

  task            = signal<Task | null>(null);
  tags            = signal<Tag[]>([]);
  openSession     = signal<Session | null>(null);
  taskId          = signal<string>('');
  editingDeadline = signal(false);
  today           = new Date();

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id')!;
    this.taskId.set(id);
    forkJoin({
      task:        this.taskSvc.get(id),
      tags:        this.tagSvc.list(),
      openSession: this.sessionSvc.getOpen(),
    }).subscribe({
      next: ({ task, tags, openSession }) => {
        this.task.set(task);
        this.tags.set(tags);
        this.openSession.set(openSession);
      },
      error: () => {},
    });
  }

  get taskTags(): Tag[] {
    const t = this.task();
    if (!t) return [];
    return this.tags().filter(tag => t.tagIds.includes(tag.id));
  }

  dueDateClass(dueDate: string | null | undefined): string {
    if (!dueDate) return 'text-outline';
    const today    = new Date().toISOString().slice(0, 10);
    const tomorrow = new Date(new Date().setDate(new Date().getDate() + 1)).toISOString().slice(0, 10);
    if (dueDate <= today)       return 'text-error';
    if (dueDate === tomorrow)   return 'text-warning';
    return 'text-primary';
  }

  formatDate(date: string | null | undefined): string {
    if (!date) return '—';
    return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }

  startEditDeadline(): void {
    this.editingDeadline.set(true);
  }

  saveDeadline(value: string): void {
    const newDate  = value || null;
    const previous = this.task();
    this.editingDeadline.set(false);
    if (newDate === (previous?.dueDate ?? null)) return;
    this.taskSvc.update(this.taskId(), { dueDate: newDate }).subscribe({
      next:  updated => this.task.set(updated),
      error: ()      => this.task.set(previous),
    });
  }

  cancelEditDeadline(): void {
    this.editingDeadline.set(false);
  }
}
