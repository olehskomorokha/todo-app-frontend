import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { inject, Injectable, PLATFORM_ID, signal } from '@angular/core';
import { tap } from 'rxjs';

export interface RegisterRequest {
  email: string;
  username: string;
  password: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface ApiError {
  code: string;
  message: string;
}

@Injectable({
  providedIn: 'root',
})
export class Auth {
  private readonly http = inject(HttpClient);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly apiUrl = 'http://localhost:8080/api/User';
  readonly authenticated = signal(this.getToken() !== null);

  register(data: RegisterRequest) {
    return this.http.post<void>(this.apiUrl, data);
  }

  login(data: LoginRequest) {
    return this.http.post(`${this.apiUrl}/login`, data, { responseType: 'text' }).pipe(
      tap(token => {
        if (isPlatformBrowser(this.platformId)) {
          localStorage.setItem('accessToken', token);
          this.authenticated.set(true);
        }
      }),
    );
  }

  logout(): void {
    if (isPlatformBrowser(this.platformId)) {
      localStorage.removeItem('accessToken');
      this.authenticated.set(false);
    }
  }

  getToken(): string | null {
    if (!isPlatformBrowser(this.platformId)) {
      return null;
    }

    return localStorage.getItem('accessToken');
  }

  isAuthenticated(): boolean {
    return this.authenticated();
  }

  getUserId(): number | null {
    const token = this.getToken();
    if (!token) return null;

    try {
      const payload = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
      const claim = 'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier';
      const userId = Number(payload[claim] ?? payload.sub);
      return Number.isInteger(userId) ? userId : null;
    } catch {
      return null;
    }
  }
}
