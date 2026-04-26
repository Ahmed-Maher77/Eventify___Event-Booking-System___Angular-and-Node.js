import { Component, inject, signal } from '@angular/core';
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

  protected logout(): void {
    this.authService.logout();
    this.isProfileMenuOpen.set(false);
  }
}
