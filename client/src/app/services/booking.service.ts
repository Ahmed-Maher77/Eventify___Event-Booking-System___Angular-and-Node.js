import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface BookingPopulatedUser {
  _id: string;
  name?: string;
  email?: string;
}

export interface BookingPopulatedEvent {
  _id: string;
  title?: string;
  date?: string;
  location?: string;
}

export interface BookingItem {
  _id: string;
  userId: string | BookingPopulatedUser;
  eventId: string | BookingPopulatedEvent;
  quantity: number;
  totalPrice: number;
  status: 'pending' | 'confirmed' | 'cancelled';
  createdAt?: string;
  updatedAt?: string;
}

export interface BookingCreatePayload {
  eventId: string;
  quantity: number;
}

export interface BookingCreateResponse {
  success: boolean;
  message?: string;
  data: BookingItem;
}

export interface BookingDetailsResponse {
  success: boolean;
  message?: string;
  data: BookingItem | null;
}

export interface BookingCancelResponse {
  success: boolean;
  message?: string;
  data?: BookingItem | null;
}

export interface BookingDeleteResponse {
  success: boolean;
  message?: string;
}

export interface BookingUpdateQuantityPayload {
  quantity: number;
}

export interface BookingUpdateQuantityResponse {
  success: boolean;
  message?: string;
  data: BookingItem;
}

export interface UserBookingsSummaryResponse {
  success: boolean;
  message?: string;
  data?: {
    pagination?: {
      totalBookings?: number;
    };
  };
}

export interface UserBookingsPagination {
  currentPage: number;
  totalPages: number;
  totalBookings: number;
  limit: number;
}

export interface UserBookingsResponse {
  success: boolean;
  message?: string;
  data?: {
    bookings?: BookingItem[];
    pagination?: UserBookingsPagination;
  };
}

export interface UserBookingsQuery {
  page?: number;
  limit?: number;
  status?: 'pending' | 'confirmed' | 'cancelled' | '';
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

  getBookingById(id: string): Observable<BookingDetailsResponse> {
    return this.http.get<BookingDetailsResponse>(`${this.url}/${id}`, { withCredentials: true });
  }

  cancelBooking(id: string): Observable<BookingCancelResponse> {
    return this.http.delete<BookingCancelResponse>(`${this.url}/${id}`, { withCredentials: true });
  }

  deleteCancelledBooking(id: string): Observable<BookingDeleteResponse> {
    return this.http.delete<BookingDeleteResponse>(`${this.url}/${id}/remove`, {
      withCredentials: true,
    });
  }

  updateBookingQuantity(
    id: string,
    payload: BookingUpdateQuantityPayload,
  ): Observable<BookingUpdateQuantityResponse> {
    return this.http.patch<BookingUpdateQuantityResponse>(`${this.url}/${id}/quantity`, payload, {
      withCredentials: true,
    });
  }

  getActiveBookingForEvent(eventId: string): Observable<BookingDetailsResponse> {
    return this.http.get<BookingDetailsResponse>(`${this.url}/events/${eventId}/active`, {
      withCredentials: true,
    });
  }

  getUserBookings(query: UserBookingsQuery = {}): Observable<UserBookingsResponse> {
    const searchParams = new URLSearchParams();
    if (query.page && Number.isFinite(query.page) && query.page > 0) {
      searchParams.set('page', String(query.page));
    }
    if (query.limit && Number.isFinite(query.limit) && query.limit > 0) {
      searchParams.set('limit', String(query.limit));
    }
    if (query.status && query.status.trim()) {
      searchParams.set('status', query.status);
    }
    const serialized = searchParams.toString();
    const endpoint = serialized ? `${this.url}?${serialized}` : this.url;
    return this.http.get<UserBookingsResponse>(endpoint, { withCredentials: true });
  }

  getUserBookingsSummary(): Observable<UserBookingsSummaryResponse> {
    return this.http.get<UserBookingsSummaryResponse>(`${this.url}?page=1&limit=1`, {
      withCredentials: true,
    });
  }
}
