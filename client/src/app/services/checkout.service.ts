import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface PaymentIntentResponse {
  success: boolean;
  message?: string;
  data?: {
    clientSecret: string;
    publishableKey: string;
    bookingId: string;
  };
}

export interface SyncPaymentResponse {
  success: boolean;
  message?: string;
  data?: {
    status?: string;
    paymentIntentStatus?: string;
  };
}

@Injectable({
  providedIn: 'root',
})
export class CheckoutService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.backendApiUrl.trim().replace(/\/+$/, '')}/checkout`;

  createPaymentIntent(bookingId: string): Observable<PaymentIntentResponse> {
    return this.http.post<PaymentIntentResponse>(
      `${this.base}/payment-intent`,
      { bookingId },
      { withCredentials: true },
    );
  }

  /** Ask the server to read PaymentIntent from Stripe and confirm the booking (covers delayed/missing webhooks). */
  syncPayment(bookingId: string): Observable<SyncPaymentResponse> {
    return this.http.post<SyncPaymentResponse>(
      `${this.base}/sync-payment`,
      { bookingId },
      { withCredentials: true },
    );
  }
}
