import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', redirectTo: 'schedule', pathMatch: 'full' },
  {
    path: 'schedule',
    loadComponent: () =>
      import('./features/schedule/schedule.component').then(m => m.ScheduleComponent),
  },
  {
    path: 'backlog',
    loadComponent: () =>
      import('./features/backlog/backlog.component').then(m => m.BacklogComponent),
  },
  {
    path: 'journal',
    loadComponent: () =>
      import('./features/journal/journal.component').then(m => m.JournalComponent),
  },
  {
    path: 'reports',
    loadComponent: () =>
      import('./features/reports/reports.component').then(m => m.ReportsComponent),
  },
  {
    path: 'dependencies',
    loadComponent: () =>
      import('./features/dependencies/dependencies.component').then(m => m.DependenciesComponent),
  },
  {
    path: 'tasks/new',
    loadComponent: () =>
      import('./features/create-task/create-task.component')
        .then(m => m.CreateTaskComponent),
  },
  {
    path: 'tasks/:id',
    loadComponent: () =>
      import('./features/task-detail/task-detail.component').then(m => m.TaskDetailComponent),
  },
  { path: '**', redirectTo: 'schedule' },
];
