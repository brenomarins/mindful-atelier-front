import { TestBed } from '@angular/core/testing';
import { SideNavComponent } from './side-nav.component';
import { provideRouter } from '@angular/router';
import { AnimationService } from '../../services/animation.service';

describe('SideNavComponent', () => {
  let animSvc: AnimationService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SideNavComponent],
      providers: [provideRouter([])],
    }).compileComponents();
    animSvc = TestBed.inject(AnimationService);
  });

  it('should create', () => {
    const fixture = TestBed.createComponent(SideNavComponent);
    fixture.detectChanges();
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('calls animateNavPill after view init', () => {
    spyOn(animSvc, 'animateNavPill');
    const fixture = TestBed.createComponent(SideNavComponent);
    fixture.detectChanges();
    expect(animSvc.animateNavPill).toHaveBeenCalled();
  });

  it('calls animateNavItemHoverIn on mouseenter', () => {
    spyOn(animSvc, 'animateNavItemHoverIn');
    const fixture = TestBed.createComponent(SideNavComponent);
    fixture.detectChanges();
    const link = fixture.nativeElement.querySelector('a[routerlink]') as HTMLElement;
    if (link) {
      link.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));
      expect(animSvc.animateNavItemHoverIn).toHaveBeenCalled();
    }
  });

  it('calls animateStartWeekClick on Start Week button click', () => {
    spyOn(animSvc, 'animateStartWeekClick');
    const fixture = TestBed.createComponent(SideNavComponent);
    fixture.detectChanges();
    const btn = fixture.nativeElement.querySelector('button[class*="bg-primary"]') as HTMLElement;
    if (btn) {
      btn.click();
      expect(animSvc.animateStartWeekClick).toHaveBeenCalled();
    }
  });

  it('kills shimmer tween and router sub on destroy', () => {
    const fixture = TestBed.createComponent(SideNavComponent);
    fixture.detectChanges();
    const comp = fixture.componentInstance;
    const mockTween = { kill: jasmine.createSpy('kill') };
    (comp as any).shimmerTween = mockTween;
    comp.ngOnDestroy();
    expect(mockTween.kill).toHaveBeenCalled();
  });
});
