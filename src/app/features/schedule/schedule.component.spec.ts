import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { ScheduleComponent } from './schedule.component';
import { TaskService } from '../../core/services/task.service';
import { TagService } from '../../core/services/tag.service';
import { JournalService } from '../../core/services/journal.service';
import { of, throwError } from 'rxjs';

describe('ScheduleComponent', () => {
  let fixture: ComponentFixture<ScheduleComponent>;
  let component: ScheduleComponent;
  let taskSvc: jasmine.SpyObj<TaskService>;
  let tagSvc: jasmine.SpyObj<TagService>;
  let journalSvc: jasmine.SpyObj<JournalService>;

  beforeEach(() => {
    // Reset localStorage before each test so state doesn't bleed between tests
    localStorage.removeItem('reflectionPanelOpen');

    taskSvc    = jasmine.createSpyObj('TaskService',    ['list', 'update']);
    tagSvc     = jasmine.createSpyObj('TagService',     ['list']);
    journalSvc = jasmine.createSpyObj('JournalService', ['getByDate', 'upsert']);

    taskSvc.list.and.returnValue(of([]));
    tagSvc.list.and.returnValue(of([]));
    journalSvc.getByDate.and.returnValue(throwError(() => ({ status: 404 })));

    TestBed.configureTestingModule({
      imports: [ScheduleComponent],
      providers: [
        provideRouter([]),
        provideNoopAnimations(),
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: TaskService,    useValue: taskSvc },
        { provide: TagService,     useValue: tagSvc },
        { provide: JournalService, useValue: journalSvc },
      ],
    });

    fixture   = TestBed.createComponent(ScheduleComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('creates 7 day columns on init', () => {
    expect(component.columns().length).toBe(7);
  });

  it('getMonday returns a Monday', () => {
    const monday = (component as any).getMonday(new Date('2026-03-25'));
    expect(monday.getDay()).toBe(1);
  });

  it('columns contain only tasks for that date', () => {
    const task = { id: '1', title: 'T', status: 'backlog' as const,
      scheduledDay: component.columns()[0].date, order: 0, tagIds: [], createdAt: '', updatedAt: '' };
    taskSvc.list.and.returnValue(of([task]));
    component.loadWeek();
    expect(component.columns()[0].tasks.length).toBe(1);
  });

  // ── Reflection toggle ──────────────────────────────────────────────────────

  it('showReflection defaults to true when localStorage key is absent', () => {
    expect(component.showReflection()).toBeTrue();
  });

  it('toggleReflection() flips showReflection signal', () => {
    component.toggleReflection();
    expect(component.showReflection()).toBeFalse();
    component.toggleReflection();
    expect(component.showReflection()).toBeTrue();
  });

  it('toggleReflection() persists state to localStorage', () => {
    component.toggleReflection(); // false
    expect(localStorage.getItem('reflectionPanelOpen')).toBe('false');
    component.toggleReflection(); // true
    expect(localStorage.getItem('reflectionPanelOpen')).toBe('true');
  });

  it('getEmptyStateContext returns isCelebration when today and allDone', () => {
    const result = component.getEmptyStateContext(component.today, true, true);
    expect(result.isCelebration).toBeTrue();
    expect(result.showCta).toBeFalse();
  });

  it('getEmptyStateContext does NOT return isCelebration for a past date that is all done', () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const dateStr = (component as any).toLocalISO(yesterday);
    const result = component.getEmptyStateContext(dateStr, true, true);
    expect(result.isCelebration).toBeFalsy();
  });

  it('getEmptyStateContext returns weekend copy on Saturday', () => {
    // 2026-02-07 is a Saturday
    const result = component.getEmptyStateContext('2026-02-07', false, false);
    expect(result.headline).toBe('Rest is part of the work.');
    expect(result.showCta).toBeFalse();
  });

  it('getEmptyStateContext returns Monday morning copy before noon', () => {
    // 2026-02-02 is a Monday; pass 10am as now
    const mondayMorning = new Date('2026-02-02T10:00:00');
    const result = component.getEmptyStateContext('2026-02-02', false, false, mondayMorning);
    expect(result.headline).toBe('Start your week.');
    expect(result.showCta).toBeTrue();
  });

  it('getEmptyStateContext returns Friday afternoon copy after 3pm', () => {
    // 2026-02-06 is a Friday; pass 4pm as now
    const fridayAfternoon = new Date('2026-02-06T16:00:00');
    const result = component.getEmptyStateContext('2026-02-06', false, false, fridayAfternoon);
    expect(result.headline).toBe('Light day ahead.');
    expect(result.showCta).toBeTrue();
  });

  it('getEmptyStateContext returns past-tasks copy for past day with incomplete tasks', () => {
    // Use a date that is definitely in the past
    const result = component.getEmptyStateContext('2020-01-01', true, false);
    expect(result.headline).toBe("These didn't make it.");
    expect(result.showCta).toBeFalse();
  });
});
