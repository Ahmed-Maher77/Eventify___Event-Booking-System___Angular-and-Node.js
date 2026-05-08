import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export type ReviewVoteValue = 'up' | 'down';

export interface EventReviewItem {
  _id: string;
  authorId?: string;
  rating: number;
  message: string;
  createdAt: string;
  authorName: string;
  authorPictureUrl?: string;
  helpfulUp?: number;
  helpfulDown?: number;
  userVote?: ReviewVoteValue | null;
}

export interface EventReviewsResponse {
  success: boolean;
  message?: string;
  data: {
    reviews: EventReviewItem[];
    totalReviews: number;
    summary?: {
      averageRating: number;
      totalReviews: number;
      distribution: Array<{
        level: number;
        count: number;
        pct: number;
      }>;
    };
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
  data: EventReviewItem;
}

export interface UpdateEventReviewResponse {
  success: boolean;
  message?: string;
  data: EventReviewItem;
}

export interface DeleteEventReviewResponse {
  success: boolean;
  message?: string;
  data?: {
    reviewId: string;
  };
}

export interface ReviewVoteResponse {
  success: boolean;
  message?: string;
  data: {
    helpfulUp: number;
    helpfulDown: number;
    userVote: ReviewVoteValue | null;
  };
}

@Injectable({
  providedIn: 'root',
})
export class EventReviewService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.backendApiUrl.trim().replace(/\/+$/, '')}/events`;

  getReviews(eventId: string): Observable<EventReviewsResponse> {
    return this.http.get<EventReviewsResponse>(`${this.base}/${eventId}/reviews`, {
      withCredentials: true,
    });
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

  voteReview(eventId: string, reviewId: string, value: ReviewVoteValue): Observable<ReviewVoteResponse> {
    return this.http.post<ReviewVoteResponse>(`${this.base}/${eventId}/reviews/${reviewId}/vote`, { value }, {
      withCredentials: true,
    });
  }

  updateReview(
    eventId: string,
    reviewId: string,
    body: { rating?: number; message?: string },
  ): Observable<UpdateEventReviewResponse> {
    return this.http.patch<UpdateEventReviewResponse>(`${this.base}/${eventId}/reviews/${reviewId}`, body, {
      withCredentials: true,
    });
  }

  deleteReview(eventId: string, reviewId: string): Observable<DeleteEventReviewResponse> {
    return this.http.delete<DeleteEventReviewResponse>(`${this.base}/${eventId}/reviews/${reviewId}`, {
      withCredentials: true,
    });
  }

  adminDeleteReview(eventId: string, reviewId: string): Observable<DeleteEventReviewResponse> {
    return this.http.delete<DeleteEventReviewResponse>(
      `${this.base}/${eventId}/reviews/${reviewId}/admin-delete`,
      {
        withCredentials: true,
      },
    );
  }
}
