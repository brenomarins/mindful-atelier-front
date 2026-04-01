import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SideNavComponent } from './shared/components/side-nav/side-nav.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, SideNavComponent],
  template: `
    <div class="flex min-h-screen bg-background overflow-hidden">
      <app-side-nav />
      <main class="flex-grow ml-72 flex flex-col min-h-screen">
        <router-outlet />
      </main>
    </div>
  `,
})
export class App {}
