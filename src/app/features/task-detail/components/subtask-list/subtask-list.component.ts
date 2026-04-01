import { Component, Input, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DragDropModule, CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import { catchError, EMPTY } from 'rxjs';
import { TaskService } from '../../../../core/services/task.service';
import { Task } from '../../../../core/models/task.model';

@Component({
  selector: 'app-subtask-list',
  standalone: true,
  imports: [CommonModule, FormsModule, DragDropModule],
  templateUrl: './subtask-list.component.html',
})
export class SubtaskListComponent implements OnInit {
  @Input({ required: true }) taskId!: string;

  private taskSvc = inject(TaskService);

  subtasks      = signal<Task[]>([]);
  completedCount = computed(() => this.subtasks().filter(t => t.status === 'done').length);
  progress       = computed(() => this.subtasks().length ? this.completedCount() / this.subtasks().length : 0);

  newTitle     = '';
  showAddInput = false;

  ngOnInit(): void {
    this.taskSvc.list({ parentId: this.taskId }).subscribe(tasks => {
      const subtasks = tasks.filter(t => t.parentId === this.taskId);
      this.subtasks.set([...subtasks].sort((a, b) => a.order - b.order));
    });
  }

  toggle(task: Task): void {
    const previous  = this.subtasks();
    const newStatus = task.status === 'done' ? 'backlog' : 'done';
    this.subtasks.update(tasks =>
      tasks.map(t => t.id === task.id ? { ...t, status: newStatus } : t),
    );
    this.taskSvc.update(task.id, { status: newStatus }).pipe(
      catchError(() => { this.subtasks.set(previous); return EMPTY; }),
    ).subscribe();
  }

  add(): void {
    const title = this.newTitle.trim();
    if (!title) return;
    const order = this.subtasks().length > 0
      ? Math.max(...this.subtasks().map(s => s.order)) + 1
      : 0;
    this.taskSvc.create({ title, parentId: this.taskId, status: 'backlog', order }).subscribe(task => {
      this.subtasks.update(tasks => [...tasks, task]);
      this.newTitle     = '';
      this.showAddInput = false;
    });
  }

  delete(task: Task): void {
    const previous = this.subtasks();
    this.subtasks.update(tasks => tasks.filter(t => t.id !== task.id));
    this.taskSvc.delete(task.id).pipe(
      catchError(() => { this.subtasks.set(previous); return EMPTY; }),
    ).subscribe();
  }

  drop(event: CdkDragDrop<Task[]>): void {
    const previous = this.subtasks();
    const tasks    = [...this.subtasks()];
    moveItemInArray(tasks, event.previousIndex, event.currentIndex);
    this.subtasks.set(tasks);
    this.taskSvc.reorder({ parentId: this.taskId, orderedIds: tasks.map(t => t.id) }).pipe(
      catchError(() => { this.subtasks.set(previous); return EMPTY; }),
    ).subscribe();
  }
}
