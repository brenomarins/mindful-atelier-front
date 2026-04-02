import {
  Component, Input, Output, EventEmitter, ViewChild, ElementRef,
  OnInit, inject,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { Task } from '../../../core/models/task.model';
import { Tag } from '../../../core/models/tag.model';
import { AnimationService } from '../../services/animation.service';

@Component({
  selector: 'app-task-card',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './task-card.component.html',
})
export class TaskCardComponent implements OnInit {
  @Input({ required: true }) task!: Task;
  @Input() tags: Tag[] = [];
  @Output() statusChange = new EventEmitter<'backlog' | 'in-progress' | 'done'>();
  @Output() cardClick = new EventEmitter<Task>();

  @ViewChild('cardEl',     { static: true }) cardElRef!: ElementRef<HTMLElement>;
  @ViewChild('checkboxEl', { static: true }) checkboxElRef!: ElementRef<HTMLElement>;
  @ViewChild('titleEl',    { static: true }) titleElRef!: ElementRef<HTMLElement>;
  @ViewChild('strikeEl',   { static: true }) strikeElRef!: ElementRef<HTMLElement>;

  private animSvc = inject(AnimationService);

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
    if (this.isDone) {
      return 'task-card--done bg-surface-dim/40 shadow-sm';
    }
    return 'bg-surface-container-lowest shadow-sm';
  }

  get leftBorder(): string {
    return this.isInProgress ? 'border-l-4 border-secondary' : '';
  }

  ngOnInit(): void {
    // Set strikethrough immediately for cards that are already done on render
    if (this.isDone && this.strikeElRef?.nativeElement) {
      this.strikeElRef.nativeElement.style.width = '100%';
    }
  }

  onCheckboxChange(checked: boolean): void {
    if (checked) {
      this.animSvc.animateTaskCompletion(
        this.checkboxElRef.nativeElement,
        this.titleElRef.nativeElement,
        this.strikeElRef.nativeElement,
        this.cardElRef.nativeElement,
      );
    } else {
      this.animSvc.animateTaskUncompletion(
        this.titleElRef.nativeElement,
        this.strikeElRef.nativeElement,
        this.cardElRef.nativeElement,
      );
    }
    this.statusChange.emit(checked ? 'done' : 'backlog');
  }

  onHoverIn(): void {
    if (!this.isDone) {
      this.animSvc.animateCardHoverIn(this.cardElRef.nativeElement);
    }
  }

  onHoverOut(): void {
    if (!this.isDone) {
      this.animSvc.animateCardHoverOut(this.cardElRef.nativeElement);
    }
  }
}
