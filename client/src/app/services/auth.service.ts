import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import Cookies from 'js-cookie';
import { Observable, tap } from 'rxjs';
import { AuthResponse, LoginPayload, RegisterPayload, UserData } from './auth.model';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly accessTokenCookieName = 'Eventify_AcessToken';
  private readonly authApiUrl = '/api/auth';
  userData: UserData | null = null;

  constructor() {
    this.initializeUserData();
  }

  isLoggedIn(): boolean {
    // Authentication is based on the access token stored in cookies.
    const token = Cookies.get(this.accessTokenCookieName);
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
    return this.userData?.role === 'admin';
  }

  login(payload: LoginPayload): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.authApiUrl}/login`, payload).pipe(
      tap((response) => this.persistAuthState(response.token, response.data))
    );
  }

  register(payload: RegisterPayload): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.authApiUrl}/register`, payload).pipe(
      tap((response) => this.persistAuthState(response.token, response.data))
    );
  }

  private initializeUserData(): void {
    if (!this.isLoggedIn()) {
      this.userData = null;
      return;
    }

    const token = Cookies.get(this.accessTokenCookieName);
    if (!token) {
      this.userData = null;
      return;
    }

    const payload = this.decodeJwtPayload(token);
    this.userData = payload ? { id: payload.id, role: payload.role } : null;
  }

  private decodeJwtPayload(token: string): { id?: string; role?: string; exp?: number } | null {
    try {
      const [, payload] = token.split('.');
      if (!payload) {
        return null;
      }

      // JWT payload uses base64url encoding.
      const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
      const paddedBase64 = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), '=');
      const decodedPayload = atob(paddedBase64);
      return JSON.parse(decodedPayload) as { id?: string; role?: string; exp?: number };
    } catch {
      return null;
    }
  }

  logout(): void {
    Cookies.remove(this.accessTokenCookieName);
    this.userData = null;
  }

  private persistAuthState(token: string, user: UserData): void {
    Cookies.set(this.accessTokenCookieName, token);
    this.userData = { id: user.id, role: user.role };
  }
}
