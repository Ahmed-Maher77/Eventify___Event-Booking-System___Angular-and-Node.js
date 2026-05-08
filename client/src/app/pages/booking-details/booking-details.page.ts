import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { BookingItem, BookingService } from '../../services/booking.service';
import { ToastService } from '../../services/toast.service';
import { HighlightedPageHeadingComponent } from '../../shared/highlighted-page-heading/highlighted-page-heading';
import { SectionLoader } from '../../shared/section-loader/section-loader';
import { Button } from '../../shared/button/button';

const CANCELLATION_CUTOFF_HOURS = 48;

@Component({
  selector: 'app-booking-details-page',
  standalone: true,
  imports: [CommonModule, RouterLink, HighlightedPageHeadingComponent, SectionLoader, Button],
  templateUrl: './booking-details.page.html',
  styleUrl: './booking-details.page.scss',
})
export class BookingDetailsPage implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly bookingService = inject(BookingService);
  private readonly toast = inject(ToastService);

  protected readonly isLoading = signal(true);
  protected readonly isCancelling = signal(false);
  protected readonly errorMessage = signal<string | null>(null);
  protected readonly booking = signal<BookingItem | null>(null);

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.errorMessage.set('Booking ID is missing.');
      this.isLoading.set(false);
      return;
    }
    this.loadBooking(id);
  }

  protected eventTitle(): string {
    const event = this.booking()?.eventId;
    if (event && typeof event === 'object' && 'title' in event && event.title) {
      return event.title;
    }
    return 'Unknown event';
  }

  protected eventLocation(): string {
    const event = this.booking()?.eventId;
    if (event && typeof event === 'object' && 'location' in event && event.location) {
      return event.location;
    }
    return 'Location not available';
  }

  protected eventDate(): string | null {
    const event = this.booking()?.eventId;
    if (event && typeof event === 'object' && 'date' in event && event.date) {
      return event.date;
    }
    return null;
  }

  protected bookingStatusLabel(status: BookingItem['status']): string {
    if (status === 'pending') {
      return 'Awaiting payment';
    }
    return `${status[0].toUpperCase()}${status.slice(1)}`;
  }

  protected canPayBooking(): boolean {
    const b = this.booking();
    return !!b && b.status === 'pending' && b.totalPrice > 0;
  }

  protected goToCheckout(): void {
    const b = this.booking();
    if (!this.canPayBooking() || !b) {
      return;
    }
    void this.router.navigate(['/checkout'], { queryParams: { bookingId: b._id } });
  }

  protected canCancelBooking(): boolean {
    const booking = this.booking();
    return !!booking && booking.status !== 'cancelled' && this.isCancellationWindowOpen(booking);
  }

  protected cancellationPolicyNote(): string | null {
    const booking = this.booking();
    if (!booking || booking.status === 'cancelled') {
      return null;
    }
    if (this.isCancellationWindowOpen(booking)) {
      return 'You can cancel up to 48 hours before the event starts.';
    }
    return 'Cancellation is closed because this event starts in less than 48 hours.';
  }

  protected refundNotice(): string | null {
    const booking = this.booking();
    if (!booking || booking.status !== 'cancelled') {
      return null;
    }
    const refundStatus = (booking.payment?.refundStatus || '').toLowerCase();
    if (refundStatus === 'succeeded') {
      return 'Refund completed: your payment was returned to your original payment method.';
    }
    if (booking.payment?.refundId || refundStatus) {
      return 'Refund is being processed and will appear on your payment method shortly.';
    }
    return null;
  }

  protected cancelBooking(): void {
    const booking = this.booking();
    if (!booking || this.isCancelling() || booking.status === 'cancelled') {
      return;
    }
    if (!this.isCancellationWindowOpen(booking)) {
      this.toast.showError(
        'This booking can no longer be cancelled because the 48-hour window has passed.',
      );
      return;
    }

    this.isCancelling.set(true);
    this.bookingService
      .cancelBooking(booking._id)
      .pipe(finalize(() => this.isCancelling.set(false)))
      .subscribe({
        next: () => {
          this.booking.update((current) =>
            current ? { ...current, status: 'cancelled' } : current,
          );
          this.toast.showSuccess('Booking cancelled successfully.');
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

  protected retry(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      return;
    }
    this.loadBooking(id);
  }

  private loadBooking(id: string): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);
    this.bookingService
      .getBookingById(id)
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: (res) => {
          this.booking.set(res.data);
        },
        error: (err: HttpErrorResponse) => {
          this.booking.set(null);
          const msg = err.error?.message;
          this.errorMessage.set(
            typeof msg === 'string' && msg.trim()
              ? msg
              : 'Failed to load booking details. Please try again.',
          );
        },
      });
  }

  private isCancellationWindowOpen(booking: BookingItem): boolean {
    const eventDate = this.parseEventDate(booking);
    if (!eventDate) {
      return true;
    }
    const cutoffMs = CANCELLATION_CUTOFF_HOURS * 60 * 60 * 1000;
    return eventDate.getTime() - Date.now() >= cutoffMs;
  }

  private parseEventDate(booking: BookingItem): Date | null {
    if (typeof booking.eventId !== 'object' || !booking.eventId?.date) {
      return null;
    }
    const parsed = new Date(booking.eventId.date);
    if (Number.isNaN(parsed.getTime())) {
      return null;
    }
    return parsed;
  }
}
