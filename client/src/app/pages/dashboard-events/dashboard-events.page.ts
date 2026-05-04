import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnDestroy, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject, debounceTime, distinctUntilChanged, finalize, takeUntil } from 'rxjs';
import { AdminEntityPaginationComponent } from '../../shared/admin-entity-pagination/admin-entity-pagination.component';
import { AdminEventFormModalComponent } from '../../shared/admin-event-form-modal/admin-event-form-modal.component';
import { Button } from '../../shared/button/button';
import {
  CustomNativeSelectComponent,
  CustomNativeSelectOption,
} from '../../shared/custom-native-select/custom-native-select';
import { HighlightedPageHeadingComponent } from '../../shared/highlighted-page-heading/highlighted-page-heading';
import { SectionLoader } from '../../shared/section-loader/section-loader';
import {
  CreateEventPayload,
  EventApiItem,
  EventQueryOptions,
  EventService,
  EventSortField,
  EventSortOrder,
  EventStatusFilter,
} from '../../services/event.service';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-dashboard-events-page',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    HighlightedPageHeadingComponent,
    Button,
    SectionLoader,
    CustomNativeSelectComponent,
    AdminEventFormModalComponent,
    AdminEntityPaginationComponent,
  ],
  templateUrl: './dashboard-events.page.html',
  styleUrl: './dashboard-events.page.scss'
})
export class DashboardEventsPage implements OnInit, OnDestroy {
  private static readonly CATALOG_IMAGE_FALLBACK = '/images/event-placeholder.svg';
  private readonly eventService = inject(EventService);
  private readonly toast = inject(ToastService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly fb = inject(FormBuilder);
  private readonly destroy$ = new Subject<void>();

  protected readonly categoryOptions: Array<CreateEventPayload['category']> = [
    'concert',
    'conference',
    'workshop',
    'seminar',
    'sports',
    'other'
  ];

  protected readonly catalogSortOptions: CustomNativeSelectOption[] = [
    { value: 'date', label: 'Date' },
    { value: 'title', label: 'Title' },
    { value: 'price', label: 'Price' },
    { value: 'createdAt', label: 'Created' }
  ];

  protected readonly catalogOrderOptions: CustomNativeSelectOption[] = [
    { value: 'asc', label: 'Ascending' },
    { value: 'desc', label: 'Descending' }
  ];

  protected readonly catalogStatusOptions: CustomNativeSelectOption[] = [
    { value: '', label: 'All statuses' },
    { value: 'upcoming', label: 'Upcoming' },
    { value: 'ongoing', label: 'Ongoing' },
    { value: 'completed', label: 'Completed' },
    { value: 'cancelled', label: 'Cancelled' }
  ];

  protected readonly catalogCategoryFilterOptions: CustomNativeSelectOption[] = [
    { value: '', label: 'All categories' },
    ...this.categoryOptions.map((c) => ({ value: c, label: c }))
  ];

  protected readonly catalogFilterForm = this.fb.nonNullable.group({
    search: [''],
    location: [''],
    category: [''],
    status: [''],
    sort: ['date' as EventSortField],
    order: ['asc' as EventSortOrder]
  });
  protected readonly events = signal<EventApiItem[]>([]);
  protected readonly isLoadingEvents = signal(false);
  protected readonly catalogPage = signal(1);
  protected readonly catalogTotalPages = signal(1);
  protected readonly catalogTotalEvents = signal(0);
  protected readonly catalogPageSize = EventService.MAX_EVENTS_PER_PAGE;
  protected readonly catalogFiltersExpanded = signal(false);
  protected isAddModalOpen = false;
  protected readonly editingEventId = signal<string | null>(null);
  protected readonly eventPendingDelete = signal<EventApiItem | null>(null);
  protected readonly isDeletingEvent = signal(false);
  protected listErrorMessage = '';

  ngOnInit(): void {
    this.route.queryParamMap.pipe(takeUntil(this.destroy$)).subscribe((params) => {
      const editParam = params.get('editEvent');
      const addOpen = params.get('addEvent') === 'true';
      const editId =
        editParam && /^[a-f0-9]{24}$/i.test(editParam) ? editParam : null;

      if (editId) {
        this.isAddModalOpen = true;
        this.editingEventId.set(editId);
        return;
      }

      this.editingEventId.set(null);

      if (addOpen) {
        this.isAddModalOpen = true;
        return;
      }

      this.isAddModalOpen = false;
    });

    this.catalogFilterForm.valueChanges
      .pipe(
        debounceTime(280),
        distinctUntilChanged(
          (a, b) => JSON.stringify(a) === JSON.stringify(b)
        ),
        takeUntil(this.destroy$)
      )
      .subscribe(() => {
        this.catalogPage.set(1);
        this.loadEvents();
      });

    this.loadEvents();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  protected catalogEventImageSrc(event: EventApiItem): string {
    const raw = (event.image ?? '').trim();
    return raw || DashboardEventsPage.CATALOG_IMAGE_FALLBACK;
  }

  protected goToCatalogPage(page: number): void {
    const total = this.catalogTotalPages();
    const next = Math.max(1, Math.min(page, total));
    if (next === this.catalogPage()) {
      return;
    }
    this.catalogPage.set(next);
    this.loadEvents();
  }

  protected clearCatalogFilters(): void {
    this.catalogFilterForm.reset(
      {
        search: '',
        location: '',
        category: '',
        status: '',
        sort: 'date',
        order: 'asc'
      },
      { emitEvent: false }
    );
    this.catalogPage.set(1);
    this.loadEvents();
  }

  protected hasActiveCatalogFilters(): boolean {
    const v = this.catalogFilterForm.getRawValue();
    return !!(
      (v.search ?? '').trim() ||
      (v.location ?? '').trim() ||
      (v.category ?? '').trim() ||
      (v.status ?? '').trim()
    );
  }

  protected toggleCatalogFilters(): void {
    this.catalogFiltersExpanded.update((open) => !open);
  }

  protected goToEventDetail(event: EventApiItem): void {
    void this.router.navigate(['/dashboard/events', event._id]);
  }

  protected openAddEventModal(): void {
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { addEvent: 'true', editEvent: null },
      queryParamsHandling: 'merge'
    });
  }

  protected openEditEventModal(event: EventApiItem): void {
    if (!event?._id) {
      return;
    }
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { editEvent: event._id, addEvent: null },
      queryParamsHandling: 'merge'
    });
  }

  protected openDeleteConfirm(event: EventApiItem): void {
    if (!event?._id) {
      return;
    }
    this.eventPendingDelete.set(event);
  }

  protected closeDeleteConfirm(): void {
    if (this.isDeletingEvent()) {
      return;
    }
    this.eventPendingDelete.set(null);
  }

  protected confirmDeleteEvent(): void {
    const pending = this.eventPendingDelete();
    if (!pending?._id || this.isDeletingEvent()) {
      return;
    }
    const id = pending._id;
    this.isDeletingEvent.set(true);

    this.eventService
      .deleteEvent(id)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => {
          this.isDeletingEvent.set(false);
        })
      )
      .subscribe({
        next: () => {
          this.toast.showSuccess('Event deleted successfully.');
          this.eventPendingDelete.set(null);
          const editParam = this.route.snapshot.queryParamMap.get('editEvent');
          if (editParam === id) {
            this.closeAddEventModal();
          }
          this.loadEvents();
        },
        error: (error: unknown) => {
          const message = this.resolveDeleteErrorMessage(error);
          this.toast.showError(message);
        }
      });
  }

  protected closeAddEventModal(): void {
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { addEvent: null, editEvent: null },
      queryParamsHandling: 'merge'
    });
  }

  protected onAdminEventFormSaved(): void {
    this.loadEvents();
    this.closeAddEventModal();
  }

  private resolveDeleteErrorMessage(error: unknown): string {
    const fallbackMessage = 'Unable to delete this event. Please try again.';
    if (error instanceof HttpErrorResponse) {
      const body = error.error;
      if (body && typeof body === 'object' && 'message' in body) {
        const message = String((body as { message?: string }).message ?? '').trim();
        if (message) {
          return message;
        }
      }
      return fallbackMessage;
    }
    return fallbackMessage;
  }

  private buildCatalogQueryOptions(): EventQueryOptions {
    const f = this.catalogFilterForm.getRawValue();
    const search = (f.search ?? '').trim();
    const location = (f.location ?? '').trim();
    const category = (f.category ?? '').trim();
    const statusRaw = (f.status ?? '').trim().toLowerCase();
    const allowedStatus: EventStatusFilter[] = ['upcoming', 'ongoing', 'completed', 'cancelled'];
    const status = allowedStatus.includes(statusRaw as EventStatusFilter)
      ? (statusRaw as EventStatusFilter)
      : undefined;
    const sort = (f.sort ?? 'date') as EventSortField;
    const order = (f.order ?? 'asc') as EventSortOrder;

    return {
      page: this.catalogPage(),
      limit: this.catalogPageSize,
      sort,
      order,
      search: search || undefined,
      location: location || undefined,
      category: category || undefined,
      status
    };
  }

  private loadEvents(): void {
    this.isLoadingEvents.set(true);
    this.listErrorMessage = '';

    this.eventService
      .getEvents(this.buildCatalogQueryOptions())
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          const list = response.data?.events ?? [];
          const pag = response.data?.pagination;
          const totalPages = Math.max(1, pag?.totalPages ?? 1);
          const totalEvents = pag?.totalEvents ?? list.length;
          const current = this.catalogPage();

          if (current > totalPages) {
            this.catalogPage.set(totalPages);
            this.loadEvents();
            return;
          }

          this.catalogTotalPages.set(totalPages);
          this.catalogTotalEvents.set(totalEvents);
          this.events.set(list);
          this.isLoadingEvents.set(false);
        },
        error: () => {
          this.events.set([]);
          this.catalogTotalPages.set(1);
          this.catalogTotalEvents.set(0);
          this.listErrorMessage = 'Unable to load event catalog at the moment.';
          this.isLoadingEvents.set(false);
        },
      });
  }
}
