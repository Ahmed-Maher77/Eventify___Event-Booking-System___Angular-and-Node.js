import { CommonModule } from '@angular/common';
import { AfterViewInit, Component, CUSTOM_ELEMENTS_SCHEMA, ElementRef, HostListener, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { FeaturedEventCard } from '../featured-event-card/featured-event-card';
import { FeaturedEventCardData } from '../featured-event-card/featured-event-card.model';
import { SectionHeadingComponent } from '../../shared/section-heading/section-heading';
import { register } from 'swiper/element/bundle';
import type { SwiperContainer } from 'swiper/element';

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

  protected readonly events: FeaturedEventCardData[] = [
    {
      id: 'evt-1',
      title: 'Neon Nights 2024',
      category: 'Concert',
      dateText: 'Oct 24, 2024 • 20:00',
      location: 'Madison Square Garden, NY',
      priceFrom: '$45.00',
      imageUrl: '/images/Concert.png'
    },
    {
      id: 'evt-2',
      title: 'Neon Nights 2024',
      category: 'Workshop',
      dateText: 'Oct 24, 2024 • 20:00',
      location: 'Madison Square Garden, NY',
      priceFrom: '$45.00',
      imageUrl: '/images/Workshop.png'
    },
    {
      id: 'evt-3',
      title: 'Neon Nights 2024',
      category: 'Conference',
      dateText: 'Oct 24, 2024 • 20:00',
      location: 'Madison Square Garden, NY',
      priceFrom: '$45.00',
      imageUrl: '/images/Conference.jpg'
    },
    {
      id: 'evt-4',
      title: 'Neon Nights 2024',
      category: 'Seminar',
      dateText: 'Oct 24, 2024 • 20:00',
      location: 'Madison Square Garden, NY',
      priceFrom: '$45.00',
      imageUrl: '/images/Seminar.jpg'
    },
    {
      id: 'evt-5',
      title: 'City Beats Festival',
      category: 'Concert',
      dateText: 'Nov 2, 2024 • 19:30',
      location: 'Staples Center, LA',
      priceFrom: '$39.00',
      imageUrl: '/images/Concert-1.png'
    },
    {
      id: 'evt-6',
      title: 'Championship Fan Day',
      category: 'Sports',
      dateText: 'Nov 18, 2024 • 17:00',
      location: 'National Arena, Chicago',
      priceFrom: '$32.00',
      imageUrl: '/images/Sports.jpg'
    },
    // {
    //   id: 'evt-7',
    //   title: 'Creative Communities Meetup',
    //   category: 'Other',
    //   dateText: 'Dec 1, 2024 • 18:30',
    //   location: 'Downtown Hub, Austin',
    //   priceFrom: '$18.00',
    //   imageUrl: 'https://www.figma.com/api/mcp/asset/c057786c-9e8f-48cb-a74a-308d3c9f12b7'
    // }
  ];

  protected setCategory(category: (typeof this.categories)[number]): void {
    if (this.activeCategory === category) {
      return;
    }

    this.activeCategory = category;
    this.isFiltering = true;
    this.updateResponsiveState();

    this.scheduleUiSync();
  }

  protected get filteredEvents(): FeaturedEventCardData[] {
    if (this.activeCategory === 'All') {
      return this.events;
    }

    return this.events.filter((event) => event.category === this.activeCategory);
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
}
