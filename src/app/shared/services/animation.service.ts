import { Injectable } from '@angular/core';
import gsap from 'gsap';

const T = {
  FAST: 0.15,
  MEDIUM: 0.35,
  SLOW: 0.6,
  EASE_OUT: 'power2.out',
  EASE_IN: 'power2.in',
  ELASTIC: 'elastic.out(1, 0.5)',
  ELASTIC_60: 'elastic.out(1, 0.6)',
  ELASTIC_70: 'elastic.out(1, 0.7)',
  SINE: 'sine.inOut',
  POWER3: 'power3.out',
} as const;

@Injectable({ providedIn: 'root' })
export class AnimationService {
  get reducedMotion(): boolean {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
      return false;
    }

    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  animateTaskCompletion(
    checkboxEl: HTMLElement,
    titleEl: HTMLElement,
    strikeEl: HTMLElement,
    cardEl: HTMLElement,
  ): void {
    if (this.reducedMotion) {
      gsap.set(strikeEl, { width: '100%' });
      gsap.set(cardEl, { opacity: 0.6, x: 4 });
      return;
    }

    const tl = gsap.timeline();

    tl.fromTo(
      checkboxEl,
      { scale: 0.7 },
      { scale: 1.3, duration: T.FAST * 1.3, ease: T.ELASTIC_60 },
    )
      .to(checkboxEl, { scale: 1, duration: 0.1 })
      .fromTo(
        strikeEl,
        { width: '0%' },
        { width: '100%', duration: T.MEDIUM, ease: T.EASE_OUT },
        '-=0.1',
      )
      .to(titleEl, { opacity: 0.72, duration: T.FAST, ease: T.EASE_OUT }, '<')
      .add(() => this._sparkBurst(checkboxEl), '-=0.15')
      .to(cardEl, { opacity: 0.6, x: 4, duration: T.MEDIUM, ease: T.EASE_OUT }, '+=0.1');
  }

  animateTaskUncompletion(
    titleEl: HTMLElement,
    strikeEl: HTMLElement,
    cardEl: HTMLElement,
  ): void {
    if (this.reducedMotion) {
      gsap.set(strikeEl, { width: '0%' });
      gsap.set(cardEl, { opacity: 1, x: 0 });
      gsap.set(titleEl, { opacity: 1 });
      return;
    }

    gsap.to(strikeEl, { width: '0%', duration: T.FAST, ease: T.EASE_IN });
    gsap.to(cardEl, { opacity: 1, x: 0, duration: T.FAST, ease: T.EASE_OUT });
    gsap.to(titleEl, { opacity: 1, duration: T.FAST, ease: T.EASE_OUT });
  }

  /** @returns A GSAP tween. Caller MUST call `.kill()` in ngOnDestroy to prevent memory leaks. */
  animateTodayClearBreathing(el: HTMLElement): gsap.core.Tween {
    if (this.reducedMotion) {
      return gsap.to(el, { duration: 0 });
    }

    return gsap.to(el, {
      scale: 1.03,
      duration: 3,
      ease: T.SINE,
      yoyo: true,
      repeat: -1,
    });
  }

  /** @returns A GSAP tween. Caller MUST call `.kill()` in ngOnDestroy to prevent memory leaks. */
  startTodayGlow(el: HTMLElement): gsap.core.Tween {
    if (this.reducedMotion) {
      return gsap.to(el, { duration: 0 });
    }

    gsap.set(el, { opacity: 0.06 });
    return gsap.to(el, {
      opacity: 0.14,
      duration: 3,
      ease: T.SINE,
      yoyo: true,
      repeat: -1,
    });
  }

  animateDayNumbers(entries: Array<{ el: HTMLElement; isToday: boolean }>): void {
    if (this.reducedMotion) return;

    entries.forEach(({ el, isToday }, i) => {
      gsap.fromTo(
        el,
        { y: 20, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: isToday ? T.SLOW : T.MEDIUM,
          ease: isToday ? T.ELASTIC_70 : T.POWER3,
          delay: i * 0.08,
        },
      );
    });
  }

  animateTaskCardsIn(cardEls: HTMLElement[]): void {
    if (this.reducedMotion || cardEls.length === 0) return;

    gsap.fromTo(
      cardEls,
      { y: 12, opacity: 0 },
      {
        y: 0,
        opacity: 1,
        duration: T.MEDIUM,
        ease: T.EASE_OUT,
        stagger: 0.08,
      },
    );
  }

  animateDropColumnPulse(colEl: HTMLElement): void {
    if (this.reducedMotion) return;

    gsap.fromTo(
      colEl,
      { scale: 1 },
      { scale: 1.015, duration: 0.12, ease: T.EASE_OUT, yoyo: true, repeat: 1 },
    );
  }

  /** @returns A GSAP tween. Caller MUST call `.kill()` in ngOnDestroy to prevent memory leaks. */
  startTodayHeaderCycle(el: HTMLElement): gsap.core.Tween {
    if (this.reducedMotion) {
      return gsap.to(el, { duration: 0 });
    }

    return gsap.to(el, {
      color: '#1f5d43',
      duration: 3,
      ease: T.SINE,
      yoyo: true,
      repeat: -1,
    });
  }

  animateRouteEntrance(el: HTMLElement): void {
    if (this.reducedMotion) return;

    gsap.fromTo(
      el,
      { y: 16, opacity: 0 },
      { y: 0, opacity: 1, duration: T.MEDIUM, ease: T.EASE_OUT },
    );
  }

  animateNavPill(pillEl: HTMLElement, toY: number): void {
    if (this.reducedMotion) {
      gsap.set(pillEl, { y: toY });
      return;
    }

    gsap.to(pillEl, { y: toY, duration: 0.4, ease: T.ELASTIC_60 });
  }

  animateNavItemHoverIn(iconEl: HTMLElement, labelEl: HTMLElement): void {
    if (this.reducedMotion) return;
    gsap.to(iconEl, { scale: 1.2, duration: T.FAST, ease: T.EASE_OUT });
    gsap.to(labelEl, { x: 3, duration: T.FAST, ease: T.EASE_OUT });
  }

  animateNavItemHoverOut(iconEl: HTMLElement, labelEl: HTMLElement): void {
    if (this.reducedMotion) return;
    gsap.to(iconEl, { scale: 1, duration: T.FAST, ease: T.EASE_OUT });
    gsap.to(labelEl, { x: 0, duration: T.FAST, ease: T.EASE_OUT });
  }

  startStartWeekShimmer(btnEl: HTMLElement): gsap.core.Tween {
    if (this.reducedMotion) return gsap.to(btnEl, { duration: 0 });
    return gsap.fromTo(
      btnEl,
      { backgroundPosition: '-200% 0' },
      { backgroundPosition: '200% 0', duration: T.SLOW, ease: 'none', paused: true },
    );
  }

  animateStartWeekClick(btnEl: HTMLElement): void {
    if (this.reducedMotion) return;

    gsap.timeline()
      .to(btnEl, { scaleY: 0.9, duration: 0.08, ease: T.EASE_IN })
      .to(btnEl, { scaleY: 1, duration: 0.4, ease: T.ELASTIC });
  }

  animateCardHoverIn(el: HTMLElement): void {
    if (this.reducedMotion) return;

    gsap.to(el, {
      y: -3,
      boxShadow: '0 8px 24px rgba(25,28,29,0.14)',
      duration: T.MEDIUM,
      ease: T.EASE_OUT,
    });
  }

  animateCardHoverOut(el: HTMLElement): void {
    if (this.reducedMotion) return;

    gsap.to(el, {
      y: 0,
      boxShadow: '0 1px 3px rgba(25,28,29,0.06)',
      duration: T.MEDIUM,
      ease: T.EASE_OUT,
    });
  }

  animateFilterChipActivate(el: HTMLElement): void {
    if (this.reducedMotion) return;

    gsap.fromTo(el, { scale: 0.9 }, { scale: 1, duration: T.MEDIUM, ease: T.ELASTIC });
  }

  animateFilterChipDeactivate(el: HTMLElement): void {
    if (this.reducedMotion) return;

    gsap.fromTo(
      el,
      { scale: 1 },
      { scale: 0.95, duration: 0.08, ease: T.EASE_IN, yoyo: true, repeat: 1 },
    );
  }

  animateToastIn(el: HTMLElement): void {
    if (this.reducedMotion) return;

    gsap.fromTo(
      el,
      { y: 20, opacity: 0 },
      { y: 0, opacity: 1, duration: T.MEDIUM, ease: T.EASE_OUT },
    );
  }

  animateToastOut(el: HTMLElement): Promise<void> {
    if (this.reducedMotion) return Promise.resolve();

    return new Promise(resolve => {
      gsap.to(el, {
        y: 20,
        opacity: 0,
        duration: T.FAST,
        ease: T.EASE_IN,
        onComplete: () => resolve(),
      });
    });
  }

  nudgeToastsUp(els: HTMLElement[]): void {
    if (this.reducedMotion || els.length === 0) return;

    gsap.to(els, { y: '-=48', duration: T.FAST, ease: T.EASE_OUT, stagger: 0.04 });
  }

  animatePomodoroRing(ringEl: SVGCircleElement, progress: number): void {
    const r = 88;
    const circumference = 2 * Math.PI * r;
    const offset = circumference * (1 - progress);

    if (this.reducedMotion) {
      gsap.set(ringEl, { strokeDashoffset: offset });
      return;
    }

    gsap.to(ringEl, {
      strokeDashoffset: offset,
      duration: 1,
      ease: 'none',
    });
  }

  animatePomodoroTick(displayEl: HTMLElement): void {
    if (this.reducedMotion) return;

    gsap.fromTo(displayEl, { scale: 1.02 }, { scale: 1, duration: 0.3, ease: T.ELASTIC });
  }

  animatePomodoroComplete(containerEl: HTMLElement): void {
    if (this.reducedMotion) return;
    this._sparkBurst(containerEl);
  }

  animateReflectionOpen(el: HTMLElement): void {
    if (this.reducedMotion) {
      gsap.set(el, { scaleY: 1, opacity: 1 });
      return;
    }

    gsap.fromTo(
      el,
      { scaleY: 0, opacity: 0, transformOrigin: 'bottom center' },
      { scaleY: 1, opacity: 1, duration: 0.4, ease: T.POWER3 },
    );
  }

  animateReflectionClose(el: HTMLElement): Promise<void> {
    if (this.reducedMotion) return Promise.resolve();

    return new Promise(resolve => {
      gsap.to(el, {
        scaleY: 0,
        opacity: 0,
        transformOrigin: 'bottom center',
        duration: T.FAST,
        ease: T.EASE_IN,
        onComplete: () => resolve(),
      });
    });
  }

  private _sparkBurst(anchorEl: HTMLElement): void {
    if (this.reducedMotion) return;
    const rect = anchorEl.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const sparks: HTMLElement[] = [];
    const count = 8;

    for (let i = 0; i < count; i += 1) {
      const spark = document.createElement('div');
      spark.textContent = '✦';
      spark.style.cssText = `
        position: fixed;
        left: ${cx}px;
        top: ${cy}px;
        font-size: 10px;
        color: #00452e;
        pointer-events: none;
        z-index: 9999;
        transform: translate(-50%, -50%);
      `;
      document.body.appendChild(spark);
      sparks.push(spark);
    }

    Array.from({ length: count }, (_, i) => (i / count) * Math.PI * 2).forEach((angle, i) => {
      const distance = 30 + Math.random() * 20;
      gsap.to(sparks[i], {
        x: Math.cos(angle) * distance,
        y: Math.sin(angle) * distance,
        opacity: 0,
        duration: 0.5,
        ease: 'power3.out',
        onComplete: () => sparks[i].remove(),
      });
    });
  }
}
