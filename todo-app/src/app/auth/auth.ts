import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { inject, Injectable, PLATFORM_ID } from '@angular/core';
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
  private readonly apiUrl = 'https://localhost:7225/api/User';

  register(data: RegisterRequest) {
    return this.http.post<void>(this.apiUrl, data);
  }

  login(data: LoginRequest) {
    return this.http.post(`${this.apiUrl}/login`, data, { responseType: 'text' }).pipe(
      tap(token => {
        if (isPlatformBrowser(this.platformId)) {
          localStorage.setItem('accessToken', token);
        }
      }),
    );
  }

  logout(): void {
    if (isPlatformBrowser(this.platformId)) {
      localStorage.removeItem('accessToken');
    }
  }

  getToken(): string | null {
    if (!isPlatformBrowser(this.platformId)) {
      return null;
    }

    return localStorage.getItem('accessToken');
  }

  isAuthenticated(): boolean {
    return this.getToken() !== null;
  }
}
