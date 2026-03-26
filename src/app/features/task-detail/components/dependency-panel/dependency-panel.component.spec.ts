import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { DependencyPanelComponent } from './dependency-panel.component';
import { DependencyService } from '../../../../core/services/dependency.service';
import { TaskService } from '../../../../core/services/task.service';
import { Task } from '../../../../core/models/task.model';
import { TaskDependencySummary } from '../../../../core/models/dependency.model';

describe('DependencyPanelComponent', () => {
  let fixture: ComponentFixture<DependencyPanelComponent>;
  let component: DependencyPanelComponent;
  let depSvc: jasmine.SpyObj<DependencyService>;
  let taskSvc: jasmine.SpyObj<TaskService>;

  const makeTask = (id: string, title: string): Task => ({
    id, title, status: 'backlog', order: 0, tagIds: [],
    parentId: null, scheduledDay: null, dueDate: null, createdAt: '', updatedAt: '',
  });

  const mockSummary: TaskDependencySummary = {
    taskId: 'task-1',
    prerequisites: [{ id: 'dep-1', taskId: 'prereq-task-1' }],
    dependents:    [{ id: 'dep-2', taskId: 'dep-task-1' }],
  };

  beforeEach(() => {
    depSvc  = jasmine.createSpyObj('DependencyService', ['getForTask', 'create', 'delete']);
    taskSvc = jasmine.createSpyObj('TaskService', ['get', 'list']);

    depSvc.getForTask.and.returnValue(of(mockSummary));
    taskSvc.get.and.callFake((id: string) => of(makeTask(id, `Task ${id}`)));
    taskSvc.list.and.returnValue(of([makeTask('other-1', 'Other Task')]));
    depSvc.delete.and.returnValue(of(undefined));
    depSvc.create.and.returnValue(of({ id: 'dep-new', prerequisiteId: 'other-1', dependentId: 'task-1', createdAt: '' }));

    TestBed.configureTestingModule({
      imports: [DependencyPanelComponent],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: DependencyService, useValue: depSvc },
        { provide: TaskService,       useValue: taskSvc },
      ],
    });

    fixture = TestBed.createComponent(DependencyPanelComponent);
    component = fixture.componentInstance;
    component.taskId = 'task-1';
    fixture.detectChanges();
  });

  it('loads prerequisites and dependents on init', () => {
    expect(component.prerequisites().length).toBe(1);
    expect(component.prerequisites()[0].depId).toBe('dep-1');
    expect(component.dependents().length).toBe(1);
  });

  it('searchResults filters allTasks by query', () => {
    component['allTasks'].set([makeTask('a', 'Angular Tips'), makeTask('b', 'React Guide')]);
    component.searchQuery.set('angular');
    expect(component.searchResults().length).toBe(1);
    expect(component.searchResults()[0].title).toBe('Angular Tips');
  });

  it('searchResults excludes the current taskId', () => {
    component['allTasks'].set([makeTask('task-1', 'Current Task'), makeTask('other', 'Other')]);
    component.searchQuery.set('');
    const ids = component.searchResults().map(t => t.id);
    expect(ids).not.toContain('task-1');
  });

  it('removePrerequisite() calls delete and removes from signal', () => {
    component.removePrerequisite('dep-1');
    expect(depSvc.delete).toHaveBeenCalledWith('dep-1');
    expect(component.prerequisites().length).toBe(0);
  });

  it('removePrerequisite() reverts on API error', () => {
    depSvc.delete.and.returnValue(throwError(() => new Error('fail')));
    component.removePrerequisite('dep-1');
    expect(component.prerequisites().length).toBe(1);
  });

  it('addPrerequisite() calls create and appends to signal', () => {
    const selectedTask = makeTask('other-1', 'Other Task');
    component.addPrerequisite(selectedTask);
    expect(depSvc.create).toHaveBeenCalledWith({ prerequisiteId: 'other-1', dependentId: 'task-1' });
    expect(component.prerequisites().length).toBe(2);
    expect(component.prerequisites()[1].depId).toBe('dep-new');
  });
});
