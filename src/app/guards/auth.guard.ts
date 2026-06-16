import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { Auth } from '../services/auth';
import { map } from 'rxjs/operators';

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
  const authService = inject(Auth);
  const router = inject(Router);

  const campos = authService.getCampos();
  if (campos.length > 0) {
    return campos.includes(requiredCampo) ? true : router.parseUrl('/menu');
  }

  return authService.fetchMyPrivileges().pipe(
    map((res: any) => {
      if (res.campos?.includes(requiredCampo)) return true;
      return router.parseUrl('/menu');
    })
  );
};
