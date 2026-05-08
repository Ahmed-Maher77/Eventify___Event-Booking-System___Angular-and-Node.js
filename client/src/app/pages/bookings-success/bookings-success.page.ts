import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnDestroy, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Subscription, catchError, concatMap, finalize, of } from 'rxjs';
import { BookingService } from '../../services/booking.service';
import { CheckoutService } from '../../services/checkout.service';
import { HighlightedPageHeadingComponent } from '../../shared/highlighted-page-heading/highlighted-page-heading';
import { Button } from '../../shared/button/button';
import { SectionLoader } from '../../shared/section-loader/section-loader';

const MAX_POLLS = 14;
const POLL_MS = 1400;

@Component({
  selector: 'app-bookings-success-page',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    HighlightedPageHeadingComponent,
    SectionLoader,
    Button,
  ],
  templateUrl: './bookings-success.page.html',
  styleUrls: ['../../../sass/components/static-info-page.scss', './bookings-success.page.scss'],
})
export class BookingsSuccessPage implements OnInit, OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly bookingService = inject(BookingService);
  private readonly checkoutApi = inject(CheckoutService);

  private pollCount = 0;
  private sub: Subscription | null = null;
  private timeoutId: ReturnType<typeof setTimeout> | null = null;

  protected readonly loading = signal(true);
  protected readonly errorMessage = signal<string | null>(null);
  protected readonly confirmed = signal(false);

  ngOnInit(): void {
    const id =
      this.route.snapshot.queryParamMap.get('booking_id') ||
      this.route.snapshot.queryParamMap.get('bookingId');
    if (!id?.trim()) {
      this.errorMessage.set('Missing booking reference. Open My Bookings to check status.');
      this.loading.set(false);
      return;
    }
    this.tryConfirm(id.trim(), true);
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
    if (this.timeoutId !== null) {
      clearTimeout(this.timeoutId);
    }
  }

  /**
   * First poll runs `/checkout/sync-payment` so confirmation does not depend on Stripe webhooks
   * (often missing on localhost). Later polls only read booking status.
   */
  private tryConfirm(bookingId: string, runStripeSync: boolean): void {
    const booking$ = runStripeSync
      ? this.checkoutApi.syncPayment(bookingId).pipe(
          catchError(() => of(null)),
          concatMap(() => this.bookingService.getBookingById(bookingId)),
        )
      : this.bookingService.getBookingById(bookingId);

    this.sub = booking$
      .pipe(finalize(() => (this.sub = null)))
      .subscribe({
        next: (res) => {
          const data = res.data;
          if (data?.status === 'confirmed') {
            this.confirmed.set(true);
            this.loading.set(false);
            return;
          }
          if (this.pollCount >= MAX_POLLS) {
            this.loading.set(false);
            this.errorMessage.set(
              'Payment may still be processing, or the server has not confirmed it yet. In My Bookings, check the Awaiting payment tab—once confirmation runs, the booking moves to Confirmed. Refresh the list if needed.',
            );
            return;
          }
          this.pollCount++;
          this.timeoutId = setTimeout(() => this.tryConfirm(bookingId, false), POLL_MS);
        },
        error: (err: HttpErrorResponse) => {
          this.loading.set(false);
          const msg = err.error?.message;
          this.errorMessage.set(
            typeof msg === 'string' && msg.trim()
              ? msg
              : 'Unable to verify booking status.',
          );
        },
      });
  }
}
