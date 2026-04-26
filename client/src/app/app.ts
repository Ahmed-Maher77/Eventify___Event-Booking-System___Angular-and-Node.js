import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  NavigationCancel,
  NavigationEnd,
  NavigationError,
  NavigationStart,
  Router,
  RouterOutlet,
} from '@angular/router';
import { AuthService } from './services/auth.service';
import { AdminSidebar } from './shared/admin-sidebar/admin-sidebar';
import { Footer } from './shared/footer/footer';
import { Header } from './shared/header/header';
import { Loader } from './shared/loader/loader';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, Loader, Header, AdminSidebar, Footer],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private readonly authService = inject(AuthService);
  protected readonly title = signal('eventify-client');
  protected readonly isNavigating = signal(false);

  constructor() {
    this.router.events.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((event) => {
      if (event instanceof NavigationStart) {
        this.isNavigating.set(true);
      }

      if (
        event instanceof NavigationEnd ||
        event instanceof NavigationCancel ||
        event instanceof NavigationError
      ) {
        this.isNavigating.set(false);
      }
    });
  }

  protected isLoggedIn(): boolean {
    return this.authService.isLoggedIn();
  }

  protected isAdmin(): boolean {
    return this.authService.isAdmin();
  }

  protected showAdminSidebar(): boolean {
    return this.isLoggedIn() && this.isAdmin();
  }
}
