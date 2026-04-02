import {
  Component, AfterViewInit, OnDestroy, ViewChild, ViewChildren,
  QueryList, ElementRef, inject,
} from '@angular/core';
import { RouterLink, RouterLinkActive, Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { Subscription } from 'rxjs';
import { AnimationService } from '../../services/animation.service';

type KillableTween = { kill(): void };

@Component({
  selector: 'app-side-nav',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './side-nav.component.html',
})
export class SideNavComponent implements AfterViewInit, OnDestroy {
  private animSvc = inject(AnimationService);
  private router  = inject(Router);
  private routerSub?: Subscription;
  private shimmerTween?: KillableTween;

  @ViewChild('navPill')      navPillRef!: ElementRef<HTMLElement>;
  @ViewChild('startWeekBtn') startWeekBtnRef!: ElementRef<HTMLElement>;
  @ViewChild('shimmerEl')    shimmerElRef!: ElementRef<HTMLElement>;
  @ViewChildren('navItemEl') navItemEls!: QueryList<ElementRef<HTMLElement>>;

  navItems = [
    { label: 'Week View',     icon: 'calendar_view_week',   route: '/schedule' },
    { label: 'Task Backlog',  icon: 'format_list_bulleted', route: '/backlog' },
    { label: 'Daily Journal', icon: 'edit_note',            route: '/journal' },
    { label: 'Insights',      icon: 'analytics',            route: '/reports' },
  ];

  ngAfterViewInit(): void {
    this._positionPill();
    this.routerSub = this.router.events
      .pipe(filter(e => e instanceof NavigationEnd))
      .subscribe(() => this._positionPill());
  }

  ngOnDestroy(): void {
    this.routerSub?.unsubscribe();
    this.shimmerTween?.kill();
  }

  private _positionPill(): void {
    const items = this.navItemEls.toArray();
    const activeIndex = items.findIndex(ref =>
      ref.nativeElement.classList.contains('text-primary'),
    );
    if (activeIndex < 0) return;

    const itemH = 44; // h-11 = 44px
    const gap   = 8;  // space-y-2 = 8px
    const toY   = activeIndex * (itemH + gap);

    this.animSvc.animateNavPill(this.navPillRef.nativeElement, toY);
  }

  onNavHoverIn(event: MouseEvent): void {
    const link  = event.currentTarget as HTMLElement;
    const icon  = link.querySelector<HTMLElement>('.nav-icon');
    const label = link.querySelector<HTMLElement>('.nav-label');
    if (icon && label) this.animSvc.animateNavItemHoverIn(icon, label);
  }

  onNavHoverOut(event: MouseEvent): void {
    const link  = event.currentTarget as HTMLElement;
    const icon  = link.querySelector<HTMLElement>('.nav-icon');
    const label = link.querySelector<HTMLElement>('.nav-label');
    if (icon && label) this.animSvc.animateNavItemHoverOut(icon, label);
  }

  onStartWeekHover(): void {
    if (!this.shimmerElRef?.nativeElement) return;
    this.shimmerTween?.kill();
    const tween = this.animSvc.startStartWeekShimmer(this.shimmerElRef.nativeElement);
    this.shimmerTween = tween;
    (tween as any).play?.();
  }

  onStartWeekHoverOut(): void {
    this.shimmerTween?.kill();
    this.shimmerTween = undefined;
  }

  onStartWeekClick(): void {
    this.animSvc.animateStartWeekClick(this.startWeekBtnRef.nativeElement);
  }
}
