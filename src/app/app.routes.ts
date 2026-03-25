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
  { path: '**', redirectTo: 'schedule' },
];
