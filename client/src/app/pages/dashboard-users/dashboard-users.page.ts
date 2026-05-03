import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnDestroy, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { Subject, debounceTime, distinctUntilChanged, finalize, takeUntil } from 'rxjs';
import {
  ADMIN_LIST_PAGE_SIZE,
  AdminDashboardService,
  AdminUserListItem,
} from '../../services/admin-dashboard.service';
import { AdminEntityPaginationComponent } from '../../shared/admin-entity-pagination/admin-entity-pagination.component';
import {
  CustomNativeSelectComponent,
  CustomNativeSelectOption,
} from '../../shared/custom-native-select/custom-native-select';
import { HighlightedPageHeadingComponent } from '../../shared/highlighted-page-heading/highlighted-page-heading';
import { SectionLoader } from '../../shared/section-loader/section-loader';

type MemberSortField = 'createdAt' | 'name' | 'email' | 'role';
type MemberSortOrder = 'asc' | 'desc';

@Component({
  selector: 'app-dashboard-users-page',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    HighlightedPageHeadingComponent,
    SectionLoader,
    CustomNativeSelectComponent,
    AdminEntityPaginationComponent,
  ],
  templateUrl: './dashboard-users.page.html',
  styleUrl: './dashboard-users.page.scss',
})
export class DashboardUsersPage implements OnInit, OnDestroy {
  private readonly adminApi = inject(AdminDashboardService);
  private readonly fb = inject(FormBuilder);
  private readonly destroy$ = new Subject<void>();

  protected readonly directorySortOptions: CustomNativeSelectOption[] = [
    { value: 'createdAt', label: 'Joined' },
    { value: 'name', label: 'Name' },
    { value: 'email', label: 'Email' },
    { value: 'role', label: 'Role' },
  ];

  protected readonly directoryOrderOptions: CustomNativeSelectOption[] = [
    { value: 'asc', label: 'Ascending' },
    { value: 'desc', label: 'Descending' },
  ];

  protected readonly directoryRoleOptions: CustomNativeSelectOption[] = [
    { value: '', label: 'All roles' },
    { value: 'user', label: 'User' },
    { value: 'admin', label: 'Admin' },
  ];

  protected readonly directoryFilterForm = this.fb.nonNullable.group({
    search: [''],
    role: [''],
    sort: ['createdAt' as MemberSortField],
    order: ['desc' as MemberSortOrder],
  });

  protected readonly isLoading = signal(true);
  protected readonly errorMessage = signal<string | null>(null);
  protected readonly listPage = signal(1);
  protected readonly listTotalPages = signal(1);
  protected readonly totalListItems = signal(0);
  protected readonly rows = signal<AdminUserListItem[]>([]);
  protected readonly directoryFiltersExpanded = signal(false);

  ngOnInit(): void {
    this.directoryFilterForm.valueChanges
      .pipe(
        debounceTime(280),
        distinctUntilChanged((a, b) => JSON.stringify(a) === JSON.stringify(b)),
        takeUntil(this.destroy$),
      )
      .subscribe(() => {
        this.listPage.set(1);
        this.loadUsers();
      });

    this.loadUsers();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  protected onListPageChange(page: number): void {
    this.listPage.set(page);
    this.loadUsers();
  }

  protected toggleDirectoryFilters(): void {
    this.directoryFiltersExpanded.update((open) => !open);
  }

  protected clearDirectoryFilters(): void {
    this.directoryFilterForm.reset(
      {
        search: '',
        role: '',
        sort: 'createdAt',
        order: 'desc',
      },
      { emitEvent: false },
    );
    this.listPage.set(1);
    this.loadUsers();
  }

  protected hasActiveDirectoryFilters(): boolean {
    const v = this.directoryFilterForm.getRawValue();
    return !!((v.search ?? '').trim() || (v.role ?? '').trim());
  }

  private loadUsers(): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    const v = this.directoryFilterForm.getRawValue();
    const search = (v.search ?? '').trim();
    const role = (v.role ?? '').trim();

    this.adminApi
      .getUsers({
        page: this.listPage(),
        limit: ADMIN_LIST_PAGE_SIZE,
        ...(search ? { search } : {}),
        ...(role === 'admin' || role === 'user' ? { role } : {}),
        sort: (v.sort || 'createdAt') as MemberSortField,
        order: (v.order || 'desc') as MemberSortOrder,
      })
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: (res) => {
          const data = res.data;
          const list = data?.users ?? [];
          const pag = data?.pagination;
          const totalPages = Math.max(1, pag?.totalPages ?? 1);
          const total = pag?.totalUsers ?? 0;
          let page = this.listPage();

          if (page > totalPages && totalPages >= 1) {
            page = totalPages;
            this.listPage.set(page);
            this.loadUsers();
            return;
          }

          this.rows.set(list);
          this.listTotalPages.set(totalPages);
          this.totalListItems.set(total);
        },
        error: (err: HttpErrorResponse) => {
          this.rows.set([]);
          this.listTotalPages.set(1);
          this.totalListItems.set(0);
          const msg = err.error?.message;
          this.errorMessage.set(
            typeof msg === 'string' && msg.trim()
              ? msg
              : 'Unable to load members. Please try again.',
          );
        },
      });
  }
}
