import { isPlatformBrowser } from '@angular/common';
import { HttpInterceptorFn } from '@angular/common/http';
import { inject, PLATFORM_ID } from '@angular/core';

const API_URL = 'https://localhost:7225/api';

export const authInterceptor: HttpInterceptorFn = (request, next) => {
  const platformId = inject(PLATFORM_ID);

  if (!isPlatformBrowser(platformId) || !request.url.startsWith(API_URL)) {
    return next(request);
  }

  const token = localStorage.getItem('accessToken');
  if (!token) {
    return next(request);
  }

  return next(request.clone({
    setHeaders: {
      Authorization: `Bearer ${token}`,
    },
  }));
};
