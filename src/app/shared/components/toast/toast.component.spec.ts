import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { ToastComponent } from './toast.component';
import { ToastService } from '../../services/toast.service';
import { AnimationService } from '../../services/animation.service';

describe('ToastComponent', () => {
  let animSvc: AnimationService;
  let toastSvc: ToastService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ToastComponent],
    }).compileComponents();
    animSvc = TestBed.inject(AnimationService);
    toastSvc = TestBed.inject(ToastService);
  });

  it('should create', () => {
    const fixture = TestBed.createComponent(ToastComponent);
    fixture.detectChanges();
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('calls animateToastIn when a toast is added', () => {
    spyOn(animSvc, 'animateToastIn');
    const fixture = TestBed.createComponent(ToastComponent);
    fixture.detectChanges();
    toastSvc.show('hello');
    fixture.detectChanges();
    expect(animSvc.animateToastIn).toHaveBeenCalled();
  });

  it('calls animateToastOut then dismisses on manual dismiss', fakeAsync(() => {
    spyOn(animSvc, 'animateToastOut').and.returnValue(Promise.resolve());
    const fixture = TestBed.createComponent(ToastComponent);
    fixture.detectChanges();
    toastSvc.show('bye');
    fixture.detectChanges();
    const comp = fixture.componentInstance;
    const toastId = toastSvc.toasts()[0].id;
    comp.dismissToast(toastId);
    tick();
    expect(animSvc.animateToastOut).toHaveBeenCalled();
  }));
});
