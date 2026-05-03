import { CommonModule } from '@angular/common';
import {
  AfterViewInit,
  ChangeDetectorRef,
  Component,
  CUSTOM_ELEMENTS_SCHEMA,
  ElementRef,
  HostListener,
  isDevMode,
  NgZone,
  OnDestroy,
  OnInit,
  ViewChild,
  inject,
} from '@angular/core';
import { FeaturedEventCard } from '../featured-event-card/featured-event-card';
import { FeaturedEventCardData } from '../featured-event-card/featured-event-card.model';
import { mapEventApiItemToFeaturedCard } from '../featured-event-card/featured-event-card.mapper';
import { SectionHeadingComponent } from '../../shared/section-heading/section-heading';
import { EventService } from '../../services/event.service';
import { register } from 'swiper/element/bundle';
import type { SwiperContainer } from 'swiper/element';
import { Subscription, finalize } from 'rxjs';

register();

@Component({
  selector: 'app-featured-events-section',
  imports: [CommonModule, FeaturedEventCard, SectionHeadingComponent],
  templateUrl: './featured-events-section.html',
  styleUrl: './featured-events-section.scss',
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class FeaturedEventsSection implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('featuredSectionRoot') private featuredSectionRoot?: ElementRef<HTMLElement>;
  @ViewChild('featuredSwiper') private featuredSwiper?: ElementRef<SwiperContainer>;
  @ViewChild('featuredPagination') private featuredPagination?: ElementRef<HTMLElement>;
  @ViewChild('chipsTrack') private chipsTrack?: ElementRef<HTMLElement>;
  private filterAnimationTimeoutId: ReturnType<typeof setTimeout> | null = null;
  private syncUiRafId: number | null = null;
  private featuredEventsSubscription: Subscription | null = null;
  private sectionLayoutObserver: ResizeObserver | null = null;
  private sectionVisibilityObserver: IntersectionObserver | null = null;
  /** Coalesced rAF so ResizeObserver work runs after the browser finishes delivery (avoids Zone "loop" ErrorEvent). */
  private resizeObserverRafId: number | null = null;
  private layoutRetryCount = 0;
  private readonly eventService = inject(EventService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly ngZone = inject(NgZone);

  protected readonly categories = [
    'All',
    'Concert',
    'Conference',
    'Workshop',
    'Seminar',
    'Sports',
    'Other'
  ] as const;

  protected readonly categoryIcons: Record<(typeof this.categories)[number], string> = {
    All: 'fa-solid fa-grip',
    Concert: 'fa-solid fa-music',
    Conference: 'fa-solid fa-users-line',
    Workshop: 'fa-regular fa-lightbulb',
    Seminar: 'fa-solid fa-graduation-cap',
    Sports: 'fa-solid fa-futbol',
    Other: 'fa-solid fa-ellipsis'
  };

  protected activeCategory: (typeof this.categories)[number] = 'All';
  protected isFiltering = false;
  protected hasTabsOverflow = false;
  protected canScrollTabsLeft = false;
  protected canScrollTabsRight = false;
  protected currentSlidesPerView = 1;
  protected showPagination = false;

  protected events: FeaturedEventCardData[] = [];
  protected isLoadingEvents = true;
  protected loadError: string | null = null;

  protected setCategory(category: (typeof this.categories)[number]): void {
    if (this.activeCategory === category) {
      return;
    }

    this.activeCategory = category;
    this.isFiltering = true;
    this.updateResponsiveState();
    this.loadFeaturedEvents();
  }

  protected get filteredEvents(): FeaturedEventCardData[] {
    return this.events;
  }

  protected get hasCategories(): boolean {
    return this.categories.length > 0;
  }

  protected get hasFilteredEvents(): boolean {
    return this.filteredEvents.length > 0;
  }

  protected retryLoadFeatured(): void {
    this.loadFeaturedEvents();
  }

  protected get shouldUseSwiper(): boolean {
    return this.filteredEvents.length > this.currentSlidesPerView;
  }

  ngOnInit(): void {
    // Initialize responsive-driven template values before first change detection cycle.
    this.updateResponsiveState();
    this.loadFeaturedEvents();
  }

  ngAfterViewInit(): void {
    this.attachSectionLayoutWatchers();
    this.configureSwiper();
    queueMicrotask(() => this.updateTabsOverflowState());
  }

  ngOnDestroy(): void {
    if (this.filterAnimationTimeoutId) {
      clearTimeout(this.filterAnimationTimeoutId);
      this.filterAnimationTimeoutId = null;
    }

    if (this.syncUiRafId !== null) {
      cancelAnimationFrame(this.syncUiRafId);
      this.syncUiRafId = null;
    }

    if (this.resizeObserverRafId !== null) {
      cancelAnimationFrame(this.resizeObserverRafId);
      this.resizeObserverRafId = null;
    }

    this.featuredEventsSubscription?.unsubscribe();
    this.featuredEventsSubscription = null;
    this.detachSectionLayoutWatchers();
  }

  @HostListener('window:resize')
  protected onWindowResize(): void {
    this.updateResponsiveState();
    this.configureSwiper();
    this.patchSwiperLayout('window-resize');
    this.updateTabsOverflowState();
  }

  protected scrollTabs(direction: 'left' | 'right'): void {
    const chipsElement = this.chipsTrack?.nativeElement;
    if (!chipsElement) {
      return;
    }

    const scrollStep = Math.max(180, Math.round(chipsElement.clientWidth * 0.55));
    chipsElement.scrollBy({
      left: direction === 'right' ? scrollStep : -scrollStep,
      behavior: 'smooth'
    });
  }

  protected updateTabsOverflowState(): void {
    const chipsElement = this.chipsTrack?.nativeElement;
    if (!chipsElement) {
      return;
    }

    const maxScrollLeft = chipsElement.scrollWidth - chipsElement.clientWidth;
    this.hasTabsOverflow = maxScrollLeft > 4;
    this.canScrollTabsLeft = chipsElement.scrollLeft > 4;
    this.canScrollTabsRight = chipsElement.scrollLeft < maxScrollLeft - 4;
  }

  protected getCategoryIcon(category: (typeof this.categories)[number]): string {
    return this.categoryIcons[category];
  }

  /** Dev-only tracing for Swiper / layout timing issues. */
  private dbg(message: string, detail?: Record<string, unknown>): void {
    if (!isDevMode()) {
      return;
    }
    if (detail) {
      console.debug(`[FeaturedEvents] ${message}`, detail);
    } else {
      console.debug(`[FeaturedEvents] ${message}`);
    }
  }

  private attachSectionLayoutWatchers(): void {
    this.detachSectionLayoutWatchers();
    const root = this.featuredSectionRoot?.nativeElement;
    if (!root) {
      this.dbg('attachSectionLayoutWatchers: no #featuredSectionRoot');
      return;
    }

    if (typeof ResizeObserver !== 'undefined') {
      this.sectionLayoutObserver = new ResizeObserver(() => {
        if (this.resizeObserverRafId !== null) {
          cancelAnimationFrame(this.resizeObserverRafId);
        }
        this.resizeObserverRafId = requestAnimationFrame(() => {
          this.resizeObserverRafId = null;
          this.ngZone.run(() => {
            this.dbg('ResizeObserver: section box changed (rAF)');
            this.updateResponsiveState();
            this.configureSwiper();
            this.patchSwiperLayout('resize-observer');
          });
        });
      });
      this.sectionLayoutObserver.observe(root);
    }

    if (typeof IntersectionObserver !== 'undefined') {
      this.sectionVisibilityObserver = new IntersectionObserver(
        (entries) => {
          const hit = entries.some((e) => e.isIntersecting);
          const ratios = entries.map((e) => Number(e.intersectionRatio.toFixed(3)));
          this.dbg('IntersectionObserver callback', { hit, ratios });
          if (!hit) {
            return;
          }
          requestAnimationFrame(() => {
            this.ngZone.run(() => {
              this.dbg('IntersectionObserver: visible — remeasuring Swiper (rAF)');
              this.updateResponsiveState();
              this.configureSwiper();
              this.patchSwiperLayout('intersection');
              this.cdr.markForCheck();
            });
          });
        },
        { root: null, rootMargin: '140px 0px', threshold: [0, 0.01, 0.05] }
      );
      this.sectionVisibilityObserver.observe(root);
    }
  }

  private detachSectionLayoutWatchers(): void {
    this.sectionLayoutObserver?.disconnect();
    this.sectionLayoutObserver = null;
    this.sectionVisibilityObserver?.disconnect();
    this.sectionVisibilityObserver = null;
  }

  /** Swiper often measures 0×0 when initialized off-screen; force a geometry pass. */
  private patchSwiperLayout(source: string): void {
    if (!this.shouldUseSwiper) {
      return;
    }

    const host = this.featuredSwiper?.nativeElement;
    const swiper = host?.swiper;
    if (!host?.isConnected || !swiper) {
      this.dbg('patchSwiperLayout: skipped', {
        source,
        hasViewChild: !!this.featuredSwiper,
        hasInstance: !!swiper,
      });
      return;
    }

    const rect = host.getBoundingClientRect();
    this.dbg('patchSwiperLayout', {
      source,
      width: rect.width,
      height: rect.height,
      slides: swiper.slides?.length,
    });

    swiper.updateSize();
    swiper.updateSlides();
    swiper.update();
    if (this.filteredEvents.length > 0) {
      swiper.slideTo(0, 0);
    }
  }

  private scheduleLayoutRetry(reason: string): void {
    const maxRetries = 6;
    if (this.layoutRetryCount >= maxRetries) {
      this.dbg('scheduleLayoutRetry: max retries', { reason, maxRetries });
      return;
    }
    this.layoutRetryCount += 1;
    setTimeout(() => {
      this.ngZone.run(() => {
        this.dbg('layout retry tick', { reason, attempt: this.layoutRetryCount });
        this.updateResponsiveState();
        this.configureSwiper();
        this.patchSwiperLayout(`retry:${reason}`);
        this.cdr.markForCheck();
      });
    }, 0);
  }

  private animateFilteredSlides(): void {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return;
    }

    const sectionRoot = this.featuredSectionRoot?.nativeElement;
    if (!sectionRoot) {
      return;
    }

    const targets = Array.from(sectionRoot.querySelectorAll('.featured-events__animatable-item')) as HTMLElement[];
    targets.forEach((target, index) => {
      target.getAnimations().forEach((animation) => animation.cancel());
      target.animate(
        [
          { opacity: 0, transform: 'translateY(18px) scale(0.985)', filter: 'blur(4px)' },
          { opacity: 1, transform: 'translateY(0) scale(1)', filter: 'blur(0)' }
        ],
        {
          duration: 420,
          delay: index * 55,
          easing: 'cubic-bezier(0.22, 1, 0.36, 1)',
          fill: 'both'
        }
      );
    });
  }

  private updateResponsiveState(): void {
    const width = window.innerWidth;
    if (width >= 1200) {
      this.currentSlidesPerView = 4;
    } else if (width >= 992) {
      this.currentSlidesPerView = 3;
    } else if (width >= 768) {
      this.currentSlidesPerView = 2;
    } else if (width >= 640) {
      this.currentSlidesPerView = 1.2;
    } else {
      this.currentSlidesPerView = 1;
    }

    this.showPagination = this.filteredEvents.length > this.currentSlidesPerView;
  }

  private configureSwiper(): void {
    if (!this.shouldUseSwiper) {
      this.dbg('configureSwiper: skip (shouldUseSwiper false)');
      return;
    }

    if (!this.featuredSwiper) {
      this.dbg('configureSwiper: #featuredSwiper not ready — scheduling retry');
      if (this.filteredEvents.length > 0) {
        this.scheduleLayoutRetry('viewchild-missing');
      }
      return;
    }

    const swiperElement = this.featuredSwiper.nativeElement;
    if (!swiperElement.isConnected) {
      this.dbg('configureSwiper: swiper host not connected');
      return;
    }

    const paginationElement = this.featuredPagination?.nativeElement;

    Object.assign(swiperElement, {
      slidesPerView: this.currentSlidesPerView,
      spaceBetween: 16,
      loop: false,
      watchOverflow: true,
      updateOnWindowResize: true,
      observer: true,
      observeParents: true,
      resizeObserver: true,
      centerInsufficientSlides: false,
      pagination: paginationElement
        ? {
            clickable: true,
            el: paginationElement,
            enabled: this.showPagination
          }
        : false,
      breakpoints: {
        640: { slidesPerView: 1.2, spaceBetween: 16 },
        768: { slidesPerView: 2, spaceBetween: 18 },
        992: { slidesPerView: 3, spaceBetween: 20 },
        1200: { slidesPerView: 4, spaceBetween: 20 }
      }
    });

    if (swiperElement.swiper) {
      swiperElement.swiper.params.slidesPerView = this.currentSlidesPerView;
      swiperElement.swiper.updateSize();
      swiperElement.swiper.updateSlides();
      swiperElement.swiper.update();
      return;
    }

    swiperElement.initialize();
    queueMicrotask(() => this.patchSwiperLayout('post-initialize-microtask'));
  }

  private runFeaturedSyncPass(source: string, options: { animate: boolean }): void {
    this.updateResponsiveState();
    const host = this.featuredSwiper?.nativeElement;
    const rect = host?.getBoundingClientRect();
    this.dbg('runFeaturedSyncPass', {
      source,
      eventCount: this.filteredEvents.length,
      shouldUseSwiper: this.shouldUseSwiper,
      hasSwiperViewChild: !!this.featuredSwiper,
      swiperBox: rect ? { w: rect.width, h: rect.height } : null,
    });

    this.configureSwiper();
    this.patchSwiperLayout(source);

    if (options.animate) {
      this.animateFilteredSlides();
    }

    this.updateTabsOverflowState();
    this.cdr.markForCheck();
  }

  private scheduleUiSync(): void {
    if (this.syncUiRafId !== null) {
      cancelAnimationFrame(this.syncUiRafId);
      this.syncUiRafId = null;
    }

    this.syncUiRafId = requestAnimationFrame(() => {
      this.syncUiRafId = null;
      this.layoutRetryCount = 0;

      this.runFeaturedSyncPass('rAF:1-layout', { animate: false });

      requestAnimationFrame(() => {
        this.runFeaturedSyncPass('rAF:2-layout+animate', { animate: true });

        if (this.filterAnimationTimeoutId) {
          clearTimeout(this.filterAnimationTimeoutId);
        }

        this.filterAnimationTimeoutId = setTimeout(() => {
          this.isFiltering = false;
          this.filterAnimationTimeoutId = null;
          this.cdr.markForCheck();
        }, 420);
      });
    });
  }

  private loadFeaturedEvents(): void {
    this.featuredEventsSubscription?.unsubscribe();
    this.layoutRetryCount = 0;
    this.isLoadingEvents = true;
    this.loadError = null;
    this.featuredEventsSubscription = this.eventService
      .getFeaturedEvents({
        category: this.toApiCategory(this.activeCategory),
        limit: 12
      })
      .pipe(
        finalize(() => {
          this.isLoadingEvents = false;
          this.cdr.markForCheck();
        })
      )
      .subscribe({
        next: (response) => {
          const list = response.data?.events ?? [];
          this.events = list.map((event) => mapEventApiItemToFeaturedCard(event));
          this.loadError = null;
          this.updateResponsiveState();
          this.scheduleUiSync();
          this.cdr.markForCheck();
        },
        error: () => {
          this.events = [];
          this.loadError = 'We could not load events right now. Check your connection and try again.';
          this.updateResponsiveState();
          this.scheduleUiSync();
          this.cdr.markForCheck();
        },
      });
  }

  private toApiCategory(category: (typeof this.categories)[number]): string | undefined {
    if (category === 'All') {
      return undefined;
    }

    return category.toLowerCase();
  }

}
