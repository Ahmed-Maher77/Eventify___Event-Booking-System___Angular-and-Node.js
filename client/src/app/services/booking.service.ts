import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface BookingCreatePayload {
  eventId: string;
  quantity: number;
}

export interface BookingCreateResponse {
  success: boolean;
  message?: string;
  data: {
    _id: string;
    userId: unknown;
    eventId: unknown;
    quantity: number;
    totalPrice: number;
    status: string;
  };
}

@Injectable({
  providedIn: 'root',
})
export class BookingService {
  private readonly http = inject(HttpClient);
  private readonly url = `${environment.backendApiUrl.trim().replace(/\/+$/, '')}/bookings`;

  createBooking(payload: BookingCreatePayload): Observable<BookingCreateResponse> {
    return this.http.post<BookingCreateResponse>(this.url, payload, { withCredentials: true });
  }
}
