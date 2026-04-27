import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { resolveApiBaseUrl } from './api.config';

export interface EventApiItem {
  _id: string;
  title: string;
  date: string;
  location: string;
  category: string;
  price: number;
  image?: string;
}

interface EventsApiResponse {
  data: {
    events: EventApiItem[];
  };
}

@Injectable({
  providedIn: 'root'
})
export class EventService {
  private readonly http = inject(HttpClient);
  private readonly eventsApiUrl = `${resolveApiBaseUrl()}/events`;

  getFeaturedEvents(options: { name?: string; category?: string; limit?: number } = {}): Observable<EventsApiResponse> {
    let params = new HttpParams()
      .set('limit', String(options.limit ?? 12))
      .set('sort', 'date')
      .set('order', 'asc');

    if (options.name?.trim()) {
      params = params.set('name', options.name.trim());
    }

    const normalizedCategory = options.category?.trim().toLowerCase();
    if (normalizedCategory && normalizedCategory !== 'all') {
      params = params.set('category', normalizedCategory);
    }

    return this.http.get<EventsApiResponse>(this.eventsApiUrl, { params });
  }
}
