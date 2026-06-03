import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { URL_API } from '../config/constants';

@Injectable({ providedIn: 'root' })
export class EmpleadoService {
  private apiUrl = `${URL_API}/empleado`;

  constructor(private http: HttpClient) {}

  index(): Observable<any> {
    return this.http.get(`${this.apiUrl}/index`);
  }

  search(identificacion: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/search/${identificacion}`);
  }

  store(data: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/store`, data);
  }

  update(id: string, data: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/update/${id}`, data);
  }

  delete(id: string, force = false): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}/delete${force ? '?force=1' : ''}`);
  }
}
