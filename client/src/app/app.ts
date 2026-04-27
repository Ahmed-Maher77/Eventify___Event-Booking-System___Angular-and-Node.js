import { Component, DestroyRef, OnDestroy, inject, signal } from '@angular/core';
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
import { ScrollTrigger } from 'gsap/ScrollTrigger';

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
  private scrollAnimationFrameId: number | null = null;
  private loaderShownAtMs = 0;
  private hideLoaderTimeoutId: ReturnType<typeof setTimeout> | null = null;
  protected readonly title = signal('eventify-client');
  protected readonly isNavigating = signal(false);

  constructor() {
    this.router.events.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((event) => {
      if (event instanceof NavigationStart) {
        if (this.hideLoaderTimeoutId) {
          clearTimeout(this.hideLoaderTimeoutId);
          this.hideLoaderTimeoutId = null;
        }
        this.loaderShownAtMs = performance.now();
        this.isNavigating.set(true);
      }

      if (event instanceof NavigationEnd) {
        this.animateScrollToTop();
      }

      if (event instanceof NavigationEnd || event instanceof NavigationCancel || event instanceof NavigationError) {
        const elapsedMs = performance.now() - this.loaderShownAtMs;
        const remainingMs = Math.max(0, 250 - elapsedMs);

        if (remainingMs === 0) {
          this.isNavigating.set(false);
          this.syncAnimationsAfterLoader();
        } else {
          this.hideLoaderTimeoutId = setTimeout(() => {
            this.isNavigating.set(false);
            this.syncAnimationsAfterLoader();
            this.hideLoaderTimeoutId = null;
          }, remainingMs);
        }
      }
    });
  }

  ngOnDestroy(): void {
    if (this.scrollAnimationFrameId !== null) {
      cancelAnimationFrame(this.scrollAnimationFrameId);
      this.scrollAnimationFrameId = null;
    }
    if (this.hideLoaderTimeoutId) {
      clearTimeout(this.hideLoaderTimeoutId);
      this.hideLoaderTimeoutId = null;
    }
  }

  protected isLoggedIn(): boolean {
    return this.authService.isLoggedIn();
  }

  protected isAdmin(): boolean {
    return this.authService.isAdmin();
  }

  protected showAdminSidebar(): boolean {
    return this.isLoggedIn() && this.isAdmin() && this.isAdminRoute();
  }

  private isAdminRoute(): boolean {
    const [pathWithoutQuery] = this.router.url.split('?');
    const [pathWithoutHash] = pathWithoutQuery.split('#');
    return pathWithoutHash.startsWith('/dashboard');
  }

  private animateScrollToTop(durationMs = 650): void {
    if (typeof window === 'undefined') {
      return;
    }

    const startY = window.scrollY || window.pageYOffset;
    if (startY <= 0) {
      return;
    }

    if (this.scrollAnimationFrameId !== null) {
      cancelAnimationFrame(this.scrollAnimationFrameId);
      this.scrollAnimationFrameId = null;
    }

    const startTime = performance.now();

    const easeInOutCubic = (t: number): number =>
      t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

    const step = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / durationMs, 1);
      const easedProgress = easeInOutCubic(progress);
      const nextY = Math.round(startY * (1 - easedProgress));

      window.scrollTo(0, nextY);

      if (progress < 1) {
        this.scrollAnimationFrameId = requestAnimationFrame(step);
      } else {
        this.scrollAnimationFrameId = null;
      }
    };

    this.scrollAnimationFrameId = requestAnimationFrame(step);
  }

  private syncAnimationsAfterLoader(): void {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        ScrollTrigger.refresh();

        // Ensure sections currently in viewport animate after loader disappears.
        for (const trigger of ScrollTrigger.getAll()) {
          if (trigger.isActive && trigger.animation) {
            trigger.animation.restart();
          }
        }
      });
    });
  }
}
