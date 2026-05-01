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
import { ActivatedRouteSnapshot, Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';
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
  private readonly favoriteService = inject(FavoriteService);
  private readonly router = inject(Router);
  private readonly hostElement = inject(ElementRef<HTMLElement>);
  @ViewChild('headerNavRoot') private headerNavRoot?: ElementRef<HTMLElement>;
  private headerContext: ReturnType<typeof setupHeaderAnimations> | null = null;
  protected readonly isProfileMenuOpen = signal(false);
  protected readonly isMainHeaderNavOpen = signal(false);
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
      this.refreshFavoriteCount();
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
    this.favoriteCount.set(0);
    this.isProfileMenuOpen.set(false);
    this.closeNavCollapse();
  }

  ngAfterViewInit(): void {
    this.headerContext = setupHeaderAnimations(
      this.hostElement.nativeElement,
      this.headerNavRoot?.nativeElement,
    );
    this.refreshFavoriteCount();
  }

  ngOnDestroy(): void {
    document.body.style.overflow = '';
    this.headerContext?.revert();
    this.headerContext = null;
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

  private refreshFavoriteCount(): void {
    if (!this.authService.isLoggedIn()) {
      this.favoriteCount.set(0);
      return;
    }

    this.favoriteService.getFavorites().subscribe({
      next: (response) => {
        this.favoriteCount.set(response.data?.totalFavorites ?? 0);
      },
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
