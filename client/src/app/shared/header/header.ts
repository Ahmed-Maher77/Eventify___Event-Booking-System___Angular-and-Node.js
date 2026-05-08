import {
  AfterViewInit,
  Component,
  ElementRef,
  HostListener,
  OnDestroy,
  ViewChild,
  inject,
  signal,
} from '@angular/core';
import { ActivatedRouteSnapshot, NavigationEnd, Router, RouterLink } from '@angular/router';
import { Subscription } from 'rxjs';
import { AuthService } from '../../services/auth.service';
import { BookingService } from '../../services/booking.service';
import { resolveAvatarUrl } from '../../utils/avatar-url';
import { Button } from '../button/button';
import { HeaderNavLinksComponent } from './components/header-nav-links/header-nav-links.component';
import { HeaderUserMenuComponent } from './components/header-user-menu/header-user-menu.component';
import {
  runHeaderNavLinksAnimation,
  runMainHeaderMenuOpenAnimation,
  setupHeaderAnimations,
} from './header.animations';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [RouterLink, Button, HeaderNavLinksComponent, HeaderUserMenuComponent],
  templateUrl: './header.html',
  styleUrl: './header.scss',
})
export class Header implements AfterViewInit, OnDestroy {
  private readonly authService = inject(AuthService);
  private readonly bookingService = inject(BookingService);
  private readonly router = inject(Router);
  private readonly hostElement = inject(ElementRef<HTMLElement>);
  @ViewChild('headerNavRoot') private headerNavRoot?: ElementRef<HTMLElement>;
  private headerContext: ReturnType<typeof setupHeaderAnimations> | null = null;
  private routeRefreshSub: Subscription | null = null;
  private bookingCountIntervalId: ReturnType<typeof setInterval> | null = null;
  protected readonly isProfileMenuOpen = signal(false);
  protected readonly isMainHeaderNavOpen = signal(false);
  protected readonly bookingCount = signal(0);
  protected readonly navLinks = [
    { label: 'Home', route: '/' },
    { label: 'Events', route: '/events' },
    { label: 'About Us', route: '/about' },
    { label: 'FAQ', route: '/faq' },
    { label: 'Contact', route: '/contact' },
  ] as const;
  protected isLoggedIn(): boolean {
    return this.authService.isLoggedIn();
  }

  protected getDisplayName(): string {
    return this.authService.userData?.name?.trim() || 'Ahmed Maher';
  }

  protected getDisplayEmail(): string {
    return this.authService.userData?.email?.trim() || 'No email found';
  }

  protected getProfileImageUrl(): string {
    return resolveAvatarUrl(this.getDisplayName(), this.authService.userData?.pictureUrl);
  }

  protected isHomeRoute(): boolean {
    const [pathWithoutQuery] = this.router.url.split('?');
    const [pathWithoutHash] = pathWithoutQuery.split('#');
    return pathWithoutHash === '/';
  }

  protected shouldUseHomeHeaderStyle(): boolean {
    return this.isHomeRoute() || this.getActiveRoutePath() === '**';
  }

  protected toggleProfileMenu(): void {
    this.isProfileMenuOpen.update((value) => !value);
    if (this.isProfileMenuOpen()) {
      this.refreshBookingCount();
    }
  }

  protected closeProfileMenu(): void {
    this.isProfileMenuOpen.set(false);
  }

  protected onNavItemClick(): void {
    this.closeNavCollapse();
    this.isProfileMenuOpen.set(false);
  }

  protected toggleMainHeaderNav(): void {
    const isDesktop = window.matchMedia('(min-width: 992px)').matches;
    if (isDesktop) {
      this.isMainHeaderNavOpen.set(false);
      this.syncBodyScrollLock();
      return;
    }

    this.isMainHeaderNavOpen.update((value) => !value);
    this.syncBodyScrollLock();
    if (this.isMainHeaderNavOpen()) {
      requestAnimationFrame(() => {
        runMainHeaderMenuOpenAnimation();
        runHeaderNavLinksAnimation(this.headerNavRoot?.nativeElement);
      });
    }
    if (!this.isMainHeaderNavOpen()) {
      this.closeProfileMenu();
    }
  }

  protected closeMainHeaderNav(): void {
    this.closeNavCollapse();
    this.closeProfileMenu();
  }

  protected logout(): void {
    this.authService.logout();
    this.bookingCount.set(0);
    this.isProfileMenuOpen.set(false);
    this.closeNavCollapse();
  }

  ngAfterViewInit(): void {
    this.headerContext = setupHeaderAnimations(
      this.hostElement.nativeElement,
      this.headerNavRoot?.nativeElement,
    );
    this.refreshBookingCount();
    this.setupBookingCountAutoRefresh();
  }

  ngOnDestroy(): void {
    document.body.style.overflow = '';
    this.headerContext?.revert();
    this.headerContext = null;
    this.routeRefreshSub?.unsubscribe();
    this.routeRefreshSub = null;
    if (this.bookingCountIntervalId) {
      clearInterval(this.bookingCountIntervalId);
      this.bookingCountIntervalId = null;
    }
  }

  @HostListener('document:click', ['$event'])
  protected handleDocumentClick(event: MouseEvent): void {
    const target = event.target as Node | null;
    if (!target) {
      return;
    }

    const navRoot = this.headerNavRoot?.nativeElement ?? this.hostElement.nativeElement;
    if (this.isNavCollapseOpen() && !navRoot.contains(target)) {
      this.closeNavCollapse();
    }
  }

  @HostListener('window:resize')
  protected handleResize(): void {
    this.closeNavCollapse();
    this.closeProfileMenu();
  }

  @HostListener('document:keydown.escape')
  protected handleEscapeKey(): void {
    this.closeProfileMenu();
    this.closeNavCollapse();
  }

  private isNavCollapseOpen(): boolean {
    return this.isMainHeaderNavOpen();
  }

  private closeNavCollapse(): void {
    this.isMainHeaderNavOpen.set(false);
    this.closeProfileMenu();
    this.syncBodyScrollLock();
  }

  private syncBodyScrollLock(): void {
    document.body.style.overflow = this.isMainHeaderNavOpen() ? 'hidden' : '';
  }

  private refreshBookingCount(): void {
    if (!this.authService.isLoggedIn()) {
      this.bookingCount.set(0);
      return;
    }

    this.bookingService.getUserBookings({ page: 1, limit: 1, status: 'pending' }).subscribe({
      next: (response) => {
        this.bookingCount.set(response.data?.pagination?.totalBookings ?? 0);
      },
      error: () => {
        this.bookingCount.set(0);
      },
    });
  }

  private setupBookingCountAutoRefresh(): void {
    this.routeRefreshSub?.unsubscribe();
    this.routeRefreshSub = this.router.events.subscribe((event) => {
      if (event instanceof NavigationEnd) {
        this.refreshBookingCount();
      }
    });

    if (this.bookingCountIntervalId) {
      clearInterval(this.bookingCountIntervalId);
    }
    this.bookingCountIntervalId = setInterval(() => {
      this.refreshBookingCount();
    }, 15000);
  }

  private getActiveRoutePath(): string | undefined {
    let snapshot: ActivatedRouteSnapshot | null = this.router.routerState.snapshot.root;

    while (snapshot?.firstChild) {
      snapshot = snapshot.firstChild;
    }

    return snapshot?.routeConfig?.path;
  }
}
