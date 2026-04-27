import { CommonModule } from '@angular/common';
import { AfterViewInit, Component, CUSTOM_ELEMENTS_SCHEMA, ElementRef, HostListener, OnDestroy, OnInit, ViewChild, inject } from '@angular/core';
import { FeaturedEventCard } from '../featured-event-card/featured-event-card';
import { FeaturedEventCardData } from '../featured-event-card/featured-event-card.model';
import { SectionHeadingComponent } from '../../shared/section-heading/section-heading';
import { EventApiItem, EventService } from '../../services/event.service';
import { register } from 'swiper/element/bundle';
import type { SwiperContainer } from 'swiper/element';
import { Subscription } from 'rxjs';

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
  private readonly eventService = inject(EventService);

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

  protected get shouldUseSwiper(): boolean {
    return this.filteredEvents.length > this.currentSlidesPerView;
  }

  ngOnInit(): void {
    // Initialize responsive-driven template values before first change detection cycle.
    this.updateResponsiveState();
    this.loadFeaturedEvents();
  }

  ngAfterViewInit(): void {
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

    this.featuredEventsSubscription?.unsubscribe();
    this.featuredEventsSubscription = null;
  }

  @HostListener('window:resize')
  protected onWindowResize(): void {
    this.updateResponsiveState();
    this.configureSwiper();
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
    if (!this.shouldUseSwiper || !this.featuredSwiper) {
      return;
    }

    const swiperElement = this.featuredSwiper.nativeElement;
    if (!swiperElement.isConnected) {
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
  }

  private scheduleUiSync(): void {
    if (this.syncUiRafId !== null) {
      cancelAnimationFrame(this.syncUiRafId);
      this.syncUiRafId = null;
    }

    this.syncUiRafId = requestAnimationFrame(() => {
      this.syncUiRafId = null;
      this.configureSwiper();

      const swiperElement = this.featuredSwiper?.nativeElement;
      const swiper = swiperElement?.swiper;
      if (this.shouldUseSwiper && swiper) {
        swiper.update();
        if (this.filteredEvents.length > 0) {
          swiper.slideTo(0, 380);
        }
      }

      this.animateFilteredSlides();

      if (this.filterAnimationTimeoutId) {
        clearTimeout(this.filterAnimationTimeoutId);
      }

      this.filterAnimationTimeoutId = setTimeout(() => {
        this.isFiltering = false;
        this.filterAnimationTimeoutId = null;
      }, 420);
    });
  }

  private loadFeaturedEvents(): void {
    this.featuredEventsSubscription?.unsubscribe();
    this.featuredEventsSubscription = this.eventService
      .getFeaturedEvents({
        category: this.toApiCategory(this.activeCategory),
        limit: 12
      })
      .subscribe({
        next: (response) => {
          this.events = (response.data?.events ?? []).map((event) => this.mapEventToCard(event));
          this.updateResponsiveState();
          this.scheduleUiSync();
        },
        error: () => {
          this.events = [];
          this.updateResponsiveState();
          this.scheduleUiSync();
        }
      });
  }

  private toApiCategory(category: (typeof this.categories)[number]): string | undefined {
    if (category === 'All') {
      return undefined;
    }

    return category.toLowerCase();
  }

  private mapEventToCard(event: EventApiItem): FeaturedEventCardData {
    return {
      id: event._id,
      title: event.title,
      category: this.toDisplayCategory(event.category),
      dateText: this.formatEventDate(event.date),
      location: event.location,
      priceFrom: `$${Number(event.price).toFixed(2)}`,
      imageUrl: event.image || '/images/event-placeholder.svg'
    };
  }

  private toDisplayCategory(rawCategory: string): string {
    const normalized = rawCategory.trim().toLowerCase();
    const knownCategories: Record<string, string> = {
      concert: 'Concert',
      conference: 'Conference',
      workshop: 'Workshop',
      seminar: 'Seminar',
      sports: 'Sports'
    };

    return knownCategories[normalized] ?? 'Other';
  }

  private formatEventDate(dateIso: string): string {
    const date = new Date(dateIso);
    if (Number.isNaN(date.getTime())) {
      return dateIso;
    }

    const datePart = new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    }).format(date);
    const timePart = new Intl.DateTimeFormat('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    }).format(date);

    return `${datePart} • ${timePart}`;
  }
}
