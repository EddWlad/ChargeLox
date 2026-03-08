import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';

export const authTokenInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const token = authService.accessToken();

  const shouldAttachToken = token && req.url.includes('/api/');

  const request = shouldAttachToken
    ? req.clone({
        setHeaders: {
          Authorization: `Bearer ${token}`,
        },
      })
    : req;

  return next(request).pipe(
    catchError((error) => {
      if (error?.status === 401 && authService.isAuthenticated()) {
        authService.clearSession(false);
      }
      return throwError(() => error);
    }),
  );
};
