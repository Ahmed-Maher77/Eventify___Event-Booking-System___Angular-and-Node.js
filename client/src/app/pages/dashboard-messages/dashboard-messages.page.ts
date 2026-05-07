import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnDestroy, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { Subject, debounceTime, distinctUntilChanged, finalize, takeUntil } from 'rxjs';
import {
  ADMIN_LIST_PAGE_SIZE,
  AdminContactMessageListItem,
  AdminDashboardService,
} from '../../services/admin-dashboard.service';
import { AdminEntityPaginationComponent } from '../../shared/admin-entity-pagination/admin-entity-pagination.component';
import {
  CustomNativeSelectComponent,
  CustomNativeSelectOption,
} from '../../shared/custom-native-select/custom-native-select';
import { HighlightedPageHeadingComponent } from '../../shared/highlighted-page-heading/highlighted-page-heading';
import { SectionLoader } from '../../shared/section-loader/section-loader';

@Component({
  selector: 'app-dashboard-messages-page',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    HighlightedPageHeadingComponent,
    SectionLoader,
    AdminEntityPaginationComponent,
    CustomNativeSelectComponent,
  ],
  templateUrl: './dashboard-messages.page.html',
  styleUrl: './dashboard-messages.page.scss',
})
export class DashboardMessagesPage implements OnInit, OnDestroy {
  private readonly adminApi = inject(AdminDashboardService);
  private readonly fb = inject(FormBuilder);
  private readonly destroy$ = new Subject<void>();
  private latestRequestId = 0;

  protected readonly statusOptions: CustomNativeSelectOption[] = [
    { value: '', label: 'All statuses' },
    { value: 'new', label: 'New' },
    { value: 'reviewed', label: 'Reviewed' },
  ];
  protected readonly sortOptions: CustomNativeSelectOption[] = [
    { value: 'createdAt', label: 'Date' },
    { value: 'fullName', label: 'Name' },
    { value: 'email', label: 'Email' },
    { value: 'subject', label: 'Subject' },
    { value: 'status', label: 'Status' },
  ];
  protected readonly orderOptions: CustomNativeSelectOption[] = [
    { value: 'desc', label: 'Descending' },
    { value: 'asc', label: 'Ascending' },
  ];
  protected readonly filterForm = this.fb.nonNullable.group({
    search: [''],
    status: [''],
    sort: ['createdAt' as 'createdAt' | 'fullName' | 'email' | 'subject' | 'status'],
    order: ['desc' as 'asc' | 'desc'],
  });

  protected readonly isLoading = signal(true);
  protected readonly errorMessage = signal<string | null>(null);
  protected readonly listPage = signal(1);
  protected readonly listTotalPages = signal(1);
  protected readonly totalListItems = signal(0);
  protected readonly items = signal<AdminContactMessageListItem[]>([]);
  protected readonly filtersExpanded = signal(false);

  ngOnInit(): void {
    this.filterForm.valueChanges
      .pipe(
        debounceTime(280),
        distinctUntilChanged((a, b) => JSON.stringify(a) === JSON.stringify(b)),
        takeUntil(this.destroy$),
      )
      .subscribe(() => {
        this.listPage.set(1);
        this.loadMessages();
      });

    this.loadMessages();
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
    this.loadMessages();
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
    this.listPage.set(1);
    this.loadMessages();
  }

  protected hasActiveFilters(): boolean {
    const f = this.filterForm.getRawValue();
    return !!f.search.trim() || !!f.status.trim() || f.sort !== 'createdAt' || f.order !== 'desc';
  }

  private loadMessages(): void {
    const requestId = ++this.latestRequestId;
    this.isLoading.set(true);
    this.errorMessage.set(null);
    const f = this.filterForm.getRawValue();
    const search = f.search.trim();

    this.adminApi
      .getContactMessages({
        page: this.listPage(),
        limit: ADMIN_LIST_PAGE_SIZE,
        status: f.status || undefined,
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
          const list = data?.messages ?? [];
          const pag = data?.pagination;
          const totalPages = Math.max(1, pag?.totalPages ?? 1);
          const total = pag?.totalMessages ?? 0;
          let page = this.listPage();

          if (page > totalPages && totalPages >= 1) {
            page = totalPages;
            this.listPage.set(page);
            this.loadMessages();
            return;
          }

          this.items.set(list);
          this.listTotalPages.set(totalPages);
          this.totalListItems.set(total);
        },
        error: (err: HttpErrorResponse) => {
          if (requestId !== this.latestRequestId) {
            return;
          }

          this.items.set([]);
          this.listTotalPages.set(1);
          this.totalListItems.set(0);
          const msg = err.error?.message;
          this.errorMessage.set(
            typeof msg === 'string' && msg.trim()
              ? msg
              : 'Unable to load messages. Please try again.',
          );
        },
      });
  }
}
