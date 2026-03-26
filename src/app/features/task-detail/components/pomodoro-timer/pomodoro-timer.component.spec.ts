import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { of, throwError } from 'rxjs';
import { PomodoroTimerComponent } from './pomodoro-timer.component';
import { SessionService } from '../../../../core/services/session.service';
import { Session } from '../../../../core/models/session.model';

describe('PomodoroTimerComponent', () => {
  let fixture: ComponentFixture<PomodoroTimerComponent>;
  let component: PomodoroTimerComponent;
  let sessionSvc: jasmine.SpyObj<SessionService>;

  const makeSession = (overrides: Partial<Session> = {}): Session => ({
    id: 'session-1',
    taskId: 'task-1',
    startedAt: new Date(Date.now() - 60 * 1000).toISOString(), // started 1 min ago
    completedAt: null,
    type: 'work',
    durationMinutes: 25,
    isOpen: 1,
    ...overrides,
  });

  beforeEach(() => {
    sessionSvc = jasmine.createSpyObj('SessionService', [
      'listByTask', 'getOpen', 'startWork', 'interrupt', 'complete',
    ]);
    sessionSvc.listByTask.and.returnValue(of([]));
    sessionSvc.startWork.and.returnValue(of(makeSession()));
    sessionSvc.interrupt.and.returnValue(of(undefined));
    sessionSvc.complete.and.returnValue(of(undefined));

    TestBed.configureTestingModule({
      imports: [PomodoroTimerComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: SessionService, useValue: sessionSvc },
      ],
    });

    fixture = TestBed.createComponent(PomodoroTimerComponent);
    component = fixture.componentInstance;
    component.taskId = 'task-1';
    component.openSession = null;
    fixture.detectChanges();
  });

  it('initialises with 25:00 when no open session', () => {
    expect(component.timeRemaining()).toBe(25 * 60);
    expect(component.isRunning()).toBeFalse();
  });

  it('resumes from open session when taskId matches', () => {
    const session = makeSession(); // started 1 min ago, 25 min preset → ~24 min remaining
    component.openSession = session;
    component.ngOnInit();
    expect(component.isRunning()).toBeTrue();
    expect(component.currentSessionId()).toBe('session-1');
    expect(component.timeRemaining()).toBeLessThan(25 * 60);
    expect(component.timeRemaining()).toBeGreaterThan(23 * 60);
  });

  it('sets otherTaskRunning when open session belongs to a different task', () => {
    const session = makeSession({ taskId: 'other-task' });
    component.openSession = session;
    component.ngOnInit();
    expect(component.otherTaskRunning()).toBeTrue();
    expect(component.isRunning()).toBeFalse();
  });

  it('start() calls startWork and sets running state', fakeAsync(() => {
    component.start();
    tick();
    expect(sessionSvc.startWork).toHaveBeenCalledWith({ taskId: 'task-1' });
    expect(component.isRunning()).toBeTrue();
    expect(component.currentSessionId()).toBe('session-1');
    component.reset(); // cleanup
  }));

  it('pause() calls interrupt and clears running state', fakeAsync(() => {
    component.start();
    tick();
    component.pause();
    tick();
    expect(sessionSvc.interrupt).toHaveBeenCalledWith('session-1');
    expect(component.isRunning()).toBeFalse();
    expect(component.currentSessionId()).toBeNull();
  }));

  it('reset() resets timeRemaining to preset duration', fakeAsync(() => {
    component.start();
    tick();
    (component as any).timeRemaining.set(100); // simulate some time elapsed
    component.reset();
    tick();
    expect(component.timeRemaining()).toBe(25 * 60);
    expect(component.isRunning()).toBeFalse();
  }));

  it('switchPreset() changes duration and type', () => {
    component.switchPreset('short_break');
    expect(component.sessionType()).toBe('short_break');
    expect(component.timeRemaining()).toBe(5 * 60);
  });

  it('displayTime formats seconds as MM:SS', () => {
    (component as any).timeRemaining.set(90);
    expect(component.displayTime).toBe('01:30');
  });

  it('stats load on init — totalMinutes sums completed sessions', () => {
    const sessions: Session[] = [
      { ...makeSession(), completedAt: '2026-03-25T10:00:00Z', durationMinutes: 25 },
      { ...makeSession({ id: 's2' }), completedAt: '2026-03-25T11:00:00Z', durationMinutes: 25 },
    ];
    sessionSvc.listByTask.and.returnValue(of(sessions));
    component.ngOnInit();
    expect(component.totalMinutes()).toBe(50);
    expect(component.pomodoroCount()).toBe(2);
  });
});
