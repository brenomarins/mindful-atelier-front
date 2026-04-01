import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { of, throwError } from 'rxjs';
import { SubtaskListComponent } from './subtask-list.component';
import { TaskService } from '../../../../core/services/task.service';
import { Task } from '../../../../core/models/task.model';

describe('SubtaskListComponent', () => {
  let fixture: ComponentFixture<SubtaskListComponent>;
  let component: SubtaskListComponent;
  let taskSvc: jasmine.SpyObj<TaskService>;

  const makeTask = (overrides: Partial<Task> = {}): Task => ({
    id: 'sub-1', title: 'Subtask One', status: 'backlog',
    order: 0, tagIds: [], parentId: 'parent-1',
    scheduledDay: null, dueDate: null, createdAt: '', updatedAt: '',
    ...overrides,
  });

  beforeEach(() => {
    taskSvc = jasmine.createSpyObj('TaskService', ['list', 'update', 'create', 'delete', 'reorder']);
    taskSvc.list.and.returnValue(of([makeTask(), makeTask({ id: 'sub-2', title: 'Subtask Two', order: 1 })]));
    taskSvc.update.and.returnValue(of(makeTask({ status: 'done' })));
    taskSvc.create.and.returnValue(of(makeTask({ id: 'sub-3', title: 'New Task' })));
    taskSvc.delete.and.returnValue(of(undefined));
    taskSvc.reorder.and.returnValue(of(undefined));

    TestBed.configureTestingModule({
      imports: [SubtaskListComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: TaskService, useValue: taskSvc },
      ],
    });

    fixture = TestBed.createComponent(SubtaskListComponent);
    component = fixture.componentInstance;
    component.taskId = 'parent-1';
    fixture.detectChanges();
  });

  it('fetches subtasks by parentId on init', () => {
    expect(taskSvc.list).toHaveBeenCalledWith({ parentId: 'parent-1' });
    expect(component.subtasks().length).toBe(2);
  });

  it('filters out tasks belonging to other parents', () => {
    const foreignTask = { id: 'other-1', title: 'Other Parent Task', status: 'backlog' as const,
      order: 2, tagIds: [], parentId: 'other-parent', scheduledDay: null,
      dueDate: null, createdAt: '', updatedAt: '' };
    taskSvc.list.and.returnValue(of([
      { id: 'sub-1', title: 'Subtask One', status: 'backlog' as const, order: 0,
        tagIds: [], parentId: 'parent-1', scheduledDay: null, dueDate: null, createdAt: '', updatedAt: '' },
      foreignTask,
    ]));
    // Re-create the component so ngOnInit runs with the new spy
    fixture = TestBed.createComponent(SubtaskListComponent);
    component = fixture.componentInstance;
    component.taskId = 'parent-1';
    fixture.detectChanges();

    expect(component.subtasks().length).toBe(1);
    expect(component.subtasks()[0].id).toBe('sub-1');
  });

  it('sorts subtasks by order', () => {
    expect(component.subtasks()[0].order).toBeLessThanOrEqual(component.subtasks()[1].order);
  });

  it('completedCount reflects done tasks', () => {
    expect(component.completedCount()).toBe(0);
  });

  it('toggle() optimistically sets status to done', () => {
    const task = component.subtasks()[0];
    component.toggle(task);
    expect(component.subtasks()[0].status).toBe('done');
    expect(taskSvc.update).toHaveBeenCalledWith('sub-1', { status: 'done' });
  });

  it('toggle() reverts on API error', () => {
    taskSvc.update.and.returnValue(throwError(() => new Error('fail')));
    const task = component.subtasks()[0];
    const previousStatus = task.status;
    component.toggle(task);
    expect(component.subtasks()[0].status).toBe(previousStatus);
  });

  it('delete() optimistically removes the task', () => {
    const task = component.subtasks()[0];
    component.delete(task);
    expect(component.subtasks().find(t => t.id === 'sub-1')).toBeUndefined();
  });

  it('delete() reverts on API error', () => {
    taskSvc.delete.and.returnValue(throwError(() => new Error('fail')));
    const initial = component.subtasks().length;
    component.delete(component.subtasks()[0]);
    expect(component.subtasks().length).toBe(initial);
  });

  it('progress computed is fraction of completed tasks', () => {
    component['subtasks'].set([
      makeTask({ status: 'done' }),
      makeTask({ id: 'sub-2', status: 'backlog' }),
    ]);
    expect(component.progress()).toBe(0.5);
  });
});
