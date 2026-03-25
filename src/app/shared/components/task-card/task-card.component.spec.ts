import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TaskCardComponent } from './task-card.component';
import { Task } from '../../../core/models/task.model';
import { provideRouter } from '@angular/router';

const mockTask: Task = {
  id: '1', title: 'Test Task', status: 'backlog',
  order: 0, tagIds: [], createdAt: '', updatedAt: '',
};

describe('TaskCardComponent', () => {
  let fixture: ComponentFixture<TaskCardComponent>;
  let component: TaskCardComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TaskCardComponent],
      providers: [provideRouter([])],
    }).compileComponents();
    fixture = TestBed.createComponent(TaskCardComponent);
    component = fixture.componentInstance;
    component.task = mockTask;
    fixture.detectChanges();
  });

  it('shows circle icon for backlog tasks', () => {
    expect(component.statusIcon).toBe('circle');
  });

  it('shows sync icon for in-progress tasks', () => {
    component.task = { ...mockTask, status: 'in-progress' };
    expect(component.statusIcon).toBe('sync');
  });

  it('shows check_circle icon for done tasks', () => {
    component.task = { ...mockTask, status: 'done' };
    expect(component.statusIcon).toBe('check_circle');
  });

  it('emits next status on toggle', () => {
    const spy = spyOn(component.statusChange, 'emit');
    component.toggleStatus(); // backlog → in-progress
    expect(spy).toHaveBeenCalledWith('in-progress');
  });
});
