import { Component, signal } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

@Component({
  selector: 'app-admin-sidebar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './admin-sidebar.html',
  styleUrl: './admin-sidebar.scss'
})
export class AdminSidebar {
  protected readonly isCollapsed = signal(false);
  protected readonly navItems = [
    { label: 'Insights', route: '/dashboard', icon: 'fa-solid fa-chart-line' },
    { label: 'Event Catalog', route: '/dashboard/events', icon: 'fa-solid fa-calendar-days' },
    { label: 'Booking Operations', route: '/dashboard/bookings', icon: 'fa-solid fa-ticket' },
    { label: 'Member Directory', route: '/dashboard/users', icon: 'fa-solid fa-users' },
    { label: 'Message Center', route: '/dashboard/messages', icon: 'fa-regular fa-envelope' },
    { label: 'Audience List', route: '/dashboard/subscribers', icon: 'fa-solid fa-bullhorn' },
    { label: 'Assistant Activity', route: '/dashboard/assistant-logs', icon: 'fa-solid fa-robot' }
  ] as const;

  protected toggleCollapse(): void {
    this.isCollapsed.update((value) => !value);
  }
}
