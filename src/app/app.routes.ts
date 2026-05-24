import { Routes } from '@angular/router';
import { Menu } from './components/menu/menu';
import { authGuard } from './guards/auth.guard';

export const routes: Routes = [
  { path: '', redirectTo: 'menu', pathMatch: 'full' },
  { path: 'menu', component: Menu, canActivate: [authGuard] },
];
