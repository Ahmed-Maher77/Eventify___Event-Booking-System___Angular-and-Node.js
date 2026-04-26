import { CommonModule } from '@angular/common';
import { AfterViewInit, Component, CUSTOM_ELEMENTS_SCHEMA, ElementRef, HostListener, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { FeaturedEventCard, FeaturedEventCardData } from '../featured-event-card/featured-event-card';
import { register } from 'swiper/element/bundle';
import type { SwiperContainer } from 'swiper/element';

register();

@Component({
  selector: 'app-featured-events-section',
  imports: [CommonModule, FeaturedEventCard],
  templateUrl: './featured-events-section.html',
  styleUrl: './featured-events-section.scss',
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class FeaturedEventsSection implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('featuredSwiper') private featuredSwiper?: ElementRef<SwiperContainer>;
  @ViewChild('featuredPagination') private featuredPagination?: ElementRef<HTMLElement>;
  @ViewChild('chipsTrack') private chipsTrack?: ElementRef<HTMLElement>;
  private filterAnimationTimeoutId: ReturnType<typeof setTimeout> | null = null;

  protected readonly categories = [
    'All',
    'Concert',
    'Conference',
    'Workshop',
    'Seminar',
    'Sports',
    'Other'
  ] as const;

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
      imageUrl: 'https://www.figma.com/api/mcp/asset/88bc1705-a422-4af1-ba4f-470b4ecb3f4b'
    },
    {
      id: 'evt-2',
      title: 'Neon Nights 2024',
      category: 'Workshop',
      dateText: 'Oct 24, 2024 • 20:00',
      location: 'Madison Square Garden, NY',
      priceFrom: '$45.00',
      imageUrl: 'https://www.figma.com/api/mcp/asset/82ac87e3-00f8-424e-8e17-368c43c8ffa2'
    },
    {
      id: 'evt-3',
      title: 'Neon Nights 2024',
      category: 'Conference',
      dateText: 'Oct 24, 2024 • 20:00',
      location: 'Madison Square Garden, NY',
      priceFrom: '$45.00',
      imageUrl: 'https://www.figma.com/api/mcp/asset/7a4aa944-7f1f-47ac-935a-d13db23e9c6f'
    },
    {
      id: 'evt-4',
      title: 'Neon Nights 2024',
      category: 'Seminar',
      dateText: 'Oct 24, 2024 • 20:00',
      location: 'Madison Square Garden, NY',
      priceFrom: '$45.00',
      imageUrl: 'https://www.figma.com/api/mcp/asset/c057786c-9e8f-48cb-a74a-308d3c9f12b7'
    },
    {
      id: 'evt-5',
      title: 'City Beats Festival',
      category: 'Concert',
      dateText: 'Nov 2, 2024 • 19:30',
      location: 'Staples Center, LA',
      priceFrom: '$39.00',
      imageUrl: 'https://www.figma.com/api/mcp/asset/88bc1705-a422-4af1-ba4f-470b4ecb3f4b'
    },
    {
      id: 'evt-6',
      title: 'Championship Fan Day',
      category: 'Sports',
      dateText: 'Nov 18, 2024 • 17:00',
      location: 'National Arena, Chicago',
      priceFrom: '$32.00',
      imageUrl: 'https://www.figma.com/api/mcp/asset/7a4aa944-7f1f-47ac-935a-d13db23e9c6f'
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

    // Keep slider behavior smooth after filtering.
    queueMicrotask(() => {
      this.configureSwiper();
      const swiperElement = this.featuredSwiper?.nativeElement;
      const swiper = swiperElement?.swiper;
      if (this.shouldUseSwiper && swiper) {
        swiper.update();
        swiper.slideTo(0, 380);
        this.animateFilteredSlides();
      }

      if (this.filterAnimationTimeoutId) {
        clearTimeout(this.filterAnimationTimeoutId);
      }

      this.filterAnimationTimeoutId = setTimeout(() => {
        this.isFiltering = false;
        this.filterAnimationTimeoutId = null;
      }, 420);
    });
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

  private animateFilteredSlides(): void {
    const swiperElement = this.featuredSwiper?.nativeElement;
    if (!swiperElement || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return;
    }

    const slides = Array.from(swiperElement.querySelectorAll('swiper-slide')) as HTMLElement[];
    slides.forEach((slide, index) => {
      slide.animate(
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

    const paginationElement = this.featuredPagination?.nativeElement;

    Object.assign(this.featuredSwiper.nativeElement, {
      slidesPerView: 1,
      spaceBetween: 16,
      loop: false,
      watchOverflow: true,
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

    if (this.featuredSwiper.nativeElement.swiper) {
      this.featuredSwiper.nativeElement.swiper.update();
      return;
    }

    this.featuredSwiper.nativeElement.initialize();
  }
}
