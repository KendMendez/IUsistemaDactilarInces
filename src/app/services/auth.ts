import { Injectable } from '@angular/core';
import { URL_API } from '../config/constants';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { Token } from './token';
import { tap } from 'rxjs/operators';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root',
})
export class Auth {
  isLogedIn = new BehaviorSubject<boolean>(false);
  user = new BehaviorSubject<any>(null);
  role = new BehaviorSubject<string>('');
  isLoading = new BehaviorSubject<boolean>(true);

  constructor(private http: HttpClient, private token: Token, private router: Router) { }

  checkToken(): boolean {
    return !!localStorage.getItem('token');
  }

  isAuthenticated() {
    if (!this.checkToken()) {
      this.token.removeToken();
      this.isLogedIn.next(false);
      this.role.next('');
      this.user.next(null);
      this.isLoading.next(false);
      return;
    }
    this.http.get(`${URL_API}/me`).subscribe({
      next: (res: any) => {
        this.isLogedIn.next(true);
        this.role.next(res.role);
        this.user.next(res.user);
        this.isLoading.next(false);
      },
      error: (err) => {
        this.logoutInClient();
      }
    });
  }

  login(credentials: any): Observable<any> {
    return this.http.post(`${URL_API}/login`, credentials);
  }

  logout(): Observable<any> {
    return this.http.post(`${URL_API}/logout`, {})
      .pipe(
        tap(() => {
          this.logoutInClient();
        })
      );
  }

  logoutInClient() {
    this.token.removeToken();
    this.isLogedIn.next(false);
    this.role.next('');
    this.user.next(null);
    this.isLoading.next(false);
    this.router.navigate(['/']);
  }
}
