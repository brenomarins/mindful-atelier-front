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
          style({ opacity: 1, transform: 'translateY(0)' }),
          animate('180ms ease-in', style({ opacity: 0, transform: 'translateY(-4px)' })),
        ], { optional: true }),
        query(':enter', [
          style({ opacity: 0, transform: 'translateY(8px)' }),
          animate('220ms ease-out', style({ opacity: 1, transform: 'translateY(0)' })),
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
    return outlet.activatedRouteData?.['animation'] ?? outlet.activatedRoute?.routeConfig?.path ?? '';
  }
}
