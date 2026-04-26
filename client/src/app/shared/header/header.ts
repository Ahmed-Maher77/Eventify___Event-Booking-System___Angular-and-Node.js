import { Component, ElementRef, HostListener, ViewChild, inject, signal } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { Button } from '../button/button';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, Button],
  templateUrl: './header.html',
  styleUrl: './header.scss',
})
export class Header {
  private readonly authService = inject(AuthService);
  private readonly hostElement = inject(ElementRef<HTMLElement>);
  @ViewChild('headerNavRoot') private headerNavRoot?: ElementRef<HTMLElement>;
  @ViewChild('mainHeaderNavRef') private mainHeaderNavRef?: ElementRef<HTMLElement>;
  @ViewChild('headerTogglerRef') private headerTogglerRef?: ElementRef<HTMLButtonElement>;
  protected readonly isProfileMenuOpen = signal(false);
  protected readonly navLinks = [
    { label: 'Home', route: '/' },
    { label: 'About Us', route: '/about' },
    { label: 'FAQ', route: '/faq' },
    { label: 'Contact', route: '/contact' },
  ] as const;
  protected readonly profileImageUrl =
    'https://ui-avatars.com/api/?name=Profile&background=E7C873&color=1A1A1A&bold=true';

  protected isLoggedIn(): boolean {
    return this.authService.isLoggedIn();
  }

  protected toggleProfileMenu(): void {
    this.isProfileMenuOpen.update((value) => !value);
  }

  protected onNavItemClick(): void {
    this.closeNavCollapse();
    this.isProfileMenuOpen.set(false);
  }

  protected logout(): void {
    this.authService.logout();
    this.isProfileMenuOpen.set(false);
    this.closeNavCollapse();
  }

  @HostListener('document:click', ['$event'])
  protected handleDocumentClick(event: MouseEvent): void {
    const target = event.target as Node | null;
    if (!target || !this.isNavCollapseOpen()) {
      return;
    }

    const navRoot = this.headerNavRoot?.nativeElement ?? this.hostElement.nativeElement;
    if (!navRoot.contains(target)) {
      this.closeNavCollapse();
      this.isProfileMenuOpen.set(false);
    }
  }

  @HostListener('window:resize')
  protected handleResize(): void {
    if (window.matchMedia('(min-width: 992px)').matches) {
      this.closeNavCollapse();
    }
  }

  private isNavCollapseOpen(): boolean {
    return this.mainHeaderNavRef?.nativeElement.classList.contains('show') ?? false;
  }

  private closeNavCollapse(): void {
    const collapseElement = this.mainHeaderNavRef?.nativeElement;
    if (!collapseElement) {
      return;
    }

    collapseElement.classList.remove('show');
    collapseElement.classList.remove('collapsing');

    this.headerTogglerRef?.nativeElement.setAttribute('aria-expanded', 'false');
  }
}
