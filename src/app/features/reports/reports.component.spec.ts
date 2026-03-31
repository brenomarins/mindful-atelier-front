import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideCharts, withDefaultRegisterables } from 'ng2-charts';
import { of, throwError } from 'rxjs';
import { ReportsComponent } from './reports.component';
import { StatsService } from '../../core/services/stats.service';
import { TaskService } from '../../core/services/task.service';
import { TagService } from '../../core/services/tag.service';
import { JournalService } from '../../core/services/journal.service';
import { StatsResponse } from '../../core/models/stats.model';
import { Task } from '../../core/models/task.model';
import { Tag } from '../../core/models/tag.model';
import { JournalEntry } from '../../core/models/journal.model';

const MOCK_STATS: StatsResponse = {
  totalMinutesFocused: 2280,
  totalCompleted: 42,
  totalInterrupted: 5,
  completionRate: 0.88,
  weeklyTrend: [
    { label: 'Mon', hours: 3 }, { label: 'Tue', hours: 5 },
    { label: 'Wed', hours: 2 }, { label: 'Thu', hours: 4 },
    { label: 'Fri', hours: 6 }, { label: 'Sat', hours: 1 },
    { label: 'Sun', hours: 0.5 },
  ],
  taskStats: [
    { taskId: 'task-1', title: 'Design work', minutesFocused: 1020, completed: 17, interrupted: 2, started: 19 },
    { taskId: 'task-2', title: 'Code review',  minutesFocused: 680,  completed: 12, interrupted: 1, started: 13 },
  ],
  dailyFocus: [],
};

const MOCK_TASKS: Task[] = [
  { id: 'task-1', title: 'Design work', status: 'done',        order: 0, tagIds: ['tag-1'], createdAt: '', updatedAt: '' },
  { id: 'task-2', title: 'Code review', status: 'in-progress', order: 1, tagIds: ['tag-2'], createdAt: '', updatedAt: '' },
];

const MOCK_TAGS: Tag[] = [
  { id: 'tag-1', name: 'Studio Work',  color: '#00452e' },
  { id: 'tag-2', name: 'Engineering',  color: '#284cdb' },
];

const MOCK_ENTRIES: JournalEntry[] = [
  { date: new Date().toISOString().slice(0, 10), mood: 'great', createdAt: '', updatedAt: '' },
];

describe('ReportsComponent', () => {
  let fixture: ComponentFixture<ReportsComponent>;
  let component: ReportsComponent;
  let statsSvc:   jasmine.SpyObj<StatsService>;
  let taskSvc:    jasmine.SpyObj<TaskService>;
  let tagSvc:     jasmine.SpyObj<TagService>;
  let journalSvc: jasmine.SpyObj<JournalService>;

  beforeEach(() => {
    statsSvc   = jasmine.createSpyObj('StatsService',   ['getStats']);
    taskSvc    = jasmine.createSpyObj('TaskService',    ['list']);
    tagSvc     = jasmine.createSpyObj('TagService',     ['list']);
    journalSvc = jasmine.createSpyObj('JournalService', ['list']);

    statsSvc.getStats.and.returnValue(of(MOCK_STATS));
    taskSvc.list.and.returnValue(of(MOCK_TASKS));
    tagSvc.list.and.returnValue(of(MOCK_TAGS));
    journalSvc.list.and.returnValue(of(MOCK_ENTRIES));

    TestBed.configureTestingModule({
      imports: [ReportsComponent],
      schemas: [NO_ERRORS_SCHEMA],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        provideCharts(withDefaultRegisterables()),
        { provide: StatsService,   useValue: statsSvc   },
        { provide: TaskService,    useValue: taskSvc    },
        { provide: TagService,     useValue: tagSvc     },
        { provide: JournalService, useValue: journalSvc },
      ],
    });

    fixture   = TestBed.createComponent(ReportsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => { expect(component).toBeTruthy(); });
  it('calls getStats with "week" on init', () => { expect(statsSvc.getStats).toHaveBeenCalledWith('week'); });
  it('calls TaskService.list() on init', () => { expect(taskSvc.list).toHaveBeenCalled(); });
  it('calls TagService.list() on init', () => { expect(tagSvc.list).toHaveBeenCalled(); });
  it('calls JournalService.list() on init', () => { expect(journalSvc.list).toHaveBeenCalled(); });
  it('loading is false after successful data load', () => { expect(component.loading()).toBeFalse(); });
  it('error is null after successful data load', () => { expect(component.error()).toBeNull(); });
  it('focusScore computed correctly from completionRate (0.88 → 88)', () => { expect(component.focusScore()).toBe(88); });
  it('pomodoroCount matches totalCompleted', () => { expect(component.pomodoroCount()).toBe(42); });
  it('focusHours computed from totalMinutesFocused (2280 → 38)', () => { expect(component.focusHours()).toBe(38); });
  it('tagBreakdown groups taskStats by tag', () => {
    const breakdown = component.tagBreakdown();
    expect(breakdown.length).toBe(2);
    expect(breakdown.find(b => b.tagName === 'Studio Work')).toBeDefined();
  });
  it('moodByDay returns 7 entries', () => { expect(component.moodByDay().length).toBe(7); });
  it('sets error signal on load failure', fakeAsync(() => {
    statsSvc.getStats.and.returnValue(throwError(() => new Error('Network error')));
    component.retryLoad();
    tick();
    fixture.detectChanges();
    expect(component.error()).toBeTruthy();
  }));
  it('setFilter changes filterLabel signal', () => {
    component.setFilter('All Time', 'all');
    expect(component.filterLabel()).toBe('All Time');
  });
  it('setFilter changes filter signal', () => {
    component.setFilter('All Time', 'all');
    expect(component.filter()).toBe('all');
  });
  it('retryLoad re-calls getStats', () => {
    statsSvc.getStats.calls.reset();
    component.retryLoad();
    expect(statsSvc.getStats).toHaveBeenCalledTimes(1);
  });
});
