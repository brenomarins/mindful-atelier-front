import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { ActivatedRoute } from '@angular/router';
import { of } from 'rxjs';
import { TaskDetailComponent } from './task-detail.component';
import { TaskService } from '../../core/services/task.service';
import { TagService } from '../../core/services/tag.service';
import { SessionService } from '../../core/services/session.service';
import { DependencyService } from '../../core/services/dependency.service';

describe('TaskDetailComponent', () => {
  let fixture: ComponentFixture<TaskDetailComponent>;
  let component: TaskDetailComponent;
  let taskSvc: jasmine.SpyObj<TaskService>;
  let tagSvc: jasmine.SpyObj<TagService>;
  let sessionSvc: jasmine.SpyObj<SessionService>;
  let depSvc: jasmine.SpyObj<DependencyService>;

  const mockTask = {
    id: 'task-1', title: 'Write Tests', description: 'Test all the things',
    status: 'in-progress' as const, order: 0, tagIds: [], parentId: null,
    scheduledDay: null, dueDate: '2026-03-27', createdAt: '', updatedAt: '',
  };

  beforeEach(() => {
    taskSvc    = jasmine.createSpyObj('TaskService',   ['get', 'list']);
    tagSvc     = jasmine.createSpyObj('TagService',    ['list']);
    sessionSvc = jasmine.createSpyObj('SessionService', ['getOpen', 'listByTask']);
    depSvc     = jasmine.createSpyObj('DependencyService', ['getForTask', 'create', 'delete']);

    taskSvc.get.and.returnValue(of(mockTask));
    tagSvc.list.and.returnValue(of([]));
    taskSvc.list.and.returnValue(of([]));
    sessionSvc.getOpen.and.returnValue(of(null));
    sessionSvc.listByTask.and.returnValue(of([]));
    depSvc.getForTask.and.returnValue(of({ taskId: 'task-1', prerequisites: [], dependents: [] }));

    TestBed.configureTestingModule({
      imports: [TaskDetailComponent],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: TaskService,       useValue: taskSvc },
        { provide: TagService,        useValue: tagSvc },
        { provide: SessionService,    useValue: sessionSvc },
        { provide: DependencyService, useValue: depSvc },
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { paramMap: { get: () => 'task-1' } } },
        },
      ],
    });

    fixture   = TestBed.createComponent(TaskDetailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('fetches task on init and sets task signal', () => {
    expect(taskSvc.get).toHaveBeenCalledWith('task-1');
    expect(component.task()).toEqual(mockTask);
  });

  it('dueDateClass returns text-error for past date', () => {
    expect(component.dueDateClass('2020-01-01')).toBe('text-error');
  });

  it('dueDateClass returns text-outline for null dueDate', () => {
    expect(component.dueDateClass(null)).toBe('text-outline');
  });

  it('dueDateClass returns text-primary for future date', () => {
    expect(component.dueDateClass('2099-12-31')).toBe('text-primary');
  });
});
