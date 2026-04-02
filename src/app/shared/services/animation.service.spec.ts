import { TestBed } from '@angular/core/testing';
import { AnimationService } from './animation.service';

describe('AnimationService', () => {
  let svc: AnimationService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    svc = TestBed.inject(AnimationService);
  });

  it('should be created', () => {
    expect(svc).toBeTruthy();
  });

  it('reducedMotion returns false when matchMedia does not match', () => {
    spyOn(window, 'matchMedia').and.returnValue({ matches: false } as MediaQueryList);
    expect(svc.reducedMotion).toBeFalse();
  });

  it('reducedMotion returns true when matchMedia matches', () => {
    spyOn(window, 'matchMedia').and.returnValue({ matches: true } as MediaQueryList);
    expect(svc.reducedMotion).toBeTrue();
  });

  it('animateTaskCompletion does not throw in reduced motion mode', () => {
    spyOn(window, 'matchMedia').and.returnValue({ matches: true } as MediaQueryList);
    const el = document.createElement('div');
    expect(() => svc.animateTaskCompletion(el, el, el, el)).not.toThrow();
  });
});
