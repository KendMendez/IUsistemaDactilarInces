import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { URL_API } from '../config/constants';

@Injectable({ providedIn: 'root' })
export class AsistenciaService {
  private apiUrl = `${URL_API}/asistencia`;

  constructor(private http: HttpClient) {}

  index(): Observable<any> {
    return this.http.get(`${this.apiUrl}/index`);
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

  pending(): Observable<any> {
    return this.http.get(`${this.apiUrl}/pending`);
  }

  approve(id: string): Observable<any> {
    return this.http.put(`${this.apiUrl}/${id}/approve`, {});
  }

  reject(id: string): Observable<any> {
    return this.http.put(`${this.apiUrl}/${id}/reject`, {});
  }
}
