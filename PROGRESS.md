# Mindful Atelier — Implementation Progress

Update the status column as each page/feature is completed.

| Feature | Status | Notes |
|---|---|---|
| Project Scaffold | ✅ Done | Angular 20, Tailwind 3, Chronos & Calm theme, app shell |
| Core Services | ✅ Done | TaskService, TagService, SessionService, JournalService, DependencyService |
| Shared Components | ✅ Done | SideNav, TaskCard, MoodSelector |
| Weekly Schedule | ✅ Done | 7-day grid, CDK drag-drop, daily reflection strip |
| Task Backlog | ✅ Done | Table with dep indicators, combined status+tag filters, search, sort, Quick Schedule CDK drag-drop |
| Create New Task | ✅ Done | Full page form: title, description, subtasks (CDK drag-drop), dates, tags (inline create), non-functional dependencies placeholder |
| Task Detail | ✅ Done | Pomodoro timer (session resume, stats), subtask CRUD + drag-drop, dependency panel (add/remove prerequisites), read-only task hero |
| Dependencies Canvas | ⬜ Not Started | SVG graph, draggable nodes, canvas positions |
| Daily Journal | ✅ Done | Mood selector (inline 5-point scale), achievements/difficulties textareas, date navigation (prev/next, future dates blocked), Save Draft (stays on page) + Complete Reflection (navigates to /schedule). Signals-based state, effect() for reactive date loading, takeUntilDestroyed on all subscriptions, inline error handling (404 = silent reset, other errors = inline message). |
| Reports | ⬜ Not Started | Doughnut (tag allocation), line chart (mood trend), focus score |

## Status Key
- ⬜ Not Started
- 🔄 In Progress
- ✅ Done

## Implementation Order
Pages are implemented one at a time. Current: **Dependencies Canvas**.
See `E:\codigos\plan\docs\superpowers\plans\2026-03-25-mindful-atelier-frontend.md` for the full plan.
