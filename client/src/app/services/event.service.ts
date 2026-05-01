import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface EventApiItem {
  _id: string;
  title: string;
  date: string;
  location: string;
  category: string;
  price: number;
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

export type EventSortField = 'date' | 'price' | 'title' | 'createdAt';
export type EventSortOrder = 'asc' | 'desc';

export interface EventQueryOptions {
  page?: number;
  limit?: number;
  name?: string;
  category?: string;
  location?: string;
  minPrice?: number;
  maxPrice?: number;
  startDate?: string;
  endDate?: string;
  sort?: EventSortField;
  order?: EventSortOrder;
}

@Injectable({
  providedIn: 'root'
})
export class EventService {
  private readonly http = inject(HttpClient);
  private readonly eventsApiUrl = `${environment.backendApiUrl.trim().replace(/\/+$/, '')}/events`;

  getEvents(options: EventQueryOptions = {}): Observable<EventsApiResponse> {
    let params = new HttpParams()
      .set('page', String(options.page ?? 1))
      .set('limit', String(options.limit ?? 12))
      .set('sort', options.sort ?? 'date')
      .set('order', options.order ?? 'asc');

    if (options.name?.trim()) {
      params = params.set('name', options.name.trim());
    }

    const normalizedCategory = options.category?.trim().toLowerCase();
    if (normalizedCategory && normalizedCategory !== 'all') {
      params = params.set('category', normalizedCategory);
    }

    if (options.location?.trim()) {
      params = params.set('location', options.location.trim());
    }

    if (typeof options.minPrice === 'number') {
      params = params.set('minPrice', String(options.minPrice));
    }

    if (typeof options.maxPrice === 'number') {
      params = params.set('maxPrice', String(options.maxPrice));
    }

    if (options.startDate) {
      params = params.set('startDate', options.startDate);
    }

    if (options.endDate) {
      params = params.set('endDate', options.endDate);
    }

    return this.http.get<EventsApiResponse>(this.eventsApiUrl, { params });
  }

  getFeaturedEvents(options: { name?: string; category?: string; limit?: number } = {}): Observable<EventsApiResponse> {
    return this.getEvents({
      name: options.name,
      category: options.category,
      limit: options.limit ?? 12,
      sort: 'date',
      order: 'asc'
    });
  }
}
