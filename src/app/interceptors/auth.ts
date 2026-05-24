import { HttpInterceptorFn, HttpErrorResponse, HttpEvent, HttpResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Token } from '../services/token';
import { catchError, tap, throwError } from 'rxjs';
import { Auth } from '../services/auth';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const tokenService = inject(Token);
  const authService = inject(Auth);
  const token = tokenService.getToken();
  
  if (token) {
    req = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
  }

  return next(req).pipe(
    tap((event: HttpEvent<any>) => {
      if (event instanceof HttpResponse) {
        const newToken = event.headers.get('Authorization');
        if (newToken) {
          tokenService.handleToken(newToken);
        }
      }
    }),
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401) {
        authService.logoutInClient();
      }
      return throwError(() => error);
    })
  );
};
