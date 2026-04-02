import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { animate, query, style, transition, trigger } from '@angular/animations';
import { SideNavComponent } from './shared/components/side-nav/side-nav.component';
import { ToastComponent } from './shared/components/toast/toast.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, SideNavComponent, ToastComponent],
  animations: [
    trigger('routeAnimation', [
      transition('* <=> *', [
        query(':leave', [
          animate('200ms cubic-bezier(0.4, 0, 1, 1)', style({ opacity: 0, transform: 'translateY(-12px)' })),
        ], { optional: true }),
        query(':enter', [
          style({ opacity: 0, transform: 'translateY(16px)' }),
          animate('350ms cubic-bezier(0, 0, 0.2, 1)', style({ opacity: 1, transform: 'translateY(0)' })),
        ], { optional: true }),
      ]),
    ]),
  ],
  template: `
    <div class="flex min-h-screen bg-background overflow-hidden">
      <app-side-nav />
      <main class="flex-grow ml-72 flex flex-col min-h-screen">
        <div class="flex min-h-screen flex-col" [@routeAnimation]="prepareRoute(outlet)">
          <router-outlet #outlet="outlet" />
        </div>
      </main>
      <app-toast />
    </div>
  `,
})
export class App {
  prepareRoute(outlet: RouterOutlet): string {
    if (!outlet?.isActivated) return '';
    return outlet.activatedRouteData?.['animation'] ?? outlet.activatedRoute.routeConfig?.path ?? '';
  }
}
