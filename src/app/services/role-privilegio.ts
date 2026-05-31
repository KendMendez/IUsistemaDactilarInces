import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { URL_API } from '../config/constants';

@Injectable({ providedIn: 'root' })
export class RolePrivilegioService {
  private apiUrl = `${URL_API}/role-privilegio`;

  constructor(private http: HttpClient) {}

  showByRoleId(roleId: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/showByRoleId/${roleId}`);
  }

  store(data: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/store`, data);
  }
}
