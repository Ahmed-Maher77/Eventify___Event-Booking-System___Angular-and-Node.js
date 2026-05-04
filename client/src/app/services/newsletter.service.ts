import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface NewsletterSubscriptionPayload {
  email: string;
}

export interface NewsletterSubscriptionApiResponse {
  success: boolean;
  message: string;
  data: {
    _id: string;
    email: string;
    status: 'active' | 'unsubscribed';
    createdAt: string;
    updatedAt: string;
  };
}

@Injectable({
  providedIn: 'root'
})
export class NewsletterService {
  private readonly http = inject(HttpClient);
  private readonly newsletterApiUrl = `${environment.backendApiUrl.trim().replace(/\/+$/, '')}/newsletter`;

  subscribe(payload: NewsletterSubscriptionPayload): Observable<NewsletterSubscriptionApiResponse> {
    return this.http.post<NewsletterSubscriptionApiResponse>(this.newsletterApiUrl, payload);
  }
}
