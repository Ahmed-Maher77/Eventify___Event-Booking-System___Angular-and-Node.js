import { DOCUMENT } from '@angular/common';
import { Component, DestroyRef, OnDestroy, OnInit, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterLink, RouterLinkActive } from '@angular/router';
import { filter } from 'rxjs';
import { AuthService } from '../../services/auth.service';
import { AdminMobileSidebarService } from '../../services/admin-mobile-sidebar.service';
import { Button } from '../button/button';

@Component({
  selector: 'app-admin-sidebar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, Button],
  templateUrl: './admin-sidebar.html',
  styleUrl: './admin-sidebar.scss'
})
export class AdminSidebar implements OnInit, OnDestroy {
  private static readonly MOBILE_MQ = '(max-width: 991.98px)';

  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly document = inject(DOCUMENT);
  private readonly destroyRef = inject(DestroyRef);
  protected readonly adminMobileSidebar = inject(AdminMobileSidebarService);

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

  private mobileMq: MediaQueryList | null = null;

  private readonly onMobileMqChange = (): void => {
    this.syncLayoutForViewport();
  };

  constructor() {
    this.router.events
      .pipe(
        filter((e): e is NavigationEnd => e instanceof NavigationEnd),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe(() => {
        if (this.isMobileViewport()) {
          this.adminMobileSidebar.closeDrawer();
        }
      });
  }

  ngOnInit(): void {
    if (typeof window !== 'undefined') {
      this.mobileMq = window.matchMedia(AdminSidebar.MOBILE_MQ);
      this.mobileMq.addEventListener('change', this.onMobileMqChange);
    }
    this.syncLayoutForViewport();
  }

  ngOnDestroy(): void {
    this.mobileMq?.removeEventListener('change', this.onMobileMqChange);
    this.document.documentElement.style.removeProperty('--admin-sidebar-width');
  }

  protected collapseButtonAriaLabel(): string {
    if (this.isMobileViewport()) {
      return 'Close menu';
    }
    return this.isCollapsed() ? 'Expand sidebar' : 'Collapse sidebar';
  }

  protected collapseButtonIconClass(): string {
    return this.isCollapsed() ? 'fa-solid fa-angles-right' : 'fa-solid fa-angles-left';
  }

  protected onCollapseButtonClick(): void {
    if (this.isMobileViewport()) {
      this.adminMobileSidebar.closeDrawer();
      return;
    }
    this.toggleCollapseDesktop();
  }

  protected toggleCollapseDesktop(): void {
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

  private isMobileViewport(): boolean {
    return typeof window !== 'undefined' && window.matchMedia(AdminSidebar.MOBILE_MQ).matches;
  }

  private syncLayoutForViewport(): void {
    if (this.isMobileViewport()) {
      this.isCollapsed.set(false);
      this.adminMobileSidebar.closeDrawer();
    }
    this.applySidebarWidthVariable(this.isCollapsed());
  }

  private applySidebarWidthVariable(isCollapsed: boolean): void {
    if (this.isMobileViewport()) {
      this.document.documentElement.style.setProperty('--admin-sidebar-width', '0px');
      return;
    }
    this.document.documentElement.style.setProperty(
      '--admin-sidebar-width',
      isCollapsed ? '80px' : '245px'
    );
  }
}
