import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { Auth } from '../services/auth';
import { filter, map, take } from 'rxjs/operators';

export const authGuard: CanActivateFn = (route, state) => {
  const auth = inject(Auth);
  const router = inject(Router);

  return auth.isLoading.pipe(
    filter(isLoading => !isLoading),
    take(1),
    map(() => {
      if (auth.isLogedIn.value) {
        return true;
      }
      return router.createUrlTree(['/']);
    })
  );
};
