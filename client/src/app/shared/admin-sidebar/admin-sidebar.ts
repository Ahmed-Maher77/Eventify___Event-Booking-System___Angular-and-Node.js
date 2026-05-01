import { DOCUMENT } from '@angular/common';
import { Component, OnDestroy, OnInit, inject, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { Button } from '../button/button';

@Component({
  selector: 'app-admin-sidebar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, Button],
  templateUrl: './admin-sidebar.html',
  styleUrl: './admin-sidebar.scss'
})
export class AdminSidebar implements OnInit, OnDestroy {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly document = inject(DOCUMENT);
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

  ngOnInit(): void {
    this.applySidebarWidthVariable(false);
  }

  ngOnDestroy(): void {
    this.document.documentElement.style.removeProperty('--admin-sidebar-width');
  }

  protected toggleCollapse(): void {
    this.isCollapsed.update((value) => {
      const nextValue = !value;
      this.applySidebarWidthVariable(nextValue);
      return nextValue;
    });
  }

  protected logout(): void {
    this.authService.logout();
    void this.router.navigate(['/']);
  }

  protected openAddEventModal(): void {
    void this.router.navigate(['/dashboard/events'], {
      queryParams: { addEvent: 'true' }
    });
  }

  private applySidebarWidthVariable(isCollapsed: boolean): void {
    this.document.documentElement.style.setProperty(
      '--admin-sidebar-width',
      isCollapsed ? '80px' : '245px'
    );
  }
}
