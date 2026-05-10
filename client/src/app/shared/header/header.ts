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
import { HttpErrorResponse } from '@angular/common/http';
import { ActivatedRouteSnapshot, NavigationEnd, Router, RouterLink } from '@angular/router';
import { Subscription } from 'rxjs';
import { distinctUntilChanged, filter, map, throttleTime } from 'rxjs/operators';
import { AuthService } from '../../services/auth.service';
import { BookingService } from '../../services/booking.service';
import { FavoriteService } from '../../services/favorite.service';
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
  private readonly favoriteService = inject(FavoriteService);
  private readonly router = inject(Router);
  private readonly hostElement = inject(ElementRef<HTMLElement>);
  @ViewChild('headerNavRoot') private headerNavRoot?: ElementRef<HTMLElement>;
  private headerContext: ReturnType<typeof setupHeaderAnimations> | null = null;
  private routeRefreshSub: Subscription | null = null;
  private favoriteCountSub: Subscription | null = null;
  private bookingCountIntervalId: ReturnType<typeof setInterval> | null = null;
  private bookingCountRequestInFlight = false;
  private bookingCountLastRequestedAt = 0;
  private bookingCountCooldownUntil = 0;
  private bookingCount429Streak = 0;
  private static readonly BOOKING_COUNT_MIN_INTERVAL_MS = 120000;
  private static readonly BOOKING_COUNT_INTERVAL_MS = 120000;
  private static readonly BOOKING_COUNT_ROUTER_THROTTLE_MS = 30000;
  protected readonly isProfileMenuOpen = signal(false);
  protected readonly isMainHeaderNavOpen = signal(false);
  protected readonly bookingCount = signal(0);
  protected readonly favoriteCount = signal(0);
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
    return this.authService.userData?.name?.trim() || 'Guest';
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
    this.favoriteCount.set(0);
    this.bookingCountRequestInFlight = false;
    this.bookingCountLastRequestedAt = 0;
    this.bookingCountCooldownUntil = 0;
    this.bookingCount429Streak = 0;
    this.isProfileMenuOpen.set(false);
    this.closeNavCollapse();
  }

  ngAfterViewInit(): void {
    this.headerContext = setupHeaderAnimations(
      this.hostElement.nativeElement,
      this.headerNavRoot?.nativeElement,
    );
    this.refreshBookingCount();
    this.favoriteCountSub = this.favoriteService.totalFavorites$.subscribe((count) => {
      this.favoriteCount.set(count);
    });
    this.refreshFavoriteCount();
    this.setupBookingCountAutoRefresh();
  }

  ngOnDestroy(): void {
    document.body.style.overflow = '';
    this.headerContext?.revert();
    this.headerContext = null;
    this.routeRefreshSub?.unsubscribe();
    this.routeRefreshSub = null;
    this.favoriteCountSub?.unsubscribe();
    this.favoriteCountSub = null;
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

  private refreshBookingCount(force = false): void {
    if (!this.authService.isLoggedIn()) {
      this.bookingCount.set(0);
      return;
    }

    const now = Date.now();
    if (this.bookingCountRequestInFlight) {
      return;
    }
    if (!force && now < this.bookingCountCooldownUntil) {
      return;
    }
    if (!force && now - this.bookingCountLastRequestedAt < Header.BOOKING_COUNT_MIN_INTERVAL_MS) {
      return;
    }

    this.bookingCountRequestInFlight = true;
    this.bookingCountLastRequestedAt = now;
    this.bookingService.getUserBookings({ page: 1, limit: 1, status: 'pending' }).subscribe({
      next: (response) => {
        this.bookingCount429Streak = 0;
        this.bookingCountCooldownUntil = 0;
        this.bookingCount.set(response.data?.pagination?.totalBookings ?? 0);
      },
      error: (err: unknown) => {
        const status =
          typeof err === 'object' && err && 'status' in err
            ? Number((err as { status?: number }).status)
            : 0;
        if (status === 429) {
          this.bookingCount429Streak = Math.min(this.bookingCount429Streak + 1, 5);
          const retryAfterMs = this.readRetryAfterMs(err);
          const exponentialMs = Math.min(
            300000,
            30000 * Math.pow(2, this.bookingCount429Streak - 1),
          );
          const cooldownMs = Math.max(retryAfterMs, exponentialMs);
          this.bookingCountCooldownUntil = Date.now() + cooldownMs;
          this.bookingCountRequestInFlight = false;
          return;
        }
        this.bookingCountRequestInFlight = false;
        this.bookingCount.set(0);
      },
      complete: () => {
        this.bookingCountRequestInFlight = false;
      },
    });
  }

  private readRetryAfterMs(err: unknown): number {
    if (!(err instanceof HttpErrorResponse)) {
      return 0;
    }
    const retryAfterRaw = err.headers?.get('Retry-After')?.trim();
    if (!retryAfterRaw) {
      return 0;
    }
    const asSeconds = Number(retryAfterRaw);
    if (Number.isFinite(asSeconds) && asSeconds > 0) {
      return Math.round(asSeconds * 1000);
    }
    const asDateMs = Date.parse(retryAfterRaw);
    if (Number.isNaN(asDateMs)) {
      return 0;
    }
    return Math.max(0, asDateMs - Date.now());
  }

  private setupBookingCountAutoRefresh(): void {
    this.routeRefreshSub?.unsubscribe();
    this.routeRefreshSub = this.router.events
      .pipe(
        filter((event): event is NavigationEnd => event instanceof NavigationEnd),
        map((event) => event.urlAfterRedirects),
        distinctUntilChanged(),
        throttleTime(Header.BOOKING_COUNT_ROUTER_THROTTLE_MS, undefined, {
          leading: true,
          trailing: true,
        }),
      )
      .subscribe(() => {
        this.refreshBookingCount();
        this.refreshFavoriteCount();
      });

    if (this.bookingCountIntervalId) {
      clearInterval(this.bookingCountIntervalId);
    }
    this.bookingCountIntervalId = setInterval(() => {
      this.refreshBookingCount();
      this.refreshFavoriteCount();
    }, Header.BOOKING_COUNT_INTERVAL_MS);
  }

  private refreshFavoriteCount(): void {
    if (!this.authService.isLoggedIn()) {
      this.favoriteCount.set(0);
      return;
    }

    this.favoriteService.getFavorites().subscribe({
      error: () => {
        this.favoriteCount.set(0);
      },
    });
  }

  private getActiveRoutePath(): string | undefined {
    let snapshot: ActivatedRouteSnapshot | null = this.router.routerState.snapshot.root;

    while (snapshot?.firstChild) {
      snapshot = snapshot.firstChild;
    }

    return snapshot?.routeConfig?.path;
  }
}
