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
import { ChatStoreService } from './services/chat-store.service';
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
  private readonly chatStoreService = inject(ChatStoreService);
  private scrollAnimationFrameId: number | null = null;
  private loaderShownAtMs = 0;
  private hideLoaderTimeoutId: ReturnType<typeof setTimeout> | null = null;
  private assistantReplyTimeoutId: ReturnType<typeof setTimeout> | null = null;
  private readonly chatbotHintStorageKey = 'eventifyChatbotHintDismissed';
  protected readonly title = signal('eventify-client');
  protected readonly isNavigating = signal(false);
  protected readonly useFaqTheme = signal(false);
  protected readonly chatMessages = this.chatStoreService.messages;
  protected readonly isChatScreenActive = this.chatStoreService.isChatScreenActive;
  protected readonly isAssistantOnline = this.chatStoreService.isAssistantOnline;
  protected readonly chatDraftMessage = signal('');
  protected readonly showChatbotHint = signal(false);

  constructor() {
    this.router.events.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((event) => {
      if (event instanceof NavigationStart) {
        if (!this.shouldShowGlobalLoaderForNavigation(event.url)) {
          return;
        }

        if (this.hideLoaderTimeoutId) {
          clearTimeout(this.hideLoaderTimeoutId);
          this.hideLoaderTimeoutId = null;
        }
        this.loaderShownAtMs = performance.now();
        this.isNavigating.set(true);
      }

      if (event instanceof NavigationEnd) {
        this.redirectAdminToDashboardIfNeeded();
        this.animateScrollToTop();
        this.updateRouteThemeFlags();
      }

      if (
        event instanceof NavigationEnd ||
        event instanceof NavigationCancel ||
        event instanceof NavigationError
      ) {
        if (!this.isNavigating()) {
          return;
        }

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

    this.redirectAdminToDashboardIfNeeded();
    this.updateRouteThemeFlags();
    this.initializeChatbotHintState();
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
    if (this.assistantReplyTimeoutId) {
      clearTimeout(this.assistantReplyTimeoutId);
      this.assistantReplyTimeoutId = null;
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

  protected openFloatingChat(): void {
    this.chatStoreService.activateChatScreen();
    this.dismissChatbotHint();
  }

  protected closeFloatingChat(): void {
    this.chatStoreService.deactivateChatScreen();
  }

  protected submitFloatingChatMessage(): void {
    const message = this.chatDraftMessage().trim();
    if (!message) {
      return;
    }

    this.chatStoreService.addUserMessage(message);
    this.chatDraftMessage.set('');

    if (this.assistantReplyTimeoutId) {
      clearTimeout(this.assistantReplyTimeoutId);
    }

    this.assistantReplyTimeoutId = setTimeout(() => {
      this.chatStoreService.addAssistantMessage(
        'I can help you discover events by date, category, budget, or location. Tell me what you want and I will suggest the best options.',
      );
      this.assistantReplyTimeoutId = null;
    }, 700);
  }

  protected onFloatingChatSubmit(event: Event): void {
    event.preventDefault();
    this.submitFloatingChatMessage();
  }

  protected onChatDraftInput(event: Event): void {
    const input = event.target as HTMLInputElement | null;
    this.chatDraftMessage.set(input?.value ?? '');
  }

  protected dismissChatbotHint(): void {
    if (!this.showChatbotHint()) {
      return;
    }

    this.showChatbotHint.set(false);
    if (typeof window !== 'undefined') {
      localStorage.setItem(this.chatbotHintStorageKey, 'true');
    }
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

  private updateRouteThemeFlags(): void {
    const isHomeRoute = this.router.url === '/' || this.router.url.startsWith('/?');
    const isNotFoundRoute = this.getActiveLeafRoutePath() === '**';
    this.useFaqTheme.set(!isHomeRoute && !isNotFoundRoute);
  }

  private initializeChatbotHintState(): void {
    if (typeof window === 'undefined') {
      this.showChatbotHint.set(false);
      return;
    }

    const wasDismissed = localStorage.getItem(this.chatbotHintStorageKey) === 'true';
    this.showChatbotHint.set(!wasDismissed);
  }

  private redirectAdminToDashboardIfNeeded(): void {
    if (!this.isLoggedIn() || !this.isAdmin() || this.isAdminRoute()) {
      return;
    }

    void this.router.navigate(['/dashboard']);
  }

  private getActiveLeafRoutePath(): string | null {
    let node = this.router.routerState.snapshot.root;

    while (node.firstChild) {
      node = node.firstChild;
    }

    return node.routeConfig?.path ?? null;
  }

  private shouldShowGlobalLoaderForNavigation(nextUrl: string): boolean {
    const normalizePath = (url: string): string => {
      const [withoutQuery] = url.split('?');
      const [withoutHash] = withoutQuery.split('#');
      return withoutHash;
    };

    return normalizePath(this.router.url) !== normalizePath(nextUrl);
  }
}
