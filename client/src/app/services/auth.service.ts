import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, finalize, tap } from 'rxjs';
import { AuthResponse, LoginPayload, RegisterPayload, UserData } from './auth.model';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly accessTokenStorageKey = 'eventify_access_token';
  private readonly userDataStorageKey = 'eventify_user_data';
  private readonly authApiUrl = `${environment.backendApiUrl.trim().replace(/\/+$/, '')}/auth`;
  userData: UserData | null = null;

  constructor() {
    this.initializeUserData();
  }

  isLoggedIn(): boolean {
    const token = this.getStoredAccessToken();
    if (!token) {
      return false;
    }

    const payload = this.decodeJwtPayload(token);
    // Treat tokens without expiration as invalid.
    if (!payload?.exp) {
      return false;
    }

    // JWT exp is in seconds; Date.now() is milliseconds.
    return payload.exp * 1000 > Date.now();
  }

  isAdmin(): boolean {
    // return true;
    return this.userData?.role === 'admin';
  }

  login(payload: LoginPayload): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.authApiUrl}/login`, payload, { withCredentials: true }).pipe(
      tap((response) => this.persistAuthState(response.token, response.data))
    );
  }

  register(payload: RegisterPayload | FormData): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(`${this.authApiUrl}/register`, payload, { withCredentials: true })
      .pipe(
      tap((response) => this.persistAuthState(response.token, response.data))
    );
  }

  private initializeUserData(): void {
    if (!this.isLoggedIn()) {
      this.userData = null;
      return;
    }

    const storedUserData = this.getStoredUserData();
    if (storedUserData) {
      this.userData = storedUserData;
    } else {
      const token = this.getStoredAccessToken();
      if (!token) {
        this.userData = null;
        return;
      }

      const payload = this.decodeJwtPayload(token);
      this.userData = payload
        ? {
            id: payload.id,
            role: payload.role,
            name: payload.name,
            email: payload.email,
            pictureUrl: payload.pictureUrl
          }
        : null;
    }
  }

  private decodeJwtPayload(token: string): {
    id?: string;
    role?: string;
    exp?: number;
    name?: string;
    email?: string;
    pictureUrl?: string;
  } | null {
    try {
      const [, payload] = token.split('.');
      if (!payload) {
        return null;
      }

      // JWT payload uses base64url encoding.
      const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
      const paddedBase64 = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), '=');
      const decodedPayload = atob(paddedBase64);
      return JSON.parse(decodedPayload) as {
        id?: string;
        role?: string;
        exp?: number;
        name?: string;
        email?: string;
        pictureUrl?: string;
      };
    } catch {
      return null;
    }
  }

  logout(): void {
    this.http
      .post<{ success: boolean; message: string }>(`${this.authApiUrl}/logout`, {}, { withCredentials: true })
      .pipe(finalize(() => this.clearLocalAuthState()))
      .subscribe({
        error: () => {
          // Local state is still cleared in finalize even if request fails.
        }
      });
  }

  private persistAuthState(token: string, user: UserData): void {
    localStorage.setItem(this.accessTokenStorageKey, token);
    localStorage.setItem(this.userDataStorageKey, JSON.stringify(user));
    this.userData = {
      id: user.id,
      role: user.role,
      name: user.name,
      email: user.email,
      pictureUrl: user.pictureUrl
    };
  }

  private getStoredAccessToken(): string | null {
    return localStorage.getItem(this.accessTokenStorageKey);
  }

  private getStoredUserData(): UserData | null {
    const raw = localStorage.getItem(this.userDataStorageKey);
    if (!raw) {
      return null;
    }

    try {
      return JSON.parse(raw) as UserData;
    } catch {
      return null;
    }
  }

  private clearLocalAuthState(): void {
    localStorage.removeItem(this.accessTokenStorageKey);
    localStorage.removeItem(this.userDataStorageKey);
    this.userData = null;
  }
}
