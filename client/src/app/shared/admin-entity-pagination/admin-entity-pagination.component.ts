import { Component, computed, input, output } from '@angular/core';
import { AdminPaginationToken, buildAdminPaginationTokens } from './admin-entity-pagination.tokens';

@Component({
  selector: 'app-admin-entity-pagination',
  standalone: true,
  templateUrl: './admin-entity-pagination.component.html',
  styleUrl: './admin-entity-pagination.component.scss',
})
export class AdminEntityPaginationComponent {
  readonly currentPage = input.required<number>();
  readonly totalPages = input.required<number>();
  readonly totalItems = input(0);
  readonly itemLabel = input<string>('items');
  readonly ariaLabel = input<string>('Pagination');

  readonly pageChange = output<number>();

  protected readonly tokens = computed(() =>
    buildAdminPaginationTokens(this.totalPages(), this.currentPage()),
  );

  protected readonly showPagination = computed(() => this.totalPages() > 1);

  protected hasPrevious(): boolean {
    return this.currentPage() > 1;
  }

  protected hasNext(): boolean {
    return this.currentPage() < this.totalPages();
  }

  protected emitPage(page: number): void {
    const total = this.totalPages();
    const next = Math.max(1, Math.min(page, total));
    if (next === this.currentPage()) {
      return;
    }
    this.pageChange.emit(next);
  }

  protected previous(): void {
    this.emitPage(this.currentPage() - 1);
  }

  protected next(): void {
    this.emitPage(this.currentPage() + 1);
  }

  protected isEllipsis(token: AdminPaginationToken): boolean {
    return token === 'ellipsis-left' || token === 'ellipsis-right';
  }

  protected isPageNumber(token: AdminPaginationToken): token is number {
    return typeof token === 'number';
  }
}
