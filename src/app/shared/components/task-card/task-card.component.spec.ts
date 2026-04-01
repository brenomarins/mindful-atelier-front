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

  it('renders a checkbox instead of a button', () => {
    expect(fixture.nativeElement.querySelector('input[type="checkbox"]')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('button')).toBeNull();
  });

  it('checkbox is checked when task is done', () => {
    component.task = { ...mockTask, status: 'done' };
    fixture.detectChanges();
    const cb = fixture.nativeElement.querySelector('input[type="checkbox"]') as HTMLInputElement;
    expect(cb.checked).toBeTrue();
  });

  it('checkbox emits done when checked and backlog when unchecked', () => {
    const spy = spyOn(component.statusChange, 'emit');

    // Simulate checking (task is backlog → user checks → should emit 'done')
    const cb = fixture.nativeElement.querySelector('input[type="checkbox"]') as HTMLInputElement;
    cb.checked = true;
    cb.dispatchEvent(new Event('change'));
    expect(spy).toHaveBeenCalledWith('done');

    spy.calls.reset();

    // Simulate unchecking (task is done → user unchecks → should emit 'backlog')
    component.task = { ...mockTask, status: 'done' };
    fixture.detectChanges();
    const cb2 = fixture.nativeElement.querySelector('input[type="checkbox"]') as HTMLInputElement;
    cb2.checked = false;
    cb2.dispatchEvent(new Event('change'));
    expect(spy).toHaveBeenCalledWith('backlog');
  });
});
