import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

@Component({
  selector: 'app-side-nav',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './side-nav.component.html',
})
export class SideNavComponent {
  navItems = [
    { label: 'Week View',     icon: 'calendar_view_week',   route: '/schedule' },
    { label: 'Task Backlog',  icon: 'format_list_bulleted', route: '/backlog' },
    { label: 'Daily Journal', icon: 'edit_note',            route: '/journal' },
    { label: 'Insights',      icon: 'analytics',            route: '/reports' },
  ];
}
