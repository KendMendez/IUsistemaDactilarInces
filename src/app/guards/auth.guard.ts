import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { Auth } from '../services/auth';

export const authGuard = () => {
  const authService = inject(Auth);
  const router = inject(Router);

  if (authService.isLoggedIn()) {
    return true;
  }

  router.navigate(['/login']);
  return false;
};

export const publicGuard = () => {
  const authService = inject(Auth);
  const router = inject(Router);

  if (authService.isLoggedIn()) {
    router.navigate(['/menu']);
    return false;
  }

  return true;
};

export const campoGuard = (requiredCampo: string) => {
  const router = inject(Router);
  const campos: string[] = JSON.parse(localStorage.getItem('campos') || '[]');
  return campos.includes(requiredCampo) ? true : router.parseUrl('/menu');
};
