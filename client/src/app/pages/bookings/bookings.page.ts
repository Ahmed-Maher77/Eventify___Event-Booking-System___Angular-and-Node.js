import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { BookingItem, BookingService } from '../../services/booking.service';
import { ToastService } from '../../services/toast.service';
import { Button } from '../../shared/button/button';
import { HighlightedPageHeadingComponent } from '../../shared/highlighted-page-heading/highlighted-page-heading';
import { SectionLoader } from '../../shared/section-loader/section-loader';

@Component({
  selector: 'app-bookings-page',
  standalone: true,
  imports: [CommonModule, RouterLink, Button, HighlightedPageHeadingComponent, SectionLoader],
  templateUrl: './bookings.page.html',
  styleUrls: ['../../../sass/components/static-info-page.scss', './bookings.page.scss'],
})
export class BookingsPage implements OnInit {
  private readonly bookingService = inject(BookingService);
  private readonly toast = inject(ToastService);

  protected readonly isLoading = signal(true);
  protected readonly errorMessage = signal<string | null>(null);
  protected readonly bookings = signal<BookingItem[]>([]);
  protected readonly activeStatus = signal<'all' | 'pending' | 'confirmed' | 'cancelled'>('all');
  protected readonly currentPage = signal(1);
  protected readonly totalPages = signal(1);
  protected readonly totalBookings = signal(0);
  protected readonly isCancellingBookingId = signal<string | null>(null);
  protected readonly isDeletingBookingId = signal<string | null>(null);
  protected readonly quantityUpdatingMap = signal<Record<string, boolean>>({});

  ngOnInit(): void {
    this.loadBookings();
  }

  protected hasBookings(): boolean {
    return this.bookings().length > 0;
  }

  protected switchStatus(status: 'all' | 'pending' | 'confirmed' | 'cancelled'): void {
    if (this.activeStatus() === status) {
      return;
    }
    this.activeStatus.set(status);
    this.currentPage.set(1);
    this.loadBookings();
  }

  protected goToPage(nextPage: number): void {
    if (nextPage < 1 || nextPage > this.totalPages() || nextPage === this.currentPage()) {
      return;
    }
    this.currentPage.set(nextPage);
    this.loadBookings();
  }

  protected statusCountLabel(): string {
    const status = this.activeStatus();
    if (status === 'all') {
      return 'All bookings';
    }
    return `${status[0].toUpperCase()}${status.slice(1)} bookings`;
  }

  protected eventTitle(booking: BookingItem): string {
    if (typeof booking.eventId === 'object' && booking.eventId?.title) {
      return booking.eventId.title;
    }
    return 'Unknown event';
  }

  protected eventDate(booking: BookingItem): string | null {
    if (typeof booking.eventId === 'object' && booking.eventId?.date) {
      return booking.eventId.date;
    }
    return null;
  }

  protected eventLocation(booking: BookingItem): string {
    if (typeof booking.eventId === 'object' && booking.eventId?.location) {
      return booking.eventId.location;
    }
    return 'Location not available';
  }

  protected canCancel(booking: BookingItem): boolean {
    return booking.status !== 'cancelled';
  }

  protected isCancelling(bookingId: string): boolean {
    return this.isCancellingBookingId() === bookingId;
  }

  protected isDeleting(bookingId: string): boolean {
    return this.isDeletingBookingId() === bookingId;
  }

  protected isQuantityUpdating(bookingId: string): boolean {
    return !!this.quantityUpdatingMap()[bookingId];
  }

  protected canDeleteCancelled(booking: BookingItem): boolean {
    return booking.status === 'cancelled';
  }

  protected canAdjustQuantity(booking: BookingItem): boolean {
    return booking.status !== 'cancelled' && !this.isQuantityUpdating(booking._id);
  }

  protected increaseQuantity(booking: BookingItem): void {
    if (!this.canAdjustQuantity(booking)) {
      return;
    }
    this.updateBookingQuantity(booking, booking.quantity + 1);
  }

  protected decreaseQuantity(booking: BookingItem): void {
    if (!this.canAdjustQuantity(booking) || booking.quantity <= 1) {
      return;
    }
    this.updateBookingQuantity(booking, booking.quantity - 1);
  }

  protected deleteCancelledBooking(booking: BookingItem): void {
    if (!this.canDeleteCancelled(booking) || this.isDeletingBookingId()) {
      return;
    }

    this.isDeletingBookingId.set(booking._id);
    this.bookingService
      .deleteCancelledBooking(booking._id)
      .pipe(finalize(() => this.isDeletingBookingId.set(null)))
      .subscribe({
        next: () => {
          this.toast.showSuccess('Cancelled booking deleted.');
          this.bookings.update((current) => current.filter((item) => item._id !== booking._id));
          this.totalBookings.update((count) => Math.max(0, count - 1));
        },
        error: (err: HttpErrorResponse) => {
          const msg = err.error?.message;
          this.toast.showError(
            typeof msg === 'string' && msg.trim()
              ? msg
              : 'Unable to delete this cancelled booking right now.',
          );
        },
      });
  }

  protected cancelBooking(booking: BookingItem): void {
    if (!this.canCancel(booking) || this.isCancellingBookingId()) {
      return;
    }

    this.isCancellingBookingId.set(booking._id);
    this.bookingService
      .cancelBooking(booking._id)
      .pipe(finalize(() => this.isCancellingBookingId.set(null)))
      .subscribe({
        next: () => {
          this.toast.showSuccess('Booking cancelled successfully.');
          this.bookings.update((current) =>
            current.map((item) => (item._id === booking._id ? { ...item, status: 'cancelled' } : item)),
          );
        },
        error: (err: HttpErrorResponse) => {
          const msg = err.error?.message;
          this.toast.showError(
            typeof msg === 'string' && msg.trim()
              ? msg
              : 'Unable to cancel this booking right now.',
          );
        },
      });
  }

  private updateBookingQuantity(booking: BookingItem, quantity: number): void {
    const bookingId = booking._id;
    this.quantityUpdatingMap.update((current) => ({ ...current, [bookingId]: true }));
    this.bookingService
      .updateBookingQuantity(bookingId, { quantity })
      .pipe(
        finalize(() =>
          this.quantityUpdatingMap.update((current) => {
            const next = { ...current };
            delete next[bookingId];
            return next;
          }),
        ),
      )
      .subscribe({
        next: (res) => {
          const updated = res.data;
          this.bookings.update((current) =>
            current.map((item) => (item._id === bookingId ? { ...item, ...updated } : item)),
          );
        },
        error: (err: HttpErrorResponse) => {
          const msg = err.error?.message;
          this.toast.showError(
            typeof msg === 'string' && msg.trim()
              ? msg
              : 'Unable to update booking quantity right now.',
          );
        },
      });
  }

  protected retry(): void {
    this.loadBookings();
  }

  private loadBookings(): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);
    const activeStatus = this.activeStatus();
    const statusFilter: '' | 'pending' | 'confirmed' | 'cancelled' =
      activeStatus === 'all' ? '' : activeStatus;

    this.bookingService
      .getUserBookings({
        page: this.currentPage(),
        limit: 6,
        status: statusFilter,
      })
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: (res) => {
          const pagination = res.data?.pagination;
          this.bookings.set(res.data?.bookings ?? []);
          this.totalPages.set(Math.max(1, pagination?.totalPages ?? 1));
          this.totalBookings.set(Math.max(0, pagination?.totalBookings ?? 0));
          if (pagination?.currentPage && pagination.currentPage !== this.currentPage()) {
            this.currentPage.set(pagination.currentPage);
          }
        },
        error: (err: HttpErrorResponse) => {
          this.bookings.set([]);
          const msg = err.error?.message;
          this.errorMessage.set(
            typeof msg === 'string' && msg.trim()
              ? msg
              : 'Failed to load bookings. Please try again.',
          );
        },
      });
  }
}
