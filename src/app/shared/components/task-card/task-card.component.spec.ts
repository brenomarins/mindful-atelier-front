import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TaskCardComponent } from './task-card.component';
import { Task } from '../../../core/models/task.model';
import { provideRouter } from '@angular/router';
import { AnimationService } from '../../services/animation.service';

const mockTask: Task = {
  id: '1', title: 'Test Task', status: 'backlog',
  order: 0, tagIds: [], createdAt: '', updatedAt: '',
};

describe('TaskCardComponent', () => {
  let fixture: ComponentFixture<TaskCardComponent>;
  let component: TaskCardComponent;
  let animSvc: AnimationService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TaskCardComponent],
      providers: [provideRouter([])],
    }).compileComponents();
    fixture = TestBed.createComponent(TaskCardComponent);
    component = fixture.componentInstance;
    animSvc = TestBed.inject(AnimationService);
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

  it('isDone returns true when task status is done', () => {
    component.task = { ...mockTask, status: 'done' };
    expect(component.isDone).toBeTrue();
  });

  it('isDone returns false when task status is backlog', () => {
    expect(component.isDone).toBeFalse();
  });

  it('cardClasses includes task-card--done for done tasks', () => {
    component.task = { ...mockTask, status: 'done' };
    expect(component.cardClasses).toContain('task-card--done');
  });

  it('cardClasses includes bg class for non-done tasks', () => {
    expect(component.cardClasses).toContain('bg-surface-container-lowest');
  });

  it('renders task-card__checkbox class on the checkbox input', () => {
    const cb = fixture.nativeElement.querySelector('input[type="checkbox"]') as HTMLInputElement;
    expect(cb.classList).toContain('task-card__checkbox');
  });

  it('renders task-card__title class on the title element', () => {
    fixture.detectChanges();
    const title = fixture.nativeElement.querySelector('.task-card__title') as HTMLElement;
    expect(title).toBeTruthy();
  });

  it('adds task-card__title--done class to title when done', () => {
    component.task = { ...mockTask, status: 'done' };
    fixture.detectChanges();
    const title = fixture.nativeElement.querySelector('.task-card__title') as HTMLElement;
    expect(title.classList).toContain('task-card__title--done');
  });

  it('calls animateTaskCompletion when checkbox is checked', () => {
    spyOn(animSvc, 'animateTaskCompletion');
    const cb = fixture.nativeElement.querySelector('input[type="checkbox"]') as HTMLInputElement;
    cb.checked = true;
    cb.dispatchEvent(new Event('change'));
    expect(animSvc.animateTaskCompletion).toHaveBeenCalledWith(
      component.checkboxElRef.nativeElement,
      component.titleElRef.nativeElement,
      component.strikeElRef.nativeElement,
      component.cardElRef.nativeElement,
    );
  });

  it('calls animateTaskUncompletion when checkbox is unchecked', () => {
    component.task = { ...mockTask, status: 'done' };
    fixture.detectChanges();
    spyOn(animSvc, 'animateTaskUncompletion');
    const cb = fixture.nativeElement.querySelector('input[type="checkbox"]') as HTMLInputElement;
    cb.checked = false;
    cb.dispatchEvent(new Event('change'));
    expect(animSvc.animateTaskUncompletion).toHaveBeenCalled();
  });
});
