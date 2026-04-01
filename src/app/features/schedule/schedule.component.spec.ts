import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
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
});
