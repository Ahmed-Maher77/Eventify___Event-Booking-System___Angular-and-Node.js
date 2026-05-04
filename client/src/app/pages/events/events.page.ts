import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit, inject, signal, ChangeDetectorRef } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject, finalize, switchMap, takeUntil } from 'rxjs';
import { FeaturedEventCard } from '../../components/featured-event-card/featured-event-card';
import { mapEventApiItemToFeaturedCard } from '../../components/featured-event-card/featured-event-card.mapper';
import { FeaturedEventCardData } from '../../components/featured-event-card/featured-event-card.model';
import { Button } from '../../shared/button/button';
import { HighlightedPageHeadingComponent } from '../../shared/highlighted-page-heading/highlighted-page-heading';
import { SectionLoader } from '../../shared/section-loader/section-loader';
import {
  EventApiItem,
  EventsApiResponse,
  EventQueryOptions,
  EventService,
  EventSortField,
  EventSortOrder,
} from '../../services/event.service';
import { FavoriteService } from '../../services/favorite.service';
import { AuthService } from '../../services/auth.service';
import { environment } from '../../../environments/environment';

type EventCategoryTab =
  | 'all'
  | 'concert'
  | 'conference'
  | 'workshop'
  | 'seminar'
  | 'sports'
  | 'other';
type PaginationToken = number | 'ellipsis-left' | 'ellipsis-right';

interface EventsQueryState {
  name: string;
  categories: EventCategoryTab[];
  location: string;
  minPrice: number;
  maxPrice: number;
  sort: EventSortField;
  order: EventSortOrder;
  page: number;
  limit: number;
}

@Component({
  selector: 'app-events-page',
  standalone: true,
  imports: [CommonModule, FormsModule, FeaturedEventCard, Button, HighlightedPageHeadingComponent, SectionLoader],
  templateUrl: './events.page.html',
  styleUrls: ['../../../sass/components/static-info-page.scss', './events.page.scss'],
})
export class EventsPage implements OnInit, OnDestroy {
  private readonly eventService = inject(EventService);
  private readonly favoriteService = inject(FavoriteService);
  private readonly authService = inject(AuthService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly destroy$ = new Subject<void>();
  private readonly defaultPageLimit = 10;
  protected readonly minAllowedPrice = 0;
  protected readonly maxAllowedPrice = 1000;
  protected readonly priceStep = 10;

  protected readonly categoryTabs: readonly EventCategoryTab[] = [
    'all',
    'concert',
    'conference',
    'workshop',
    'seminar',
    'sports',
    'other',
  ] as const;

  protected readonly sortOptions: readonly {
    label: string;
    value: `${EventSortField}:${EventSortOrder}`;
  }[] = [
    { label: 'Date (Soonest)', value: 'date:asc' },
    { label: 'Date (Latest)', value: 'date:desc' },
    { label: 'Price (Low to High)', value: 'price:asc' },
    { label: 'Price (High to Low)', value: 'price:desc' },
    { label: 'Title (A-Z)', value: 'title:asc' },
    { label: 'Title (Z-A)', value: 'title:desc' },
  ] as const;

  protected events: FeaturedEventCardData[] = [];
  protected readonly isLoading = signal(false);
  protected errorMessage = '';
  protected totalEvents = 0;
  protected totalPages = 1;
  /** True when the API returned non-matching rows and we dropped them in the browser — totals are for the visible list only. */
  protected eventTotalsAreClientFiltered = false;
  protected areFiltersVisibleOnMobile = false;
  protected animationSeed = 0;
  protected readonly favoriteEventIds = new Set<string>();
  protected readonly fallbackEvents: EventApiItem[] = [
    {
      _id: 'dummy-1',
      title: 'Sunset Jazz Night',
      date: new Date().toISOString(),
      location: 'Cairo Opera House',
      category: 'concert',
      price: 35,
      image: '/images/Concert.png',
    },
    {
      _id: 'dummy-2',
      title: 'Future of Web Conference',
      date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      location: 'Alexandria Convention Center',
      category: 'conference',
      price: 120,
      image: '/images/Seminar.jpg',
    },
    {
      _id: 'dummy-3',
      title: 'Creative Design Workshop',
      date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
      location: 'Giza Innovation Hub',
      category: 'workshop',
      price: 55,
      image: '/images/Workshop.png',
    },
    {
      _id: 'dummy-4',
      title: 'Startup Growth Seminar',
      date: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(),
      location: 'Mansoura Business Hall',
      category: 'seminar',
      price: 40,
      image: '/images/Conference.jpg',
    },
    {
      _id: 'dummy-5',
      title: 'Sunset Jazz Night',
      date: new Date().toISOString(),
      location: 'Cairo Opera House',
      category: 'concert',
      price: 35,
      image: '/images/Concert.png',
    },
    {
      _id: 'dummy-6',
      title: 'Future of Web Conference',
      date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      location: 'Alexandria Convention Center',
      category: 'conference',
      price: 120,
      image: '/images/Seminar.jpg',
    },
    {
      _id: 'dummy-7',
      title: 'Creative Design Workshop',
      date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
      location: 'Giza Innovation Hub',
      category: 'workshop',
      price: 55,
      image: '/images/Workshop.png',
    },
    {
      _id: 'dummy-8',
      title: 'Startup Growth Seminar',
      date: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(),
      location: 'Mansoura Business Hall',
      category: 'seminar',
      price: 40,
      image: '/images/Conference.jpg',
    },
    {
      _id: 'dummy-9',
      title: 'Sunset Jazz Night',
      date: new Date().toISOString(),
      location: 'Cairo Opera House',
      category: 'concert',
      price: 35,
      image: '/images/Concert.png',
    },
    {
      _id: 'dummy-10',
      title: 'Future of Web Conference',
      date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      location: 'Alexandria Convention Center',
      category: 'conference',
      price: 120,
      image: '/images/Seminar.jpg',
    },
    {
      _id: 'dummy-11',
      title: 'Creative Design Workshop',
      date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
      location: 'Giza Innovation Hub',
      category: 'workshop',
      price: 55,
      image: '/images/Workshop.png',
    },
    {
      _id: 'dummy-12',
      title: 'Startup Growth Seminar',
      date: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(),
      location: 'Mansoura Business Hall',
      category: 'seminar',
      price: 40,
      image: '/images/Conference.jpg',
    },
    {
      _id: 'dummy-13',
      title: 'Sunset Jazz Night',
      date: new Date().toISOString(),
      location: 'Cairo Opera House',
      category: 'concert',
      price: 35,
      image: '/images/Concert.png',
    },
    {
      _id: 'dummy-14',
      title: 'Future of Web Conference',
      date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      location: 'Alexandria Convention Center',
      category: 'conference',
      price: 120,
      image: '/images/Seminar.jpg',
    },
    {
      _id: 'dummy-15',
      title: 'Creative Design Workshop',
      date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
      location: 'Giza Innovation Hub',
      category: 'workshop',
      price: 55,
      image: '/images/Workshop.png',
    },
    {
      _id: 'dummy-16',
      title: 'Startup Growth Seminar',
      date: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(),
      location: 'Mansoura Business Hall',
      category: 'seminar',
      price: 40,
      image: '/images/Conference.jpg',
    },
    {
      _id: 'dummy-17',
      title: 'Sunset Jazz Night',
      date: new Date().toISOString(),
      location: 'Cairo Opera House',
      category: 'concert',
      price: 35,
      image: '/images/Concert.png',
    },
  ];

  // Template-bound state for search/filter/sort controls.
  protected queryState: EventsQueryState = {
    name: '',
    categories: [],
    location: '',
    minPrice: 0,
    maxPrice: 1000,
    sort: 'date',
    order: 'asc',
    page: 1,
    limit: this.defaultPageLimit,
  };

  ngOnInit(): void {
    if (this.authService.isLoggedIn()) {
      this.loadFavoriteEventIds();
    }

    this.route.queryParamMap
      .pipe(
        takeUntil(this.destroy$),
        switchMap((params) => {
          this.queryState = this.mapParamsToQueryState(params);
          this.isLoading.set(true);
          this.errorMessage = '';
          return this.eventService.getEvents(this.buildEventQueryOptions()).pipe(
            finalize(() => {
              this.isLoading.set(false);
              this.cdr.detectChanges();
            }),
          );
        }),
      )
      .subscribe({
        next: (response) => {
          this.applyEventsApiResponse(response);
          this.cdr.detectChanges();
        },
        error: () => {
          this.applyFallbackPagination();
          this.errorMessage = '';
          this.animationSeed += 1;
        },
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  protected onSearchSubmit(): void {
    // Template hook: call on search form submit.
    this.queryState.page = 1;
    this.updateUrlFromQueryState();
  }

  protected onSearchInputChanged(): void {
    // Template hook: call on input change if you want live search.
  }

  protected toggleCategory(category: EventCategoryTab): void {
    if (category === 'all') {
      this.queryState.categories = [];
      this.queryState.page = 1;
      this.updateUrlFromQueryState();
      return;
    }

    const hasCategory = this.queryState.categories.includes(category);
    this.queryState.categories = hasCategory
      ? this.queryState.categories.filter((item) => item !== category)
      : [...this.queryState.categories, category];
    this.queryState.page = 1;
    this.updateUrlFromQueryState();
  }

  protected isCategoryChecked(category: EventCategoryTab): boolean {
    if (category === 'all') {
      return this.queryState.categories.length === 0;
    }

    return this.queryState.categories.includes(category);
  }

  protected applySidebarFilters(): void {
    this.queryState.page = 1;
    this.updateUrlFromQueryState();
    this.areFiltersVisibleOnMobile = false;
  }

  protected toggleMobileFilters(): void {
    this.areFiltersVisibleOnMobile = !this.areFiltersVisibleOnMobile;
  }

  protected onSortChanged(combinedValue: `${EventSortField}:${EventSortOrder}`): void {
    // Template sends a combined `sort:order` value from the select.
    const [sort, order] = combinedValue.split(':') as [EventSortField, EventSortOrder];
    this.queryState.sort = sort;
    this.queryState.order = order;
    this.queryState.page = 1;
    this.updateUrlFromQueryState();
  }

  protected clearFilters(): void {
    this.queryState = {
      ...this.queryState,
      name: '',
      categories: [],
      location: '',
      minPrice: this.minAllowedPrice,
      maxPrice: this.maxAllowedPrice,
      sort: 'date',
      order: 'asc',
      page: 1,
    };
    this.updateUrlFromQueryState();
  }

  protected onMaxPriceChanged(value: number | string): void {
    const parsed = typeof value === 'string' ? Number(value) : value;
    const fallback = Number.isFinite(parsed) ? parsed : this.maxAllowedPrice;
    const snapped = Math.round(fallback / this.priceStep) * this.priceStep;
    const clamped = Math.min(this.maxAllowedPrice, Math.max(this.minAllowedPrice, snapped));
    this.queryState.maxPrice = clamped;
  }

  protected get maxPriceProgress(): number {
    const range = this.maxAllowedPrice - this.minAllowedPrice;
    if (range <= 0) {
      return 0;
    }

    return ((this.queryState.maxPrice - this.minAllowedPrice) / range) * 100;
  }

  protected get formattedMaxPrice(): string {
    return `$${this.queryState.maxPrice.toLocaleString()}`;
  }

  protected retryLoad(): void {
    this.queryState = this.mapParamsToQueryState(this.route.snapshot.queryParamMap);
    this.isLoading.set(true);
    this.errorMessage = '';
    this.eventService
      .getEvents(this.buildEventQueryOptions())
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => {
          this.isLoading.set(false);
        }),
      )
      .subscribe({
        next: (response) => {
          this.applyEventsApiResponse(response);
        },
        error: () => {
          this.applyFallbackPagination();
          this.errorMessage = '';
          this.animationSeed += 1;
        },
      });
  }

  protected onFavoriteToggled(eventId: string): void {
    if (!this.authService.isLoggedIn()) {
      void this.router.navigate(['/login']);
      return;
    }

    this.favoriteService.toggleFavorite(eventId).subscribe({
      next: (response) => {
        const isFavorite = response.data?.isFavorite ?? false;
        if (isFavorite) {
          this.favoriteEventIds.add(eventId);
        } else {
          this.favoriteEventIds.delete(eventId);
        }
        this.events = this.events.map((event) =>
          event.id === eventId ? { ...event, isFavorite } : event,
        );
      },
      error: () => {
        // Keep current UI state if toggle request fails.
      },
    });
  }

  protected goToPage(page: number): void {
    const targetPage = Math.max(1, Math.min(page, this.totalPages));
    if (targetPage === this.queryState.page) {
      return;
    }

    this.queryState.page = targetPage;
    this.updateUrlFromQueryState();
  }

  protected goToNextPage(): void {
    this.goToPage(this.queryState.page + 1);
  }

  protected goToPreviousPage(): void {
    this.goToPage(this.queryState.page - 1);
  }

  protected get hasPreviousPage(): boolean {
    return this.queryState.page > 1;
  }

  protected get hasNextPage(): boolean {
    return this.queryState.page < this.totalPages;
  }

  protected get paginationTokens(): PaginationToken[] {
    const total = this.totalPages;
    const current = this.queryState.page;
    if (total <= 0) {
      return [];
    }

    if (total <= 5) {
      return Array.from({ length: total }, (_, idx) => idx + 1);
    }

    const tokens: PaginationToken[] = [1];
    const middleStart = Math.max(2, current - 1);
    const middleEnd = Math.min(total - 1, current + 1);

    if (middleStart > 2) {
      tokens.push('ellipsis-left');
    }

    for (let page = middleStart; page <= middleEnd; page += 1) {
      tokens.push(page);
    }

    if (middleEnd < total - 1) {
      tokens.push('ellipsis-right');
    }

    tokens.push(total);
    return tokens;
  }

  /** `?debugFilters=1` in the URL, or `environment.debugEventFilters` in dev builds. */
  private isEventFilterDebug(params?: import('@angular/router').ParamMap): boolean {
    const fromMap = params?.get('debugFilters');
    const fromSnapshot = this.route.snapshot.queryParamMap.get('debugFilters');
    return (fromMap ?? fromSnapshot) === '1' || environment.debugEventFilters === true;
  }

  private updateUrlFromQueryState(): void {
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: {
        name: this.queryState.name || null,
        // Array → repeated `categories=` keys so we never lose values (comma in one param or `get()` vs `getAll()`).
        categories: this.queryState.categories.length ? [...this.queryState.categories] : null,
        location: this.queryState.location || null,
        minPrice: this.queryState.minPrice > this.minAllowedPrice ? this.queryState.minPrice : null,
        maxPrice: this.queryState.maxPrice < this.maxAllowedPrice ? this.queryState.maxPrice : null,
        sort: this.queryState.sort === 'date' ? null : this.queryState.sort,
        order: this.queryState.order === 'asc' ? null : this.queryState.order,
        page: this.queryState.page > 1 ? this.queryState.page : null,
        limit: null,
        debugFilters: this.isEventFilterDebug() ? '1' : null,
      },
      queryParamsHandling: '',
    });
  }

  private mapParamsToQueryState(params: import('@angular/router').ParamMap): EventsQueryState {
    let categoriesFromUrl = [
      ...new Set(
        params
          .getAll('categories')
          .flatMap((segment) =>
            segment
              .split(',')
              .map((value) => value.trim().toLowerCase())
              .filter(Boolean),
          ),
      ),
    ];
    const legacyCategory = (params.get('category') ?? '').trim().toLowerCase();
    if (categoriesFromUrl.length === 0 && legacyCategory && legacyCategory !== 'all') {
      categoriesFromUrl = [legacyCategory];
    }
    const sortFromUrl = (params.get('sort') ?? 'date').toLowerCase();
    const orderFromUrl = (params.get('order') ?? 'asc').toLowerCase();
    const pageFromUrl = Number(params.get('page') ?? '1');
    const minPriceFromUrl = Number(params.get('minPrice') ?? `${this.minAllowedPrice}`);
    const maxPriceFromUrl = Number(params.get('maxPrice') ?? `${this.maxAllowedPrice}`);

    const categories = categoriesFromUrl.filter(
      (category) => this.categoryTabs.includes(category as EventCategoryTab) && category !== 'all',
    ) as EventCategoryTab[];

    const allowedSorts: readonly EventSortField[] = ['date', 'price', 'title', 'createdAt'];
    const sort: EventSortField = allowedSorts.includes(sortFromUrl as EventSortField)
      ? (sortFromUrl as EventSortField)
      : 'date';

    const order: EventSortOrder = orderFromUrl === 'desc' ? 'desc' : 'asc';
    const page = Number.isFinite(pageFromUrl) && pageFromUrl > 0 ? Math.floor(pageFromUrl) : 1;
    const limit = this.defaultPageLimit;

    return {
      name: (params.get('name') ?? '').trim(),
      categories,
      location: (params.get('location') ?? '').trim(),
      minPrice:
        Number.isFinite(minPriceFromUrl) && minPriceFromUrl >= this.minAllowedPrice
          ? Math.min(this.maxAllowedPrice, Math.floor(minPriceFromUrl))
          : this.minAllowedPrice,
      maxPrice:
        Number.isFinite(maxPriceFromUrl) && maxPriceFromUrl >= this.minAllowedPrice
          ? Math.min(this.maxAllowedPrice, Math.floor(maxPriceFromUrl))
          : this.maxAllowedPrice,
      sort,
      order,
      page,
      limit,
    };
  }

  private buildEventQueryOptions(): EventQueryOptions {
    const name = this.queryState.name?.trim() ?? '';
    const location = this.queryState.location?.trim() ?? '';
    const debugFilters = this.isEventFilterDebug();
    return {
      name: name || undefined,
      categories:
        this.queryState.categories.length > 0 ? [...this.queryState.categories] : undefined,
      location: location || undefined,
      minPrice:
        this.queryState.minPrice > this.minAllowedPrice ? this.queryState.minPrice : undefined,
      maxPrice:
        this.queryState.maxPrice < this.maxAllowedPrice ? this.queryState.maxPrice : undefined,
      sort: this.queryState.sort,
      order: this.queryState.order,
      page: this.queryState.page,
      limit: this.queryState.limit,
      debugFilters,
    };
  }

  /** When the API ignores category filters, drop rows that do not match the current sidebar selection. */
  private narrowApiEventsToSelectedCategories(events: EventApiItem[]): EventApiItem[] {
    if (this.queryState.categories.length === 0) {
      return events;
    }
    const allowed = new Set(this.queryState.categories.map((c) => c.toLowerCase()));
    return events.filter((e) => allowed.has(String(e?.category ?? '').toLowerCase()));
  }

  private applyEventsApiResponse(response: EventsApiResponse): void {
    try {
      const rawEvents = response.data?.events ?? [];
      const apiEvents = this.narrowApiEventsToSelectedCategories(rawEvents);
      const serverReturnedUnfilteredRows =
        this.queryState.categories.length > 0 &&
        rawEvents.length > 0 &&
        apiEvents.length < rawEvents.length;
      const pagination = response.data?.pagination;
      const hasServerPagination =
        pagination != null &&
        typeof pagination.totalPages === 'number' &&
        typeof pagination.totalEvents === 'number';
      const responseLimit = Number(pagination?.limit);
      const effectiveLimit =
        Number.isFinite(responseLimit) && responseLimit > 0
          ? Math.floor(responseLimit)
          : this.queryState.limit;
      const normalizedLimit = Math.max(1, effectiveLimit);
      this.queryState.limit = effectiveLimit;

      if (hasServerPagination) {
        let totalEventsCount = pagination.totalEvents;
        let totalPagesCount = Math.max(1, pagination.totalPages);
        this.eventTotalsAreClientFiltered = false;
        if (serverReturnedUnfilteredRows) {
          // Ratio-based totals implied more matches than are visible on this page — confusing (e.g. "9" vs 3 cards).
          // Use only what we can prove from the narrowed page until the API filters correctly.
          this.eventTotalsAreClientFiltered = true;
          totalEventsCount = apiEvents.length;
          totalPagesCount = Math.max(1, Math.ceil(totalEventsCount / normalizedLimit));
        }
        this.totalEvents = totalEventsCount;
        this.totalPages = totalPagesCount;
        if (this.queryState.page > this.totalPages) {
          this.queryState.page = this.totalPages;
          this.updateUrlFromQueryState();
          return;
        }
        this.events = apiEvents.map((event: EventApiItem) => {
          const card = mapEventApiItemToFeaturedCard(event);
          return { ...card, isFavorite: this.favoriteEventIds.has(card.id) };
        });
      } else {
        this.eventTotalsAreClientFiltered = false;
        const total = apiEvents.length;
        this.totalEvents = total;
        this.totalPages = Math.max(1, Math.ceil(total / normalizedLimit));
        if (this.queryState.page > this.totalPages) {
          this.queryState.page = this.totalPages;
          this.updateUrlFromQueryState();
          return;
        }
        const slice = apiEvents.slice(
          (this.queryState.page - 1) * normalizedLimit,
          this.queryState.page * normalizedLimit,
        );
        this.events = slice.map((event: EventApiItem) => {
          const card = mapEventApiItemToFeaturedCard(event);
          return { ...card, isFavorite: this.favoriteEventIds.has(card.id) };
        });
      }
      this.animationSeed += 1;
    } catch {
      this.applyFallbackPagination();
      this.errorMessage = '';
      this.animationSeed += 1;
    }
  }

  private applyFallbackPagination(): void {
    this.eventTotalsAreClientFiltered = false;
    const normalizedLimit = Math.max(1, this.queryState.limit);
    const totalFallbackEvents = this.fallbackEvents.length;
    this.totalEvents = totalFallbackEvents;
    this.totalPages = Math.max(1, Math.ceil(totalFallbackEvents / normalizedLimit));

    if (this.queryState.page > this.totalPages) {
      this.queryState.page = this.totalPages;
      this.updateUrlFromQueryState();
      return;
    }

    const pagedFallbackEvents = this.fallbackEvents.slice(
      (this.queryState.page - 1) * normalizedLimit,
      this.queryState.page * normalizedLimit,
    );
    this.events = pagedFallbackEvents.map((event) => mapEventApiItemToFeaturedCard(event));
  }

  private loadFavoriteEventIds(): void {
    this.favoriteService.getFavorites().subscribe({
      next: (response) => {
        const favorites = response.data?.favorites ?? [];
        this.favoriteEventIds.clear();
        favorites.forEach((event) => {
          if (event?._id) {
            this.favoriteEventIds.add(event._id);
          }
        });
      },
      error: () => {
        this.favoriteEventIds.clear();
      },
    });
  }
}
