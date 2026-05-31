import { Component, inject } from '@angular/core';
import { Router, RouterOutlet, RouterLink, RouterLinkActive, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { Auth } from './services/auth';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  protected auth = inject(Auth);
  protected router = inject(Router);
  isLoggedIn = false;
  pageTitle = 'Dashboard';
  userName = '';
  userRol = '';
  fechaActual = '';

  menuItems = [
    { path: '/menu', label: 'Dashboard' },
    { path: '/empleados', label: 'Empleados' },
    { path: '/cargos', label: 'Cargos' },
    { path: '/roles', label: 'Roles' },
    { path: '/asistencias', label: 'Asistencias' },
    { path: '/inasistencias', label: 'Inasistencias' },
    { path: '/horarios', label: 'Horarios' },
    { path: '/feriados', label: 'Feriados' },
  ];

  private titles: Record<string, string> = {
    '/menu': 'Dashboard',
    '/empleados': 'Gestión de Empleados',
    '/cargos': 'Gestión de Cargos',
    '/roles': 'Gestión de Roles',
    '/asistencias': 'Registro de Asistencias',
    '/inasistencias': 'Registro de Inasistencias',
    '/horarios': 'Gestión de Horarios',
    '/feriados': 'Gestión de Feriados',
  };

  ngOnInit(): void {
    this.isLoggedIn = this.auth.isLoggedIn();

    if (this.isLoggedIn) {
      const empleado = this.auth.getEmpleado();
      this.userName = empleado?.nombre || 'Usuario';
      this.fechaActual = new Date().toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    }

    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe(() => {
      this.isLoggedIn = this.auth.isLoggedIn();
      this.updatePageTitle();

      if (this.isLoggedIn) {
        const empleado = this.auth.getEmpleado();
        this.userName = empleado?.nombre || 'Usuario';
      }
    });
  }

  private updatePageTitle() {
    this.pageTitle = this.titles[this.router.url] || 'Dashboard';
  }

  logout() {
    this.auth.logout();
  }
}
