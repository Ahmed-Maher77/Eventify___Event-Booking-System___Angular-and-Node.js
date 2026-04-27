import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { EventApiItem, EventQueryOptions, EventService, EventSortField, EventSortOrder } from '../../services/event.service';

type EventCategoryTab = 'all' | 'concert' | 'conference' | 'workshop' | 'seminar' | 'sports' | 'other';

interface EventsQueryState {
  name: string;
  category: EventCategoryTab;
  sort: EventSortField;
  order: EventSortOrder;
  page: number;
  limit: number;
}

@Component({
  selector: 'app-events-page',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './events.page.html',
  styleUrl: '../../../sass/components/static-info-page.scss'
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

  protected events: EventApiItem[] = [];
  protected isLoading = false;
  protected errorMessage = '';
  protected totalEvents = 0;

  // Template-bound state for search/filter/sort controls.
  protected queryState: EventsQueryState = {
    name: '',
    category: 'all',
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

  protected setCategory(category: EventCategoryTab): void {
    if (this.queryState.category === category) {
      return;
    }

    this.queryState.category = category;
    this.queryState.page = 1;
    this.updateUrlFromQueryState();
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
      category: 'all',
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
        category: this.queryState.category === 'all' ? null : this.queryState.category,
        sort: this.queryState.sort === 'date' ? null : this.queryState.sort,
        order: this.queryState.order === 'asc' ? null : this.queryState.order,
        page: this.queryState.page > 1 ? this.queryState.page : null,
        limit: this.queryState.limit !== 12 ? this.queryState.limit : null
      },
      queryParamsHandling: ''
    });
  }

  private mapParamsToQueryState(params: import('@angular/router').ParamMap): EventsQueryState {
    const categoryFromUrl = (params.get('category') ?? 'all').toLowerCase();
    const sortFromUrl = (params.get('sort') ?? 'date').toLowerCase();
    const orderFromUrl = (params.get('order') ?? 'asc').toLowerCase();
    const pageFromUrl = Number(params.get('page') ?? '1');
    const limitFromUrl = Number(params.get('limit') ?? '12');

    const category = this.categoryTabs.includes(categoryFromUrl as EventCategoryTab)
      ? (categoryFromUrl as EventCategoryTab)
      : 'all';

    const allowedSorts: readonly EventSortField[] = ['date', 'price', 'title', 'createdAt'];
    const sort: EventSortField = allowedSorts.includes(sortFromUrl as EventSortField)
      ? (sortFromUrl as EventSortField)
      : 'date';

    const order: EventSortOrder = orderFromUrl === 'desc' ? 'desc' : 'asc';
    const page = Number.isFinite(pageFromUrl) && pageFromUrl > 0 ? Math.floor(pageFromUrl) : 1;
    const limit = Number.isFinite(limitFromUrl) && limitFromUrl > 0 ? Math.floor(limitFromUrl) : 12;

    return {
      name: (params.get('name') ?? '').trim(),
      category,
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
      category: this.queryState.category,
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
          this.events = response.data?.events ?? [];
          this.totalEvents = response.data?.pagination?.totalEvents ?? this.events.length;
          this.isLoading = false;
        },
        error: () => {
          this.events = [];
          this.totalEvents = 0;
          this.errorMessage = 'Unable to load events right now. Please try again.';
          this.isLoading = false;
        }
      });
  }
}
