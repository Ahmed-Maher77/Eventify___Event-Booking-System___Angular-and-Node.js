import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface ContactMessagePayload {
  fullName: string;
  email: string;
  subject: string;
  message: string;
}

export interface ContactMessageApiResponse {
  success: boolean;
  message: string;
  data: {
    _id: string;
    fullName: string;
    email: string;
    subject: string;
    message: string;
    status: 'new' | 'reviewed';
    createdAt: string;
    updatedAt: string;
  };
}

@Injectable({
  providedIn: 'root'
})
export class ContactService {
  private readonly http = inject(HttpClient);
  private readonly contactApiUrl = `${environment.backendApiUrl.trim().replace(/\/+$/, '')}/contact`;

  submitMessage(payload: ContactMessagePayload): Observable<ContactMessageApiResponse> {
    return this.http.post<ContactMessageApiResponse>(this.contactApiUrl, payload);
  }
}
