import { Component, inject } from '@angular/core';
import { Router, RouterOutlet, RouterLink, RouterLinkActive, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { Auth } from './services/auth';
import { KioskoService } from './services/kiosko';
import { KioskoOverlay } from './components/kiosko-overlay/kiosko-overlay';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, KioskoOverlay],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  protected auth = inject(Auth);
  protected router = inject(Router);
  protected kiosko = inject(KioskoService);
  isLoggedIn = false;
  pageTitle = 'Dashboard';
  userName = '';
  userRol = '';
  fechaActual = '';

  private allMenuItems = [
    { path: '/menu', label: 'Dashboard' },
    { path: '/empleados', label: 'Empleados' },
    { path: '/cargos', label: 'Cargos' },
    { path: '/roles', label: 'Roles' },
    { path: '/aprobaciones', label: 'Aprobaciones' },
    { path: '/asistencias', label: 'Asistencias' },
    { path: '/inasistencias', label: 'Inasistencias' },
    { path: '/horarios', label: 'Horarios' },
    { path: '/feriados', label: 'Feriados' },
  ];

  menuItems = [...this.allMenuItems];

  private menuCampoMap: Record<string, string> = {
    'Empleados': 'Empleados',
    'Cargos': 'Cargos',
    'Roles': 'Roles',
    'Aprobaciones': 'Asistencias',
    'Asistencias': 'Asistencias',
    'Inasistencias': 'Inasistencias',
    'Horarios': 'Horarios',
    'Feriados': 'Feriados',
  };

  private titles: Record<string, string> = {
    '/menu': 'Dashboard',
    '/empleados': 'Gestión de Empleados',
    '/cargos': 'Gestión de Cargos',
    '/roles': 'Gestión de Roles',
    '/aprobaciones': 'Aprobaciones Pendientes',
    '/asistencias': 'Registro de Asistencias',
    '/inasistencias': 'Registro de Inasistencias',
    '/horarios': 'Gestión de Horarios',
    '/feriados': 'Gestión de Feriados',
  };

  ngOnInit(): void {
    this.kiosko.init();

    this.isLoggedIn = this.auth.isLoggedIn();

    if (this.isLoggedIn) {
      const empleado = this.auth.getEmpleado();
      this.userName = empleado?.nombre || 'Usuario';
      this.fechaActual = new Date().toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
      this.loadPrivileges();
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

  private loadPrivileges() {
    const cachedPrivilegios = localStorage.getItem('privilegios');
    const cachedCampos = localStorage.getItem('campos');
    if (cachedPrivilegios && cachedCampos) {
      this.filterMenu(JSON.parse(cachedCampos));
    }
    this.auth.fetchMyPrivileges().subscribe({
      next: () => this.filterMenu(this.auth.getCampos()),
      error: () => {},
    });
  }

  private filterMenu(campos: string[]) {
    this.menuItems = this.allMenuItems.filter(item => {
      if (item.label === 'Dashboard') return true;
      const campo = this.menuCampoMap[item.label];
      return campo ? campos.includes(campo) : false;
    });
  }

  private updatePageTitle() {
    this.pageTitle = this.titles[this.router.url] || 'Dashboard';
  }

  logout() {
    this.auth.logout();
  }
}
