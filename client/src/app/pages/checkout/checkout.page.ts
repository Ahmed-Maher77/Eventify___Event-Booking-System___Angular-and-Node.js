import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import {
  ChangeDetectorRef,
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  ViewChild,
  inject,
  signal,
} from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import type { Stripe, StripeElements, StripePaymentElement } from '@stripe/stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { finalize, concatMap } from 'rxjs';
import { BookingService } from '../../services/booking.service';
import { CheckoutService } from '../../services/checkout.service';
import { ToastService } from '../../services/toast.service';
import { HighlightedPageHeadingComponent } from '../../shared/highlighted-page-heading/highlighted-page-heading';
import { Button } from '../../shared/button/button';
import { SectionLoader } from '../../shared/section-loader/section-loader';

@Component({
  selector: 'app-checkout-page',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    HighlightedPageHeadingComponent,
    SectionLoader,
    Button,
  ],
  templateUrl: './checkout.page.html',
  styleUrl: './checkout.page.scss',
})
export class CheckoutPage implements OnInit, OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly checkoutApi = inject(CheckoutService);
  private readonly bookings = inject(BookingService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly toast = inject(ToastService);

  @ViewChild('paymentElementHost') paymentHost?: ElementRef<HTMLDivElement>;

  protected readonly loading = signal(true);
  protected readonly errorMessage = signal<string | null>(null);
  protected readonly bookingSummary = signal<{ title: string; total: number; quantity: number } | null>(
    null,
  );
  protected readonly paying = signal(false);
  /** Payment Element mounted and Stripe emitted `ready` — safe to call confirmPayment */
  protected readonly stripeFormReady = signal(false);
  /** Stripe field errors — keeps checkout layout visible (not routed through page-level errorMessage). */
  protected readonly stripeError = signal<string | null>(null);
  protected readonly cancelBookingBusy = signal(false);

  private bookingId = '';
  private stripe: Stripe | null = null;
  private elements: StripeElements | null = null;
  private paymentElement: StripePaymentElement | null = null;
  private clientSecret: string | null = null;
  private paymentMounted = false;

  ngOnInit(): void {
    const bid = this.route.snapshot.queryParamMap.get('bookingId');
    if (!bid?.trim()) {
      this.errorMessage.set('Missing booking. Return to My Bookings and choose Pay.');
      this.loading.set(false);
      return;
    }
    this.bookingId = bid.trim();
    this.bookings.getBookingById(this.bookingId).subscribe({
      next: (res) => {
        const b = res.data;
        if (!b) {
          this.errorMessage.set('Booking not found.');
          this.loading.set(false);
          return;
        }
        if (b.status !== 'pending' || b.totalPrice <= 0) {
          void this.router.navigate(['/bookings', this.bookingId]);
          return;
        }
        const title =
          typeof b.eventId === 'object' && b.eventId?.title ? b.eventId.title : 'Event';
        this.bookingSummary.set({
          title,
          total: b.totalPrice,
          quantity: b.quantity,
        });
        this.checkoutApi
          .createPaymentIntent(this.bookingId)
          .pipe(finalize(() => this.loading.set(false)))
          .subscribe({
            next: (intent) => {
              const sec = intent.data?.clientSecret;
              const pk = intent.data?.publishableKey;
              if (!sec || !pk) {
                this.errorMessage.set('Unable to start secure checkout.');
                return;
              }
              this.clientSecret = sec;
              void this.initStripe(pk, sec);
            },
            error: (err: HttpErrorResponse) => {
              const msg = err.error?.message;
              this.errorMessage.set(
                typeof msg === 'string' && msg.trim()
                  ? msg
                  : 'Could not start payment. Try again later.',
              );
            },
          });
      },
      error: () => {
        this.errorMessage.set('Unable to load booking.');
        this.loading.set(false);
      },
    });
  }

  ngOnDestroy(): void {
    this.teardownStripe();
  }

  private teardownStripe(): void {
    this.paymentElement?.unmount();
    this.paymentElement = null;
    this.elements = null;
    this.stripe = null;
    this.paymentMounted = false;
    this.stripeFormReady.set(false);
  }

  /**
   * Cancel reservation (refund if already captured — server handles), then remove cancelled row.
   */
  protected cancelDeleteBooking(): void {
    if (this.cancelBookingBusy() || this.paying()) {
      return;
    }
    const ok = window.confirm(
      'Cancel this reservation and remove it from My Bookings?\n\nYour seats will be released. If a payment already completed, it will be refunded according to your bank.',
    );
    if (!ok) {
      return;
    }

    this.teardownStripe();
    this.cancelBookingBusy.set(true);
    this.bookings
      .cancelBooking(this.bookingId)
      .pipe(
        concatMap(() => this.bookings.deleteCancelledBooking(this.bookingId)),
        finalize(() => this.cancelBookingBusy.set(false)),
      )
      .subscribe({
        next: () => {
          this.toast.showSuccess('Booking cancelled and removed from your list.');
          void this.router.navigate(['/bookings']);
        },
        error: (err: HttpErrorResponse) => {
          const msg = err.error?.message;
          this.toast.showError(
            typeof msg === 'string' && msg.trim()
              ? msg
              : 'Could not cancel this booking. Try again from My Bookings.',
          );
        },
      });
  }

  private async initStripe(publishableKey: string, clientSecret: string): Promise<void> {
    try {
      const stripe = await loadStripe(publishableKey);
      if (!stripe) {
        this.errorMessage.set('Payment library failed to load.');
        return;
      }
      this.stripe = stripe;
      this.elements = stripe.elements({
        clientSecret,
        appearance: { theme: 'stripe' },
      });
      this.paymentElement = this.elements.create('payment');

      this.paymentElement.on('ready', () => {
        this.stripeFormReady.set(true);
        this.cdr.markForCheck();
      });

      this.paymentElement.on('loaderror', (event) => {
        const err = event?.error as { message?: string } | undefined;
        this.stripeError.set(err?.message?.trim() ? err.message : 'Payment form failed to load.');
        this.stripeFormReady.set(false);
        this.cdr.markForCheck();
      });

      this.stripeFormReady.set(false);
      this.stripeError.set(null);
      this.cdr.detectChanges();

      await this.flushLayout();
      await this.tryMountPaymentElement();

      if (!this.paymentMounted) {
        await new Promise<void>((r) => setTimeout(r, 0));
        await this.tryMountPaymentElement();
      }
    } catch {
      this.errorMessage.set('Could not initialize payment form.');
    }
  }

  /** Give the host node dimensions after templates settle (Stripe needs a laid-out mount target). */
  private flushLayout(): Promise<void> {
    return new Promise((resolve) => {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => resolve());
      });
    });
  }

  private async tryMountPaymentElement(): Promise<void> {
    if (this.paymentMounted || !this.paymentElement) {
      return;
    }
    let host = this.paymentHost?.nativeElement;
    if (!host) {
      this.cdr.detectChanges();
      host = this.paymentHost?.nativeElement;
    }
    if (!host) {
      await new Promise<void>((resolve) => queueMicrotask(resolve));
      host = this.paymentHost?.nativeElement;
    }
    if (!host || this.paymentMounted) {
      return;
    }
    this.paymentElement.mount(host);
    this.paymentMounted = true;
  }

  protected async submitPayment(): Promise<void> {
    if (!this.stripe || !this.elements || !this.clientSecret || this.paying()) {
      return;
    }
    if (!this.stripeFormReady()) {
      this.stripeError.set('Payment form is still loading. Please wait.');
      return;
    }
    this.paying.set(true);
    this.stripeError.set(null);
    const returnUrl = `${window.location.origin}/bookings/success?booking_id=${encodeURIComponent(this.bookingId)}`;
    const { error } = await this.stripe.confirmPayment({
      elements: this.elements,
      confirmParams: {
        return_url: returnUrl,
      },
    });
    this.paying.set(false);
    if (error) {
      this.stripeError.set(
        error.message || 'Payment could not be completed. You can try another card.',
      );
    }
  }
}
