import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { FeaturedEventCard } from '../../components/featured-event-card/featured-event-card';
import { mapEventApiItemToFeaturedCard } from '../../components/featured-event-card/featured-event-card.mapper';
import { FeaturedEventCardData } from '../../components/featured-event-card/featured-event-card.model';
import { EventApiItem, EventQueryOptions, EventService, EventSortField, EventSortOrder } from '../../services/event.service';

type EventCategoryTab = 'all' | 'concert' | 'conference' | 'workshop' | 'seminar' | 'sports' | 'other';

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
  imports: [CommonModule, FormsModule, FeaturedEventCard],
  templateUrl: './events.page.html',
  styleUrls: ['../../../sass/components/static-info-page.scss', './events.page.scss']
})
export class EventsPage implements OnInit, OnDestroy {
  private readonly eventService = inject(EventService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly destroy$ = new Subject<void>();

  protected readonly categoryTabs: readonly EventCategoryTab[] = [
    'all',
    'concert',
    'conference',
    'workshop',
    'seminar',
    'sports',
    'other'
  ] as const;

  protected readonly sortOptions: readonly { label: string; value: `${EventSortField}:${EventSortOrder}` }[] = [
    { label: 'Date (Soonest)', value: 'date:asc' },
    { label: 'Date (Latest)', value: 'date:desc' },
    { label: 'Price (Low to High)', value: 'price:asc' },
    { label: 'Price (High to Low)', value: 'price:desc' },
    { label: 'Title (A-Z)', value: 'title:asc' },
    { label: 'Title (Z-A)', value: 'title:desc' }
  ] as const;

  protected events: FeaturedEventCardData[] = [];
  protected isLoading = false;
  protected errorMessage = '';
  protected totalEvents = 0;
  protected areFiltersVisibleOnMobile = false;
  protected readonly fallbackEvents: EventApiItem[] = [
    {
      _id: 'dummy-1',
      title: 'Sunset Jazz Night',
      date: new Date().toISOString(),
      location: 'Cairo Opera House',
      category: 'concert',
      price: 35,
      image: '/images/Concert.png'
    },
    {
      _id: 'dummy-2',
      title: 'Future of Web Conference',
      date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      location: 'Alexandria Convention Center',
      category: 'conference',
      price: 120,
      image: '/images/Seminar.jpg'
    },
    {
      _id: 'dummy-3',
      title: 'Creative Design Workshop',
      date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
      location: 'Giza Innovation Hub',
      category: 'workshop',
      price: 55,
      image: '/images/Workshop.png'
    },
    {
      _id: 'dummy-4',
      title: 'Startup Growth Seminar',
      date: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(),
      location: 'Mansoura Business Hall',
      category: 'seminar',
      price: 40,
      image: '/images/Conference.jpg'
    }
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
    limit: 12
  };

  ngOnInit(): void {
    this.route.queryParamMap.pipe(takeUntil(this.destroy$)).subscribe((params) => {
      this.queryState = this.mapParamsToQueryState(params);
      this.loadEvents();
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
      minPrice: 0,
      maxPrice: 1000,
      sort: 'date',
      order: 'asc',
      page: 1
    };
    this.updateUrlFromQueryState();
  }

  protected retryLoad(): void {
    this.loadEvents();
  }

  private updateUrlFromQueryState(): void {
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: {
        name: this.queryState.name || null,
        categories: this.queryState.categories.length ? this.queryState.categories.join(',') : null,
        location: this.queryState.location || null,
        minPrice: this.queryState.minPrice > 0 ? this.queryState.minPrice : null,
        maxPrice: this.queryState.maxPrice < 1000 ? this.queryState.maxPrice : null,
        sort: this.queryState.sort === 'date' ? null : this.queryState.sort,
        order: this.queryState.order === 'asc' ? null : this.queryState.order,
        page: this.queryState.page > 1 ? this.queryState.page : null,
        limit: this.queryState.limit !== 12 ? this.queryState.limit : null
      },
      queryParamsHandling: ''
    });
  }

  private mapParamsToQueryState(params: import('@angular/router').ParamMap): EventsQueryState {
    const categoriesFromUrl = (params.get('categories') ?? '')
      .split(',')
      .map((value) => value.trim().toLowerCase())
      .filter(Boolean);
    const sortFromUrl = (params.get('sort') ?? 'date').toLowerCase();
    const orderFromUrl = (params.get('order') ?? 'asc').toLowerCase();
    const pageFromUrl = Number(params.get('page') ?? '1');
    const limitFromUrl = Number(params.get('limit') ?? '12');
    const minPriceFromUrl = Number(params.get('minPrice') ?? '0');
    const maxPriceFromUrl = Number(params.get('maxPrice') ?? '1000');

    const categories = categoriesFromUrl.filter((category) =>
      this.categoryTabs.includes(category as EventCategoryTab) && category !== 'all',
    ) as EventCategoryTab[];

    const allowedSorts: readonly EventSortField[] = ['date', 'price', 'title', 'createdAt'];
    const sort: EventSortField = allowedSorts.includes(sortFromUrl as EventSortField)
      ? (sortFromUrl as EventSortField)
      : 'date';

    const order: EventSortOrder = orderFromUrl === 'desc' ? 'desc' : 'asc';
    const page = Number.isFinite(pageFromUrl) && pageFromUrl > 0 ? Math.floor(pageFromUrl) : 1;
    const limit = Number.isFinite(limitFromUrl) && limitFromUrl > 0 ? Math.floor(limitFromUrl) : 12;

    return {
      name: (params.get('name') ?? '').trim(),
      categories,
      location: (params.get('location') ?? '').trim(),
      minPrice:
        Number.isFinite(minPriceFromUrl) && minPriceFromUrl >= 0 ? Math.floor(minPriceFromUrl) : 0,
      maxPrice:
        Number.isFinite(maxPriceFromUrl) && maxPriceFromUrl >= 0
          ? Math.floor(maxPriceFromUrl)
          : 1000,
      sort,
      order,
      page,
      limit
    };
  }

  private loadEvents(): void {
    this.isLoading = true;
    this.errorMessage = '';

    const query: EventQueryOptions = {
      name: this.queryState.name,
      category: this.queryState.categories.length === 1 ? this.queryState.categories[0] : undefined,
      location: this.queryState.location,
      minPrice: this.queryState.minPrice,
      maxPrice: this.queryState.maxPrice,
      sort: this.queryState.sort,
      order: this.queryState.order,
      page: this.queryState.page,
      limit: this.queryState.limit
    };

    this.eventService
      .getEvents(query)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          const apiEvents = response.data?.events ?? [];
          const filteredEvents =
            this.queryState.categories.length > 1
              ? apiEvents.filter((event) =>
                  this.queryState.categories.includes(event.category as EventCategoryTab),
                )
              : apiEvents;
          const sourceEvents = filteredEvents.length ? filteredEvents : this.fallbackEvents;
          this.events = sourceEvents.map((event) => mapEventApiItemToFeaturedCard(event));
          this.totalEvents = this.events.length;
          this.isLoading = false;
        },
        error: () => {
          this.events = this.fallbackEvents.map((event) => mapEventApiItemToFeaturedCard(event));
          this.totalEvents = this.events.length;
          this.errorMessage = '';
          this.isLoading = false;
        }
      });
  }
}
