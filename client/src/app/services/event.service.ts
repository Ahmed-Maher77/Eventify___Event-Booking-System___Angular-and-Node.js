import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface EventApiItem {
  _id: string;
  title: string;
  description?: string;
  date: string;
  location: string;
  category: string;
  capacity?: number;
  price: number;
  status?: 'upcoming' | 'ongoing' | 'completed' | 'cancelled';
  image?: string;
}

export interface EventsApiResponse {
  data: {
    events: EventApiItem[];
    pagination?: {
      currentPage: number;
      totalPages: number;
      totalEvents: number;
      limit: number;
    };
  };
}

export interface EventMutationResponse {
  data: EventApiItem;
  message?: string;
  success?: boolean;
}

export interface EventDeleteResponse {
  success: boolean;
  message?: string;
}

export interface SingleEventApiResponse {
  success: boolean;
  message?: string;
  data: EventApiItem;
}

export type EventSortField = 'date' | 'price' | 'title' | 'createdAt';
export type EventSortOrder = 'asc' | 'desc';

export type EventStatusFilter = 'upcoming' | 'ongoing' | 'completed' | 'cancelled';

export interface EventQueryOptions {
  page?: number;
  limit?: number;
  /** Full-text style: server matches title OR description (see API `search`). */
  search?: string;
  name?: string;
  category?: string;
  /** Filter by one or more categories (multi: repeated `categories=` + comma `category=`; single: both set to one slug). */
  categories?: string[];
  location?: string;
  minPrice?: number;
  maxPrice?: number;
  startDate?: string;
  endDate?: string;
  status?: EventStatusFilter;
  sort?: EventSortField;
  order?: EventSortOrder;
  /** When true, sends `debugFilters=1` so the API logs filter breakdown; also logs request in the browser console. */
  debugFilters?: boolean;
}

export interface CreateEventPayload {
  title: string;
  description: string;
  date: string;
  location: string;
  category: 'concert' | 'conference' | 'workshop' | 'seminar' | 'sports' | 'other';
  capacity: number;
  price: number;
  imageUrl?: string;
}

@Injectable({
  providedIn: 'root',
})
export class EventService {
  /** Maximum events returned per page for catalog-style lists. */
  static readonly MAX_EVENTS_PER_PAGE = 10;

  private readonly http = inject(HttpClient);
  private readonly eventsApiUrl = `${environment.backendApiUrl.trim().replace(/\/+$/, '')}/events`;

  private normalizePageLimit(requested?: number): number {
    const max = EventService.MAX_EVENTS_PER_PAGE;
    const fallback = max;
    const n = Math.floor(Number(requested));
    const base = Number.isFinite(n) && n > 0 ? n : fallback;
    return Math.min(max, Math.max(1, base));
  }

  getEvents(options: EventQueryOptions = {}): Observable<EventsApiResponse> {
    let params = new HttpParams()
      .set('page', String(options.page ?? 1))
      .set('limit', String(this.normalizePageLimit(options.limit)))
      .set('sort', options.sort ?? 'date')
      .set('order', options.order ?? 'asc');

    if (options.search?.trim()) {
      params = params.set('search', options.search.trim());
    }

    if (options.name?.trim()) {
      params = params.set('name', options.name.trim());
    }

    const fromList = [
      ...new Set(
        (options.categories ?? [])
          .map((c) => c.trim().toLowerCase())
          .filter((c) => c && c !== 'all'),
      ),
    ];
    const single = options.category?.trim().toLowerCase();
    const categoryParams =
      fromList.length > 0
        ? fromList
        : single && single !== 'all'
          ? [single]
          : [];
    if (categoryParams.length > 0) {
      if (categoryParams.length === 1) {
        params = params.set('categories', categoryParams[0]);
        params = params.set('category', categoryParams[0]);
      } else {
        // Send as repeated query parameters (e.g., ?categories=a&categories=b)
        // This is standard for REST APIs and guarantees the backend parses it as an array.
        for (const c of categoryParams) {
          params = params.append('categories', c);
          params = params.append('category', c);
        }
      }
    }

    if (options.location?.trim()) {
      params = params.set('location', options.location.trim());
    }

    if (typeof options.minPrice === 'number' && !Number.isNaN(options.minPrice)) {
      params = params.set('minPrice', String(options.minPrice));
    }

    if (typeof options.maxPrice === 'number' && !Number.isNaN(options.maxPrice)) {
      params = params.set('maxPrice', String(options.maxPrice));
    }

    if (options.startDate) {
      params = params.set('startDate', options.startDate);
    }

    if (options.endDate) {
      params = params.set('endDate', options.endDate);
    }

    if (options.status) {
      params = params.set('status', options.status);
    }

    return this.http.get<EventsApiResponse>(this.eventsApiUrl, { params });
  }

  /** Upcoming events, soonest first — used by home Featured Events. */
  getFeaturedEvents(
    options: { name?: string; category?: string; limit?: number } = {},
  ): Observable<EventsApiResponse> {
    return this.getEvents({
      name: options.name,
      category: options.category,
      limit: options.limit ?? EventService.MAX_EVENTS_PER_PAGE,
      sort: 'date',
      order: 'asc',
      status: 'upcoming',
      page: 1,
    });
  }

  createEvent(payload: CreateEventPayload | FormData): Observable<EventMutationResponse> {
    return this.http.post<EventMutationResponse>(this.eventsApiUrl, payload, {
      withCredentials: true,
    });
  }

  getEvent(id: string): Observable<SingleEventApiResponse> {
    return this.http.get<SingleEventApiResponse>(`${this.eventsApiUrl}/${id}`);
  }

  updateEvent(id: string, payload: CreateEventPayload | FormData): Observable<EventMutationResponse> {
    return this.http.put<EventMutationResponse>(`${this.eventsApiUrl}/${id}`, payload, {
      withCredentials: true,
    });
  }

  deleteEvent(id: string): Observable<EventDeleteResponse> {
    return this.http.delete<EventDeleteResponse>(`${this.eventsApiUrl}/${id}`, {
      withCredentials: true,
    });
  }
}
