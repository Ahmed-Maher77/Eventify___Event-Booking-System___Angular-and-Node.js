import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnDestroy, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { Router } from '@angular/router';
import { Subject, debounceTime, distinctUntilChanged, finalize, takeUntil } from 'rxjs';
import {
  ADMIN_LIST_PAGE_SIZE,
  AdminBookingListItem,
  AdminDashboardService,
} from '../../services/admin-dashboard.service';
import { ToastService } from '../../services/toast.service';
import { AdminEntityPaginationComponent } from '../../shared/admin-entity-pagination/admin-entity-pagination.component';
import {
  CustomNativeSelectComponent,
  CustomNativeSelectOption,
} from '../../shared/custom-native-select/custom-native-select';
import { HighlightedPageHeadingComponent } from '../../shared/highlighted-page-heading/highlighted-page-heading';
import { Button } from '../../shared/button/button';
import { AdminListStateComponent } from '../../shared/admin-list-state/admin-list-state.component';
import {
  BookingSortField,
  BookingSortOrder,
  BookingStatusTab,
} from './dashboard-bookings.page.types';

@Component({
  selector: 'app-dashboard-bookings-page',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    HighlightedPageHeadingComponent,
    AdminEntityPaginationComponent,
    CustomNativeSelectComponent,
    Button,
    AdminListStateComponent,
  ],
  templateUrl: './dashboard-bookings.page.html',
  styleUrl: './dashboard-bookings.page.scss',
})
export class DashboardBookingsPage implements OnInit, OnDestroy {
  private readonly adminApi = inject(AdminDashboardService);
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);
  private readonly destroy$ = new Subject<void>();
  private latestRequestId = 0;
  private suppressFormChangeReload = false;

  protected readonly statusOptions: CustomNativeSelectOption[] = [
    { value: '', label: 'All statuses' },
    { value: 'pending', label: 'Awating_Payment' },
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
  protected readonly operationBusyByBookingId = signal<Record<string, boolean>>({});
  protected readonly filtersExpanded = signal(false);
  protected readonly activeStatusTab = signal<BookingStatusTab>('all');
  protected readonly pendingOperation = signal<AdminBookingListItem | null>(null);
  protected readonly statusCounts = signal<Record<BookingStatusTab, number>>({
    all: 0,
    pending: 0,
    confirmed: 0,
    cancelled: 0,
  });
  protected readonly selectedUserId = signal('');
  protected readonly selectedEventId = signal('');

  ngOnInit(): void {
    this.route.queryParamMap.pipe(takeUntil(this.destroy$)).subscribe((params) => {
      this.applyRouteQueryParams(params);
    });

    this.filterForm.valueChanges
      .pipe(
        debounceTime(280),
        distinctUntilChanged((a, b) => JSON.stringify(a) === JSON.stringify(b)),
        takeUntil(this.destroy$),
      )
      .subscribe(() => {
        if (this.suppressFormChangeReload) {
          return;
        }
        this.syncActiveStatusTabWithFilter();
        this.listPage.set(1);
        this.loadBookings();
      });
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
    this.selectedUserId.set('');
    this.selectedEventId.set('');
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
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: {},
      replaceUrl: true,
    });
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
    return (
      !!f.search.trim() ||
      !!f.status.trim() ||
      f.sort !== 'createdAt' ||
      f.order !== 'desc' ||
      !!this.selectedUserId() ||
      !!this.selectedEventId()
    );
  }

  protected bookingCustomerLabel(b: AdminBookingListItem): string {
    const u = b.userId;
    if (u && typeof u === 'object' && 'name' in u && (u as { name?: string }).name) {
      return (u as { name: string }).name;
    }
    return '—';
  }

  protected bookingEventLabel(b: AdminBookingListItem): string {
    const e = b.eventId;
    if (e && typeof e === 'object' && 'title' in e && (e as { title?: string }).title) {
      return (e as { title: string }).title;
    }
    return '—';
  }

  protected bookingEventDateValue(b: AdminBookingListItem): string | null {
    const e = b.eventId;
    if (e && typeof e === 'object' && 'date' in e && (e as { date?: string }).date) {
      return (e as { date: string }).date;
    }
    return null;
  }

  protected bookingStatusLabel(status: AdminBookingListItem['status']): string {
    if (status === 'pending') {
      return 'Awating_Payment';
    }
    return `${status[0].toUpperCase()}${status.slice(1)}`;
  }

  protected canRunOperation(b: AdminBookingListItem): boolean {
    return !this.operationBusyByBookingId()[b._id];
  }

  protected operationLabel(b: AdminBookingListItem): string {
    return this.isRefundOperation(b) ? 'Cancel & refund' : 'Delete';
  }

  protected isRefundOperation(b: AdminBookingListItem): boolean {
    return this.canRefundOperation(b);
  }

  protected operationHint(b: AdminBookingListItem): string {
    if (this.isRefundOperation(b)) {
      return 'Available before event start for paid bookings. Booking is refunded then removed.';
    }
    if (this.isBeforeEventDate(b)) {
      return 'Available before event start for unpaid/cancelled bookings. Booking is removed without refund.';
    }
    return 'Available after event start. Booking is removed without refund.';
  }

  protected isEventEnded(b: AdminBookingListItem): boolean {
    const eventDate = this.parseEventDate(b);
    if (!eventDate) {
      return false;
    }
    return eventDate.getTime() <= Date.now();
  }

  protected runOperation(b: AdminBookingListItem): void {
    if (!this.canRunOperation(b)) {
      return;
    }
    this.pendingOperation.set(b);
  }

  protected closePendingOperationModal(): void {
    const pending = this.pendingOperation();
    if (pending && this.operationBusyByBookingId()[pending._id]) {
      return;
    }
    this.pendingOperation.set(null);
  }

  protected confirmPendingOperation(): void {
    const pending = this.pendingOperation();
    if (!pending || !this.canRunOperation(pending)) {
      return;
    }
    this.executeOperation(pending);
  }

  private executeOperation(b: AdminBookingListItem): void {
    const label = this.operationLabel(b);
    this.operationBusyByBookingId.update((current) => ({ ...current, [b._id]: true }));
    this.adminApi.runBookingOperation(b._id).subscribe({
      next: (res) => {
        this.toast.showSuccess(res.message || `${label} completed.`);
        this.pendingOperation.set(null);
        // Always refresh from backend so tab badges stay accurate immediately.
        this.loadBookings();
      },
      error: (err: HttpErrorResponse) => {
        const msg = err.error?.message;
        this.toast.showError(
          typeof msg === 'string' && msg.trim()
            ? msg
            : 'Unable to complete booking operation. Please try again.',
        );
      },
      complete: () => {
        this.operationBusyByBookingId.update((current) => {
          const next = { ...current };
          delete next[b._id];
          return next;
        });
      },
    });
  }

  protected operationConfirmTitle(b: AdminBookingListItem): string {
    if (this.isRefundOperation(b)) {
      return 'Cancel and refund this booking?';
    }
    if (this.isBeforeEventDate(b)) {
      return 'Delete this unpaid booking?';
    }
    return 'Delete this booking record?';
  }

  protected operationConfirmMessage(b: AdminBookingListItem): string {
    const eventTitle = this.bookingEventLabel(b);
    const customerLabel = this.bookingCustomerLabel(b);
    if (this.isRefundOperation(b)) {
      return (
        `Event: "${eventTitle}"\n` +
        `Customer: ${customerLabel}\n\n` +
        `A refund will be sent to the original payment method and this booking will be permanently deleted.`
      );
    }
    if (this.isBeforeEventDate(b)) {
      return (
        `Delete this booking (no refund)?\n\n` +
        `Event: "${eventTitle}"\n` +
        `Customer: ${customerLabel}\n` +
        `Status: ${this.bookingStatusLabel(b.status)}\n\n` +
        `This booking has not been paid/refundable. It will be permanently deleted without any refund.`
      );
    }
    return (
      `Delete this booking from records?\n\n` +
      `Event: "${eventTitle}"\n` +
      `Customer: ${customerLabel}\n` +
      `Status: ${this.bookingStatusLabel(b.status)}\n\n` +
      `The event has already started/ended. This removes the booking record permanently without a refund.`
    );
  }

  protected operationConfirmButtonLabel(b: AdminBookingListItem): string {
    return this.isRefundOperation(b) ? 'Cancel & refund' : 'Delete booking';
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
        userId: this.selectedUserId() || undefined,
        eventId: this.selectedEventId() || undefined,
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

  private isBeforeEventDate(b: AdminBookingListItem): boolean {
    const eventDate = this.parseEventDate(b);
    if (!eventDate) {
      return false;
    }
    return eventDate.getTime() > Date.now();
  }

  private canRefundOperation(b: AdminBookingListItem): boolean {
    return this.isBeforeEventDate(b) && b.status === 'confirmed';
  }

  private parseEventDate(b: AdminBookingListItem): Date | null {
    if (typeof b.eventId !== 'object' || !b.eventId?.date) {
      return null;
    }
    const parsed = new Date(b.eventId.date);
    if (Number.isNaN(parsed.getTime())) {
      return null;
    }
    return parsed;
  }

  private applyRouteQueryParams(params: import('@angular/router').ParamMap): void {
    const status = (params.get('status') ?? '').trim();
    const search = (params.get('search') ?? '').trim();
    const sort = (params.get('sort') ?? '').trim();
    const order = (params.get('order') ?? '').trim();
    const userId = (params.get('userId') ?? '').trim();
    const eventId = (params.get('eventId') ?? '').trim();
    const pageRaw = Number(params.get('page') ?? '1');

    const nextStatus = status === 'pending' || status === 'confirmed' || status === 'cancelled' ? status : '';
    const nextSort: BookingSortField =
      sort === 'status' || sort === 'quantity' || sort === 'totalPrice' || sort === 'createdAt'
        ? sort
        : 'createdAt';
    const nextOrder: BookingSortOrder = order === 'asc' ? 'asc' : 'desc';
    const nextPage = Number.isFinite(pageRaw) && pageRaw > 0 ? Math.floor(pageRaw) : 1;

    this.suppressFormChangeReload = true;
    this.filterForm.patchValue(
      {
        search,
        status: nextStatus,
        sort: nextSort,
        order: nextOrder,
      },
      { emitEvent: false },
    );
    this.suppressFormChangeReload = false;

    this.selectedUserId.set(userId);
    this.selectedEventId.set(eventId);
    this.listPage.set(nextPage);
    this.syncActiveStatusTabWithFilter();
    this.loadBookings();
  }
}
