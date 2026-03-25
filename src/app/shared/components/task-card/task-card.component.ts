import { Component, Input, Output, EventEmitter } from '@angular/core';
import { Task } from '../../../core/models/task.model';
import { Tag } from '../../../core/models/tag.model';

@Component({
  selector: 'app-task-card',
  standalone: true,
  templateUrl: './task-card.component.html',
})
export class TaskCardComponent {
  @Input({ required: true }) task!: Task;
  @Input() tags: Tag[] = [];
  @Output() statusChange = new EventEmitter<'backlog' | 'in-progress' | 'done'>();
  @Output() cardClick = new EventEmitter<Task>();

  get taskTags(): Tag[] {
    return this.tags.filter(t => this.task.tagIds.includes(t.id));
  }

  get isDone(): boolean { return this.task.status === 'done'; }
  get isInProgress(): boolean { return this.task.status === 'in-progress'; }

  get statusIcon(): string {
    if (this.isDone) return 'check_circle';
    if (this.isInProgress) return 'sync';
    return 'circle';
  }

  get cardClasses(): string {
    if (this.isDone) return 'bg-surface-dim/40 opacity-60';
    return 'bg-surface-container-lowest shadow-sm hover:-translate-y-0.5 transition-all duration-150';
  }

  get leftBorder(): string {
    return this.isInProgress ? 'border-l-4 border-secondary' : '';
  }

  toggleStatus(): void {
    const next = this.isDone ? 'backlog' : this.isInProgress ? 'done' : 'in-progress';
    this.statusChange.emit(next);
  }
}
