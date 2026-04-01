# Mindful Atelier — Architecture Reference

## Tech Stack
| Concern | Choice |
|---|---|
| Framework | Angular 20 (standalone components) |
| State | Angular Signals (`signal`, `computed`, `effect`) |
| HTTP | `HttpClient` via `provideHttpClient(withFetch())` |
| Styling | Tailwind CSS 3 (Chronos & Calm theme) |
| Drag & Drop | `@angular/cdk/drag-drop` |
| Icons | Material Symbols Outlined (Google Fonts) |
| Typography | Manrope (headlines), Work Sans (body) |
| Testing | Jasmine + Karma |

## Backend
Base URL: `http://localhost:8091`
All HTTP calls go through services in `src/app/core/services/`.
Full API spec: `E:\codigos\plan\docs\superpowers\specs\2026-03-25-mindful-atelier-backend-spec-design.md`

## Project Structure
```
src/app/
├── core/
│   ├── models/          # TypeScript interfaces (task.model.ts, etc.)
│   └── services/        # HttpClient services (task.service.ts, etc.)
├── shared/
│   └── components/      # Reusable UI (side-nav, task-card, mood-selector)
├── features/
│   ├── schedule/        # Weekly Schedule page
│   ├── backlog/         # Task Backlog page
│   ├── task-detail/     # Task Detail + Pomodoro page
│   ├── dependencies/    # Dependencies Canvas page
│   ├── journal/         # Daily Journal page
│   └── reports/         # Reports & Insights page
├── app.routes.ts        # Root router (lazy-loaded features)
├── app.config.ts        # provideRouter + provideHttpClient
└── app.ts               # Root shell (SideNav + router-outlet)
```

## Design System (Chronos & Calm)

### The "No-Line" Rule
**Never use 1px solid borders for structure.** Use background color shifts instead.

### Surface Hierarchy
| Token | Hex | Usage |
|---|---|---|
| `surface` / `background` | `#f8f9fa` | Page background |
| `surface-container-low` | `#f3f4f5` | Sidebar, alternating day columns |
| `surface-container-lowest` | `#ffffff` | Task cards, input fields |
| `surface-dim` | `#d9dadb` | Done tasks (visually sunk) |

### Key Colors
| Token | Hex | Usage |
|---|---|---|
| `primary` | `#00452e` | Brand color, active states |
| `on-primary` | `#ffffff` | Text on primary bg |
| `secondary` | `#284cdb` | In-progress accent, chip highlights |
| `tertiary` | `#593300` | Journal / reflective features |
| `tertiary-fixed` | `#ffdcbc` | Journal page background |
| `on-surface` | `#191c1d` | Default text (never pure black) |
| `outline-variant` | `#c2c8bf` | Ghost borders (accessibility only, 20% opacity) |

### Typography
- **Manrope** — headlines, display text, dates, page titles (`font-headline`)
- **Work Sans** — body text, labels, task titles, nav items (`font-body`, `font-label`)

### Border Radius
- `rounded-xl` (0.5rem) — cards, panels
- `rounded-full` (9999px) — buttons, chips (pill shape)
- `rounded-lg` (0.25rem) — small chips, tags

### Task Status Indicators
| Status | Visual Treatment |
|---|---|
| `backlog` | No accent, `circle` icon (outlined) |
| `in-progress` | 4px left border `border-secondary`, `sync` icon |
| `done` | `opacity-60`, `bg-surface-dim/40`, `line-through` text, filled `check_circle` icon |

## Key Patterns

### Signals (reactive state)
```typescript
// Declare in component
tasks = signal<Task[]>([]);
weekTasks = computed(() => this.tasks().filter(t => t.scheduledDay === this.today));

// Correct way to bind a Signal in ngModel (not two-way binding):
// [ngModel]="mySignal()" (ngModelChange)="mySignal.set($event)"
```

### CDK Drag & Drop (schedule)
```typescript
drop(event: CdkDragDrop<Task[]>, targetDate: string) {
  if (event.previousContainer === event.container) {
    moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
  } else {
    const task = event.previousContainer.data[event.previousIndex];
    transferArrayItem(...);
    this.taskService.update(task.id, { scheduledDay: targetDate }).subscribe();
  }
}
```

### Testing (Angular 20 pattern)
```typescript
// Use provideHttpClient + provideHttpClientTesting instead of HttpClientTestingModule (deprecated)
TestBed.configureTestingModule({
  providers: [provideHttpClient(), provideHttpClientTesting()],
});

// Use provideRouter([]) instead of RouterTestingModule (removed in Angular 17+)
TestBed.configureTestingModule({
  imports: [MyComponent],
  providers: [provideRouter([])],
});
```
