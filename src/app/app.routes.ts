import { Routes } from '@angular/router';
import { Login } from './components/login/login';
import { Menu } from './components/menu/menu';
import { Cargo } from './components/cargo/cargo';
import { Empleado } from './components/empleado/empleado';
import { Rol } from './components/rol/rol';
import { RolePrivilegio } from './components/role-privilegio/role-privilegio';
import { Aprobaciones } from './components/aprobaciones/aprobaciones';
import { Asistencia } from './components/asistencia/asistencia';
import { Inasistencia } from './components/inasistencia/inasistencia';
import { Horario } from './components/horario/horario';
import { Feriado } from './components/feriado/feriado';
import { authGuard, campoGuard, publicGuard } from './guards/auth.guard';

export const routes: Routes = [
  { path: 'login', component: Login, canActivate: [publicGuard] },
  { path: 'menu', component: Menu, canActivate: [authGuard] },
  { path: 'cargos', component: Cargo, canActivate: [authGuard, () => campoGuard('Cargos')] },
  { path: 'empleados', component: Empleado, canActivate: [authGuard, () => campoGuard('Empleados')] },
  { path: 'roles', component: Rol, canActivate: [authGuard, () => campoGuard('Roles')] },
  { path: 'role-privilegios', component: RolePrivilegio, canActivate: [authGuard, () => campoGuard('Privilegios')] },
  { path: 'asistencias', component: Asistencia, canActivate: [authGuard, () => campoGuard('Asistencias')] },
  { path: 'aprobaciones', component: Aprobaciones, canActivate: [authGuard, () => campoGuard('Asistencias')] },
  { path: 'inasistencias', component: Inasistencia, canActivate: [authGuard, () => campoGuard('Inasistencias')] },
  { path: 'horarios', component: Horario, canActivate: [authGuard, () => campoGuard('Horarios')] },
  { path: 'feriados', component: Feriado, canActivate: [authGuard, () => campoGuard('Feriados')] },
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  { path: '**', redirectTo: '/login' }
];
