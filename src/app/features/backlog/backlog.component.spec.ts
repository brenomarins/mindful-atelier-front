import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter, Router } from '@angular/router';
import { BacklogComponent } from './backlog.component';
import { TaskService } from '../../core/services/task.service';
import { TagService } from '../../core/services/tag.service';
import { StatsService } from '../../core/services/stats.service';
import { of, throwError } from 'rxjs';
import { Task } from '../../core/models/task.model';
import { Tag } from '../../core/models/tag.model';

const MOCK_TASKS: Task[] = [
  {
    id: '1', title: 'Design Catalog', status: 'in-progress',
    order: 0, tagIds: ['tag-1'], scheduledDay: null, dueDate: '2026-04-01',
    createdAt: '', updatedAt: '', hasDependencies: true,
  },
  {
    id: '2', title: 'Finance Review', status: 'backlog',
    order: 1, tagIds: [], scheduledDay: null, dueDate: '2026-04-05',
    createdAt: '', updatedAt: '', hasDependencies: false,
  },
  {
    id: '3', title: 'Draft Statement', status: 'done',
    order: 2, tagIds: [], scheduledDay: null, dueDate: '2026-03-20',
    createdAt: '', updatedAt: '',
  },
];

const MOCK_TAGS: Tag[] = [
  { id: 'tag-1', name: 'Studio', color: '#ffdcbc' },
];

describe('BacklogComponent', () => {
  let fixture: ComponentFixture<BacklogComponent>;
  let component: BacklogComponent;
  let taskSvc: jasmine.SpyObj<TaskService>;
  let tagSvc: jasmine.SpyObj<TagService>;
  let statsSvc: jasmine.SpyObj<StatsService>;
  let router: Router;

  beforeEach(() => {
    taskSvc  = jasmine.createSpyObj('TaskService',  ['list', 'update']);
    tagSvc   = jasmine.createSpyObj('TagService',   ['list']);
    statsSvc = jasmine.createSpyObj('StatsService', ['getCompletion', 'getTipCard']);

    taskSvc.list.and.returnValue(of(MOCK_TASKS));
    tagSvc.list.and.returnValue(of(MOCK_TAGS));
    statsSvc.getCompletion.and.returnValue(throwError(() => ({ status: 503 })));
    statsSvc.getTipCard.and.returnValue(throwError(() => ({ status: 503 })));

    TestBed.configureTestingModule({
      imports: [BacklogComponent],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: TaskService,  useValue: taskSvc  },
        { provide: TagService,   useValue: tagSvc   },
        { provide: StatsService, useValue: statsSvc },
      ],
    });

    fixture   = TestBed.createComponent(BacklogComponent);
    component = fixture.componentInstance;
    router    = TestBed.inject(Router);
    fixture.detectChanges();
  });

  it('loads tasks on init', () => {
    expect(component.tasks().length).toBe(3);
    expect(taskSvc.list).toHaveBeenCalled();
  });

  it('loads tags on init', () => {
    expect(component.tags().length).toBe(1);
    expect(tagSvc.list).toHaveBeenCalled();
  });

  it('navigates to /tasks/:id on row click', () => {
    spyOn(router, 'navigate');
    component.onRowClick(MOCK_TASKS[0]);
    expect(router.navigate).toHaveBeenCalledWith(['/tasks', '1']);
  });

  it('onAddTask navigates to /tasks/new', () => {
    spyOn(router, 'navigate');
    component.onAddTask();
    expect(router.navigate).toHaveBeenCalledWith(['/tasks/new']);
  });

  it('onStatusChipClick updates statusFilter signal', () => {
    component.onStatusChipClick('in-progress');
    expect(component.statusFilter()).toBe('in-progress');
  });

  it('onTagChipClick updates tagFilter signal', () => {
    component.onTagChipClick('tag-1');
    expect(component.tagFilter()).toBe('tag-1');
  });

  it('status and tag filters are independent (both can be active)', () => {
    component.onStatusChipClick('backlog');
    component.onTagChipClick('tag-1');
    expect(component.statusFilter()).toBe('backlog');
    expect(component.tagFilter()).toBe('tag-1');
  });

  it('onStatusChipClick("all") clears both filters', () => {
    component.onStatusChipClick('backlog');
    component.onTagChipClick('tag-1');
    component.onStatusChipClick('all');
    expect(component.statusFilter()).toBe('all');
    expect(component.tagFilter()).toBeNull();
  });

  it('onTagChipClick(null) clears tag filter', () => {
    component.onTagChipClick('tag-1');
    component.onTagChipClick(null);
    expect(component.tagFilter()).toBeNull();
  });

  it('onToggleSort toggles sortDir between asc and desc', () => {
    expect(component.sortDir()).toBe('asc');
    component.onToggleSort();
    expect(component.sortDir()).toBe('desc');
    component.onToggleSort();
    expect(component.sortDir()).toBe('asc');
  });

  it('hasDependencies indicator: task with hasDependencies=true shows indicator', () => {
    expect(component.hasDependencies(MOCK_TASKS[0])).toBeTrue();
    expect(component.hasDependencies(MOCK_TASKS[1])).toBeFalse();
  });

  it('weekDays computed returns 7 days starting from Monday', () => {
    expect(component.weekDays().length).toBe(7);
  });

  it('onStatusToggle marks a non-done task as done (optimistic)', () => {
    taskSvc.update.and.returnValue(of({
      ...MOCK_TASKS[1], status: 'done' as const,
    }));
    component.onStatusToggle(new MouseEvent('click'), MOCK_TASKS[1]);
    expect(taskSvc.update).toHaveBeenCalledWith('2', { status: 'done' });
    expect(component.tasks().find(t => t.id === '2')!.status).toBe('done');
  });

  it('onStatusToggle marks a done task as backlog', () => {
    taskSvc.update.and.returnValue(of({
      ...MOCK_TASKS[2], status: 'backlog' as const,
    }));
    component.onStatusToggle(new MouseEvent('click'), MOCK_TASKS[2]);
    expect(taskSvc.update).toHaveBeenCalledWith('3', { status: 'backlog' });
    expect(component.tasks().find(t => t.id === '3')!.status).toBe('backlog');
  });

  it('onStatusToggle reverts optimistic update on API error', () => {
    taskSvc.update.and.returnValue(throwError(() => ({ status: 500 })));
    component.onStatusToggle(new MouseEvent('click'), MOCK_TASKS[0]);
    // After error: status should revert to original 'in-progress'
    expect(component.tasks().find(t => t.id === '1')!.status).toBe('in-progress');
  });

  it('onStatusToggle stops propagation so onRowClick does not fire', () => {
    taskSvc.update.and.returnValue(of({ ...MOCK_TASKS[0], status: 'done' as const }));
    spyOn(router, 'navigate');
    const event = new MouseEvent('click');
    spyOn(event, 'stopPropagation');
    component.onStatusToggle(event, MOCK_TASKS[0]);
    expect(event.stopPropagation).toHaveBeenCalled();
    expect(router.navigate).not.toHaveBeenCalled();
  });
});
