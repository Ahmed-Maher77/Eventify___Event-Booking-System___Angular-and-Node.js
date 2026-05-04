import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

/** Matches typical admin list `limit` (event catalog uses 10). */
export const ADMIN_LIST_PAGE_SIZE = 10;

export interface AdminPaginationCore {
  currentPage: number;
  totalPages: number;
  limit: number;
}

export interface AdminBookingsPagination extends AdminPaginationCore {
  totalBookings: number;
}

export interface AdminBookingPopulatedUser {
  _id: string;
  name?: string;
  email?: string;
}

export interface AdminBookingPopulatedEvent {
  _id: string;
  title?: string;
  date?: string;
  location?: string;
}

export interface AdminBookingListItem {
  _id: string;
  userId: string | AdminBookingPopulatedUser;
  eventId: string | AdminBookingPopulatedEvent;
  quantity: number;
  totalPrice: number;
  status: 'pending' | 'confirmed' | 'cancelled';
  createdAt?: string;
  updatedAt?: string;
}

export interface AdminBookingsResponse {
  success: boolean;
  message: string;
  data: {
    bookings: AdminBookingListItem[];
    pagination: AdminBookingsPagination;
  };
}

export interface AdminUsersPagination extends AdminPaginationCore {
  totalUsers: number;
}

export interface AdminUserListItem {
  _id: string;
  name: string;
  email: string;
  role: 'admin' | 'user';
  pictureUrl?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface AdminUsersResponse {
  success: boolean;
  message: string;
  data: {
    users: AdminUserListItem[];
    pagination: AdminUsersPagination;
  };
}

export interface AdminContactMessagesPagination extends AdminPaginationCore {
  totalMessages: number;
}

export interface AdminContactMessageListItem {
  _id: string;
  fullName: string;
  email: string;
  subject: string;
  message: string;
  status: 'new' | 'reviewed';
  createdAt: string;
  updatedAt: string;
}

export interface AdminContactMessagesResponse {
  success: boolean;
  message: string;
  data: {
    messages: AdminContactMessageListItem[];
    pagination: AdminContactMessagesPagination;
  };
}

export interface AdminNewsletterPagination extends AdminPaginationCore {
  totalSubscribers: number;
}

export interface AdminNewsletterSubscriberListItem {
  _id: string;
  email: string;
  status: 'active' | 'unsubscribed';
  createdAt: string;
  updatedAt: string;
}

export interface AdminNewsletterSubscribersResponse {
  success: boolean;
  message: string;
  data: {
    subscribers: AdminNewsletterSubscriberListItem[];
    pagination: AdminNewsletterPagination;
  };
}

export interface AdminBookingsQuery {
  page?: number;
  limit?: number;
  status?: string;
  userId?: string;
  eventId?: string;
}

export interface AdminUsersQuery {
  page?: number;
  limit?: number;
  role?: 'admin' | 'user';
  search?: string;
  sort?: 'createdAt' | 'name' | 'email' | 'role';
  order?: 'asc' | 'desc';
}

export interface AdminContactMessagesQuery {
  page?: number;
  limit?: number;
  status?: string;
}

export interface AdminNewsletterSubscribersQuery {
  page?: number;
  limit?: number;
  status?: string;
}

@Injectable({
  providedIn: 'root',
})
export class AdminDashboardService {
  private readonly http = inject(HttpClient);
  private readonly adminBase = `${environment.backendApiUrl.trim().replace(/\/+$/, '')}/admin`;

  getBookings(options: AdminBookingsQuery = {}): Observable<AdminBookingsResponse> {
    let params = new HttpParams()
      .set('page', String(options.page ?? 1))
      .set('limit', String(options.limit ?? ADMIN_LIST_PAGE_SIZE));
    if (options.status?.trim()) {
      params = params.set('status', options.status.trim());
    }
    if (options.userId?.trim()) {
      params = params.set('userId', options.userId.trim());
    }
    if (options.eventId?.trim()) {
      params = params.set('eventId', options.eventId.trim());
    }
    return this.http.get<AdminBookingsResponse>(`${this.adminBase}/bookings`, {
      params,
      withCredentials: true,
    });
  }

  getUsers(options: AdminUsersQuery = {}): Observable<AdminUsersResponse> {
    let params = new HttpParams()
      .set('page', String(options.page ?? 1))
      .set('limit', String(options.limit ?? ADMIN_LIST_PAGE_SIZE));
    if (options.role) {
      params = params.set('role', options.role);
    }
    if (options.search?.trim()) {
      params = params.set('search', options.search.trim());
    }
    if (options.sort) {
      params = params.set('sort', options.sort);
    }
    if (options.order) {
      params = params.set('order', options.order);
    }
    return this.http.get<AdminUsersResponse>(`${this.adminBase}/users`, {
      params,
      withCredentials: true,
    });
  }

  getContactMessages(options: AdminContactMessagesQuery = {}): Observable<AdminContactMessagesResponse> {
    let params = new HttpParams()
      .set('page', String(options.page ?? 1))
      .set('limit', String(options.limit ?? ADMIN_LIST_PAGE_SIZE));
    if (options.status?.trim()) {
      params = params.set('status', options.status.trim());
    }
    return this.http.get<AdminContactMessagesResponse>(`${this.adminBase}/contact-messages`, {
      params,
      withCredentials: true,
    });
  }

  getNewsletterSubscribers(
    options: AdminNewsletterSubscribersQuery = {},
  ): Observable<AdminNewsletterSubscribersResponse> {
    let params = new HttpParams()
      .set('page', String(options.page ?? 1))
      .set('limit', String(options.limit ?? ADMIN_LIST_PAGE_SIZE));
    if (options.status?.trim()) {
      params = params.set('status', options.status.trim());
    }
    return this.http.get<AdminNewsletterSubscribersResponse>(`${this.adminBase}/newsletter-subscribers`, {
      params,
      withCredentials: true,
    });
  }
}
