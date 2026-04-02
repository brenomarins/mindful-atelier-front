import { fakeAsync, TestBed, tick } from '@angular/core/testing';
import { ToastService } from './toast.service';

describe('ToastService', () => {
  let svc: ToastService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    svc = TestBed.inject(ToastService);
  });

  it('starts with no toasts', () => {
    expect(svc.toasts()).toEqual([]);
  });

  it('show() adds a toast with message and type', () => {
    svc.show('Hello', 'success');
    expect(svc.toasts().length).toBe(1);
    expect(svc.toasts()[0].message).toBe('Hello');
    expect(svc.toasts()[0].type).toBe('success');
  });

  it('show() defaults to type success', () => {
    svc.show('Hi');
    expect(svc.toasts()[0].type).toBe('success');
  });

  it('show() assigns a unique id to each toast', () => {
    svc.show('First');
    svc.show('Second');
    const ids = svc.toasts().map(t => t.id);
    expect(ids[0]).not.toBe(ids[1]);
  });

  it('dismiss() removes toast by id', () => {
    svc.show('A');
    const id = svc.toasts()[0].id;
    svc.dismiss(id);
    expect(svc.toasts()).toEqual([]);
  });

  it('auto-dismisses after the given duration', fakeAsync(() => {
    svc.show('Auto', 'neutral', 1000);
    expect(svc.toasts().length).toBe(1);
    tick(1000);
    expect(svc.toasts().length).toBe(0);
  }));

  it('does not auto-dismiss before the duration elapses', fakeAsync(() => {
    svc.show('Wait', 'success', 2500);
    tick(2000);
    expect(svc.toasts().length).toBe(1);
    tick(500);
    expect(svc.toasts().length).toBe(0);
  }));

  it('multiple toasts auto-dismiss independently', fakeAsync(() => {
    svc.show('Fast', 'success', 500);
    svc.show('Slow', 'neutral', 2000);
    tick(500);
    expect(svc.toasts().length).toBe(1);
    expect(svc.toasts()[0].message).toBe('Slow');
    tick(1500);
    expect(svc.toasts().length).toBe(0);
  }));
});
