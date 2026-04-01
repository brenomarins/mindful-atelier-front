import { Component, Input, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { forkJoin, of, catchError, EMPTY } from 'rxjs';
import { map } from 'rxjs/operators';
import { DependencyService } from '../../../../core/services/dependency.service';
import { TaskService } from '../../../../core/services/task.service';
import { Task } from '../../../../core/models/task.model';

interface DepEntry {
  depId: string;
  task:  Task;
}

@Component({
  selector: 'app-dependency-panel',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './dependency-panel.component.html',
})
export class DependencyPanelComponent implements OnInit {
  @Input({ required: true }) taskId!: string;

  private depSvc  = inject(DependencyService);
  private taskSvc = inject(TaskService);
  private router  = inject(Router);

  prerequisites = signal<DepEntry[]>([]);
  dependents    = signal<DepEntry[]>([]);
  searchQuery   = signal<string>('');
  showSearch    = signal<boolean>(false);
  private allTasks = signal<Task[]>([]);

  searchResults = computed(() =>
    this.allTasks().filter(t =>
      t.title.toLowerCase().includes(this.searchQuery().toLowerCase()) &&
      t.id !== this.taskId &&
      !this.prerequisites().some(p => p.task.id === t.id),
    ),
  );

  ngOnInit(): void {
    this.loadDependencies();
    this.taskSvc.list({ status: 'backlog' }).subscribe(tasks => this.allTasks.set(tasks));
  }

  private loadDependencies(): void {
    this.depSvc.getForTask(this.taskId).subscribe(summary => {
      const resolveEntries = (entries: { id: string; taskId: string }[]) =>
        entries.length > 0
          ? forkJoin(entries.map(e => this.taskSvc.get(e.taskId).pipe(catchError(() => of(null))))).pipe(
              map(tasks => entries
                .map((e, i) => tasks[i] ? { depId: e.id, task: tasks[i]! } : null)
                .filter((x): x is DepEntry => x !== null),
              ),
            )
          : of([] as DepEntry[]);

      forkJoin({
        prerequisites: resolveEntries(summary.prerequisites),
        dependents:    resolveEntries(summary.dependents),
      }).subscribe(({ prerequisites, dependents }) => {
        this.prerequisites.set(prerequisites);
        this.dependents.set(dependents);
      });
    });
  }

  removePrerequisite(depId: string): void {
    const previous = this.prerequisites();
    this.prerequisites.update(list => list.filter(p => p.depId !== depId));
    this.depSvc.delete(depId).pipe(
      catchError(() => { this.prerequisites.set(previous); return EMPTY; }),
    ).subscribe();
  }

  addPrerequisite(selectedTask: Task): void {
    this.depSvc.create({ prerequisiteId: selectedTask.id, dependentId: this.taskId })
      .subscribe(result => {
        this.prerequisites.update(list => [...list, { depId: result.id, task: selectedTask }]);
        this.searchQuery.set('');
        this.showSearch.set(false);
      });
  }

  navigateToDependent(task: Task): void {
    this.router.navigate(['/tasks', task.id]);
  }
}
