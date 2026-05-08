import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { BookingItem, BookingService } from '../../services/booking.service';
import { ToastService } from '../../services/toast.service';
import { HighlightedPageHeadingComponent } from '../../shared/highlighted-page-heading/highlighted-page-heading';
import { SectionLoader } from '../../shared/section-loader/section-loader';
import { Button } from '../../shared/button/button';

@Component({
  selector: 'app-booking-details-page',
  standalone: true,
  imports: [CommonModule, RouterLink, HighlightedPageHeadingComponent, SectionLoader, Button],
  templateUrl: './booking-details.page.html',
  styleUrl: './booking-details.page.scss',
})
export class BookingDetailsPage implements OnInit {
  private readonly route = inject(ActivatedRoute);
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

  protected canCancelBooking(): boolean {
    const booking = this.booking();
    return !!booking && booking.status !== 'cancelled';
  }

  protected cancelBooking(): void {
    const booking = this.booking();
    if (!booking || this.isCancelling() || booking.status === 'cancelled') {
      return;
    }

    this.isCancelling.set(true);
    this.bookingService
      .cancelBooking(booking._id)
      .pipe(finalize(() => this.isCancelling.set(false)))
      .subscribe({
        next: () => {
          this.booking.update((current) => (current ? { ...current, status: 'cancelled' } : current));
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
}
