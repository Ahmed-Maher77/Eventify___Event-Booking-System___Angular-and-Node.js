import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnDestroy, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { Subject, debounceTime, distinctUntilChanged, finalize, takeUntil } from 'rxjs';
import {
  ADMIN_LIST_PAGE_SIZE,
  AdminBookingListItem,
  AdminDashboardService,
} from '../../services/admin-dashboard.service';
import { AdminEntityPaginationComponent } from '../../shared/admin-entity-pagination/admin-entity-pagination.component';
import {
  CustomNativeSelectComponent,
  CustomNativeSelectOption,
} from '../../shared/custom-native-select/custom-native-select';
import { HighlightedPageHeadingComponent } from '../../shared/highlighted-page-heading/highlighted-page-heading';
import { SectionLoader } from '../../shared/section-loader/section-loader';

type BookingStatusTab = 'all' | 'pending' | 'confirmed' | 'cancelled';
type BookingSortField = 'createdAt' | 'status' | 'quantity' | 'totalPrice';
type BookingSortOrder = 'asc' | 'desc';

@Component({
  selector: 'app-dashboard-bookings-page',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    HighlightedPageHeadingComponent,
    SectionLoader,
    AdminEntityPaginationComponent,
    CustomNativeSelectComponent,
  ],
  templateUrl: './dashboard-bookings.page.html',
  styleUrl: './dashboard-bookings.page.scss',
})
export class DashboardBookingsPage implements OnInit, OnDestroy {
  private readonly adminApi = inject(AdminDashboardService);
  private readonly fb = inject(FormBuilder);
  private readonly destroy$ = new Subject<void>();
  private latestRequestId = 0;

  protected readonly statusOptions: CustomNativeSelectOption[] = [
    { value: '', label: 'All statuses' },
    { value: 'pending', label: 'Pending' },
    { value: 'confirmed', label: 'Confirmed' },
    { value: 'cancelled', label: 'Cancelled' },
  ];
  protected readonly sortOptions: CustomNativeSelectOption[] = [
    { value: 'createdAt', label: 'Created' },
    { value: 'status', label: 'Status' },
    { value: 'quantity', label: 'Quantity' },
    { value: 'totalPrice', label: 'Total price' },
  ];
  protected readonly orderOptions: CustomNativeSelectOption[] = [
    { value: 'desc', label: 'Descending' },
    { value: 'asc', label: 'Ascending' },
  ];
  protected readonly filterForm = this.fb.nonNullable.group({
    search: [''],
    status: [''],
    sort: ['createdAt' as BookingSortField],
    order: ['desc' as BookingSortOrder],
  });

  protected readonly isLoading = signal(true);
  protected readonly errorMessage = signal<string | null>(null);
  protected readonly listPage = signal(1);
  protected readonly listTotalPages = signal(1);
  protected readonly totalListItems = signal(0);
  protected readonly rows = signal<AdminBookingListItem[]>([]);
  protected readonly filtersExpanded = signal(false);
  protected readonly activeStatusTab = signal<BookingStatusTab>('all');
  protected readonly statusCounts = signal<Record<BookingStatusTab, number>>({
    all: 0,
    pending: 0,
    confirmed: 0,
    cancelled: 0,
  });

  ngOnInit(): void {
    this.filterForm.valueChanges
      .pipe(
        debounceTime(280),
        distinctUntilChanged((a, b) => JSON.stringify(a) === JSON.stringify(b)),
        takeUntil(this.destroy$),
      )
      .subscribe(() => {
        this.syncActiveStatusTabWithFilter();
        this.listPage.set(1);
        this.loadBookings();
      });

    this.loadBookings();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  protected onListPageChange(page: number): void {
    const total = this.listTotalPages();
    const next = Math.max(1, Math.min(page, total));
    if (next === this.listPage()) {
      return;
    }
    this.listPage.set(next);
    this.loadBookings();
  }

  protected toggleFilters(): void {
    this.filtersExpanded.update((open) => !open);
  }

  protected clearFilters(): void {
    this.filterForm.reset(
      {
        search: '',
        status: '',
        sort: 'createdAt',
        order: 'desc',
      },
      { emitEvent: false },
    );
    this.activeStatusTab.set('all');
    this.listPage.set(1);
    this.loadBookings();
  }

  protected setStatusTab(status: BookingStatusTab): void {
    this.activeStatusTab.set(status);
    this.filterForm.patchValue(
      {
        status: status === 'all' ? '' : status,
      },
      { emitEvent: true },
    );
  }

  protected isActiveStatusTab(status: BookingStatusTab): boolean {
    return this.activeStatusTab() === status;
  }

  protected hasActiveFilters(): boolean {
    const f = this.filterForm.getRawValue();
    return !!f.search.trim() || !!f.status.trim() || f.sort !== 'createdAt' || f.order !== 'desc';
  }

  protected bookingCustomerLabel(b: AdminBookingListItem): string {
    const u = b.userId;
    if (u && typeof u === 'object' && 'name' in u && (u as { name?: string }).name) {
      return (u as { name: string }).name;
    }
    return '—';
  }

  private loadBookings(): void {
    const requestId = ++this.latestRequestId;
    this.isLoading.set(true);
    this.errorMessage.set(null);
    const f = this.filterForm.getRawValue();
    const search = f.search.trim();
    const safePage = Math.max(1, this.listPage());
    if (safePage !== this.listPage()) {
      this.listPage.set(safePage);
    }

    this.adminApi
      .getBookings({
        page: safePage,
        limit: ADMIN_LIST_PAGE_SIZE,
        status: (f.status || undefined) as 'pending' | 'confirmed' | 'cancelled' | undefined,
        search: search || undefined,
        sort: f.sort,
        order: f.order,
      })
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: (res) => {
          if (requestId !== this.latestRequestId) {
            return;
          }
          const data = res.data;
          const list = data?.bookings ?? [];
          const pag = data?.pagination;
          const counts = data?.statusCounts;
          const totalPages = Math.max(1, pag?.totalPages ?? 1);
          const total = pag?.totalBookings ?? 0;
          let page = this.listPage();

          if (page > totalPages && totalPages >= 1) {
            page = totalPages;
            this.listPage.set(page);
            this.loadBookings();
            return;
          }

          this.rows.set(list);
          this.statusCounts.set({
            all: counts?.all ?? 0,
            pending: counts?.pending ?? 0,
            confirmed: counts?.confirmed ?? 0,
            cancelled: counts?.cancelled ?? 0,
          });
          this.listTotalPages.set(totalPages);
          this.totalListItems.set(total);
        },
        error: (err: HttpErrorResponse) => {
          if (requestId !== this.latestRequestId) {
            return;
          }
          this.rows.set([]);
          this.statusCounts.set({
            all: 0,
            pending: 0,
            confirmed: 0,
            cancelled: 0,
          });
          this.listTotalPages.set(1);
          this.totalListItems.set(0);
          const msg = err.error?.message;
          this.errorMessage.set(
            typeof msg === 'string' && msg.trim()
              ? msg
              : 'Unable to load bookings. Please try again.',
          );
        },
      });
  }

  private syncActiveStatusTabWithFilter(): void {
    const status = this.filterForm.controls.status.value;
    if (status === 'pending' || status === 'confirmed' || status === 'cancelled') {
      this.activeStatusTab.set(status);
      return;
    }
    this.activeStatusTab.set('all');
  }
}
