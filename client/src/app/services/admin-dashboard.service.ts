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
    statusCounts?: {
      all: number;
      pending: number;
      confirmed: number;
      cancelled: number;
    };
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

export interface AdminUserDetailResponse {
  success: boolean;
  message: string;
  data: {
    user: AdminUserListItem;
  };
}

export interface CreateAdminPayload {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export interface CreateAdminResponse {
  success: boolean;
  message: string;
  data: {
    user: AdminUserListItem;
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

export interface AdminContactMessageMutationResponse {
  success: boolean;
  message: string;
  data: AdminContactMessageListItem;
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

export interface AdminDashboardStatsData {
  totalRevenue: number;
  ticketsSold: number;
  activeUsers: number;
  activeEvents: number;
  revenueChange: number;
  ticketsChange: number;
  activeUsersChange: number;
  newEventsThisWeek: number;
  chartData: ChartData[];
}


export interface ChartData {
  date: string;
  bookings: number;
}
export interface AdminDashboardStatsResponse {
  success: boolean;
  message: string;
  data: AdminDashboardStatsData;
}

export interface AdminRecentBooking {
  id: string;
  createdAt: string;
  eventTitle: string;
  quantity: number;
  status: string;
}

export interface AdminRecentBookingsResponse {
  success: boolean;
  message: string;
  data: AdminRecentBooking[];
}
export interface AdminAssistantActivityListItem {
  _id: string;
  userId: null | { _id: string; name: string; email: string };
  sessionId: string;
  userQuery: string;
  aiResponse: string;
  model: string;
  responseMs: number;
  relevantEventsCount: number;
  status: string;
  createdAt: string;
}

export interface AdminAssistantActivitiesResponse {
  status: string;
  results: number;
  total: number;
  data: {
    activities: AdminAssistantActivityListItem[];
  };
}

export interface AdminBookingsQuery {
  page?: number;
  limit?: number;
  status?: 'pending' | 'confirmed' | 'cancelled';
  userId?: string;
  eventId?: string;
  search?: string;
  sort?: 'createdAt' | 'status' | 'quantity' | 'totalPrice';
  order?: 'asc' | 'desc';
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
  search?: string;
  sort?: 'createdAt' | 'fullName' | 'email' | 'subject' | 'status';
  order?: 'asc' | 'desc';
}

export interface AdminNewsletterSubscribersQuery {
  page?: number;
  limit?: number;
  status?: string;
  search?: string;
  sort?: 'createdAt' | 'email' | 'status';
  order?: 'asc' | 'desc';
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
    if (options.search?.trim()) {
      params = params.set('search', options.search.trim());
    }
    if (options.sort) {
      params = params.set('sort', options.sort);
    }
    if (options.order) {
      params = params.set('order', options.order);
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

  getUserById(id: string): Observable<AdminUserDetailResponse> {
    return this.http.get<AdminUserDetailResponse>(`${this.adminBase}/users/${id}`, {
      withCredentials: true,
    });
  }

  createAdmin(payload: CreateAdminPayload): Observable<CreateAdminResponse> {
    return this.http.post<CreateAdminResponse>(`${this.adminBase}/users`, payload, {
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
    if (options.search?.trim()) {
      params = params.set('search', options.search.trim());
    }
    if (options.sort) {
      params = params.set('sort', options.sort);
    }
    if (options.order) {
      params = params.set('order', options.order);
    }
    return this.http.get<AdminContactMessagesResponse>(`${this.adminBase}/contact-messages`, {
      params,
      withCredentials: true,
    });
  }

  updateContactMessageStatus(
    id: string,
    status: 'new' | 'reviewed',
  ): Observable<AdminContactMessageMutationResponse> {
    return this.http.patch<AdminContactMessageMutationResponse>(
      `${this.adminBase}/contact-messages/${id}/status`,
      { status },
      { withCredentials: true },
    );
  }

  deleteContactMessage(id: string): Observable<{ success: boolean; message: string }> {
    return this.http.delete<{ success: boolean; message: string }>(`${this.adminBase}/contact-messages/${id}`, {
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
    if (options.search?.trim()) {
      params = params.set('search', options.search.trim());
    }
    if (options.sort) {
      params = params.set('sort', options.sort);
    }
    if (options.order) {
      params = params.set('order', options.order);
    }
    return this.http.get<AdminNewsletterSubscribersResponse>(`${this.adminBase}/newsletter-subscribers`, {
      params,
      withCredentials: true,
    });
  }

  updateNewsletterSubscriberStatus(
    id: string,
    status: 'active' | 'unsubscribed',
  ): Observable<{ success: boolean; message: string; data: AdminNewsletterSubscriberListItem }> {
    return this.http.patch<{ success: boolean; message: string; data: AdminNewsletterSubscriberListItem }>(
      `${this.adminBase}/newsletter-subscribers/${id}/status`,
      { status },
      { withCredentials: true },
    );
  }

  deleteNewsletterSubscriber(id: string): Observable<{ success: boolean; message: string }> {
    return this.http.delete<{ success: boolean; message: string }>(
      `${this.adminBase}/newsletter-subscribers/${id}`,
      { withCredentials: true },
    );
  }

  getDashboardStats(options: Number = 30): Observable<AdminDashboardStatsResponse> {
    let params = new HttpParams()
      .set('period', String(options));
    return this.http.get<AdminDashboardStatsResponse>(`${this.adminBase}/dashboard-stats`, {
      params,
      withCredentials: true,
    });
  }

  getRecentBookings(): Observable<AdminRecentBookingsResponse> {
    return this.http.get<AdminRecentBookingsResponse>(`${this.adminBase}/recent-bookings`, {
      withCredentials: true,});}
  getAssistantActivities(options: { page?: number; limit?: number } = {}): Observable<AdminAssistantActivitiesResponse> {
    const params = new HttpParams()
      .set('page', String(options.page ?? 1))
      .set('limit', String(options.limit ?? ADMIN_LIST_PAGE_SIZE));

    return this.http.get<AdminAssistantActivitiesResponse>(`${this.adminBase}/assistant-activity`, {
      params,
      withCredentials: true,
    });
  }
}
