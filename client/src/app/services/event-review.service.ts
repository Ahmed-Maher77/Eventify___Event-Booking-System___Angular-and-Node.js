import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface EventReviewItem {
  _id: string;
  rating: number;
  message: string;
  createdAt: string;
  authorName: string;
}

export interface EventReviewsResponse {
  success: boolean;
  message?: string;
  data: {
    reviews: EventReviewItem[];
    totalReviews: number;
  };
}

export type EventReviewBlockReason =
  | 'NOT_AUTHENTICATED'
  | 'EVENT_NOT_ENDED'
  | 'NO_CONFIRMED_BOOKING'
  | 'EVENT_CANCELLED'
  | 'ALREADY_REVIEWED'
  | 'INVALID_EVENT_DATE'
  | null;

export interface EventReviewStatusResponse {
  success: boolean;
  data: {
    authenticated: boolean;
    canReview: boolean;
    hasReviewed: boolean;
    reason: EventReviewBlockReason;
    existingReview?: {
      _id: string;
      rating: number;
      message: string;
      createdAt: string;
    } | null;
  };
}

export interface CreateEventReviewResponse {
  success: boolean;
  message?: string;
  data: EventReviewItem & { authorName: string; createdAt?: string };
}

@Injectable({
  providedIn: 'root',
})
export class EventReviewService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.backendApiUrl.trim().replace(/\/+$/, '')}/events`;

  getReviews(eventId: string): Observable<EventReviewsResponse> {
    return this.http.get<EventReviewsResponse>(`${this.base}/${eventId}/reviews`);
  }

  getReviewStatus(eventId: string): Observable<EventReviewStatusResponse> {
    return this.http.get<EventReviewStatusResponse>(`${this.base}/${eventId}/review-status`, {
      withCredentials: true,
    });
  }

  createReview(eventId: string, body: { rating: number; message: string }): Observable<CreateEventReviewResponse> {
    return this.http.post<CreateEventReviewResponse>(`${this.base}/${eventId}/reviews`, body, {
      withCredentials: true,
    });
  }
}
