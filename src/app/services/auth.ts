import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { Router } from '@angular/router';
import { URL_API } from '../config/constants';

@Injectable({
  providedIn: 'root',
})
export class Auth {
  private apiUrl = `${URL_API}/auth`;
  private privilegios: string[] = [];
  private campos: string[] = [];

  constructor(private http: HttpClient, private router: Router) {}

  login(credentials: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/login`, credentials).pipe(
      tap((response: any) => {
        if (response.results?.token) {
          localStorage.setItem('auth_token', response.results.token);
        }
        if (response.results?.empleado) {
          const empleado = response.results.empleado;
          localStorage.setItem('empleado', JSON.stringify(empleado));
          if (empleado.empleadoId) {
            localStorage.setItem('empleadoId', empleado.empleadoId);
          }
        }
      })
    );
  }

  isLoggedIn(): boolean {
    return !!localStorage.getItem('auth_token');
  }

  fetchMyPrivileges(): Observable<any> {
    return this.http.get(`${this.apiUrl}/me`).pipe(
      tap((res: any) => {
        this.privilegios = res.privilegios || [];
        this.campos = res.campos || [];
        localStorage.setItem('privilegios', JSON.stringify(this.privilegios));
        localStorage.setItem('campos', JSON.stringify(this.campos));
      })
    );
  }

  hasPrivilege(privilegio: string): boolean {
    return this.privilegios.includes(privilegio);
  }

  hasCampo(campo: string): boolean {
    return this.campos.includes(campo);
  }

  getPrivilegios(): string[] {
    return this.privilegios;
  }

  getCampos(): string[] {
    return this.campos;
  }

  logout() {
    this.http.post(`${this.apiUrl}/logout`, {}).subscribe({
      error: () => {},
    });
    localStorage.removeItem('auth_token');
    localStorage.removeItem('empleadoId');
    localStorage.removeItem('empleado');
    localStorage.removeItem('privilegios');
    localStorage.removeItem('campos');
    this.privilegios = [];
    this.campos = [];
    this.router.navigate(['/login']);
  }

  getToken(): string | null {
    return localStorage.getItem('auth_token');
  }

  getEmpleadoId(): string | null {
    return localStorage.getItem('empleadoId');
  }

  getEmpleado(): any {
    const data = localStorage.getItem('empleado');
    return data ? JSON.parse(data) : null;
  }
}
