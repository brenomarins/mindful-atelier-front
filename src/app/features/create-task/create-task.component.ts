import { Component, computed, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Location } from '@angular/common';
import { Router } from '@angular/router';
import { CdkDragDrop, DragDropModule, moveItemInArray } from '@angular/cdk/drag-drop';
import { catchError, concatMap, EMPTY, from, toArray } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { TaskService } from '../../core/services/task.service';
import { TagService } from '../../core/services/tag.service';
import { CreateTaskRequest } from '../../core/models/task.model';
import { Tag } from '../../core/models/tag.model';

export interface SubtaskDraft {
  title: string;
}

@Component({
  selector: 'app-create-task',
  standalone: true,
  imports: [FormsModule, DragDropModule],
  templateUrl: './create-task.component.html',
})
export class CreateTaskComponent implements OnInit {
  private taskSvc    = inject(TaskService);
  private tagSvc     = inject(TagService);
  private router     = inject(Router);
  private location   = inject(Location);
  private destroyRef = inject(DestroyRef);

  // ── Form state ──────────────────────────────────────────────────────────────
  title          = signal('');
  description    = signal('');
  scheduledDay   = signal<string | null>(null);
  dueDate        = signal<string | null>(null);
  selectedTagIds = signal<string[]>([]);
  subtasks       = signal<SubtaskDraft[]>([]);

  // ── Data ────────────────────────────────────────────────────────────────────
  tags = signal<Tag[]>([]);

  // ── UI state ────────────────────────────────────────────────────────────────
  saving   = signal(false);
  error    = signal<string | null>(null);
  tagError = signal<string | null>(null);

  // ── Inline tag creation ─────────────────────────────────────────────────────
  newTagName  = signal('');
  newTagColor = signal('#6366f1');
  showTagForm = signal(false);

  readonly PRESET_COLORS = [
    '#00452e', '#284cdb', '#593300', '#b91c1c',
    '#0369a1', '#7c3aed', '#0f766e', '#a16207',
  ];

  // ── Computed ────────────────────────────────────────────────────────────────
  canSave = computed(() => this.title().trim().length > 0 && !this.saving());

  // ── Lifecycle ───────────────────────────────────────────────────────────────
  ngOnInit(): void {
    this.tagSvc.list()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(tags => this.tags.set(tags));
  }

  // ── Subtask management (stubs) ───────────────────────────────────────────────
  addSubtask(): void {}
  updateSubtask(_index: number, _title: string): void {}
  removeSubtask(_index: number): void {}
  onSubtaskDrop(_event: CdkDragDrop<SubtaskDraft[]>): void {}

  // ── Tag picker (stubs) ──────────────────────────────────────────────────────
  toggleTag(_id: string): void {}
  createTag(): void {}

  // ── Save / navigation (stubs) ───────────────────────────────────────────────
  save(): void {}
  discard(): void {}
}
