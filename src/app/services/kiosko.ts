import { Injectable, NgZone } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, firstValueFrom } from 'rxjs';
import { URL_API } from '../config/constants';

interface TemplateEntry {
  id_empleado: string;
  nombre: string;
  huella_pulgar: string;
  huella_indice: string;
}

interface KioskoStatus {
  visible: boolean;
  message: string;
  type: 'info' | 'success' | 'error';
  nombre?: string;
}

@Injectable({ providedIn: 'root' })
export class KioskoService {
  private apiUrl = `${URL_API}/kiosko`;
  private templates: TemplateEntry[] = [];
  private api: any = null;
  private listening = false;

  private statusSubj = new BehaviorSubject<KioskoStatus>({ visible: false, message: '', type: 'info' });
  status$ = this.statusSubj.asObservable();

  constructor(
    private http: HttpClient,
    private ngZone: NgZone
  ) {}

  private get F(): any {
    return (window as any).Fingerprint;
  }

  async init(): Promise<void> {
    try {
      this.templates = await firstValueFrom(
        this.http.get<{ results: TemplateEntry[] }>(`${this.apiUrl}/templates`)
      ).then(r => r.results || []);
    } catch {
      this.templates = [];
    }

    this.startListening();
  }

  private startListening(): void {
    if (this.listening || !this.F) return;

    try {
      this.api = new this.F.WebApi();
      this.api.onSamplesAcquired = (e: any) => this.ngZone.run(() => this.onSample(e));
      this.api.onErrorOccurred = () => {};
      this.api.onCommunicationFailed = () => {};
      this.api.enumerateDevices().then((devices: string[]) => {
        const uid = devices?.length ? devices[0] : undefined;
        return this.api.startAcquisition(this.F.SampleFormat.PngImage, uid);
      }).catch(() => {});
      this.listening = true;
    } catch {
      this.listening = false;
    }
  }

  private onSample(e: any): void {
    try {
      const samples = JSON.parse(e.samples);
      if (!samples?.length) return;

      const template = this.F.b64UrlTo64(samples[0]);

      this.statusSubj.next({ visible: true, message: 'Verificando huella...', type: 'info' });

      const match = this.buscarCoincidencia(template);

      if (!match) {
        setTimeout(() => {
          this.statusSubj.next({ visible: false, message: '', type: 'info' });
        }, 3000);
        this.statusSubj.next({ visible: true, message: 'Huella no reconocida', type: 'error' });
        return;
      }

      this.registrarAsistencia(match.id_empleado, match.nombre);
    } catch {
      this.statusSubj.next({ visible: true, message: 'Error al procesar la huella', type: 'error' });
    }
  }

  private buscarCoincidencia(template: string): { id_empleado: string; nombre: string } | null {
    for (const entry of this.templates) {
      if (this.matchTemplates(template, entry.huella_pulgar) ||
          this.matchTemplates(template, entry.huella_indice)) {
        return { id_empleado: entry.id_empleado, nombre: entry.nombre };
      }
    }
    return null;
  }

  private matchTemplates(a: string, b: string | null): boolean {
    if (!b) return false;
    if (a === b) return true;

    if (this.F?.Matcher) {
      try {
        return this.F.Matcher.match(a, b);
      } catch {}
    }

    return a === b;
  }

  private registrarAsistencia(idEmpleado: string, nombre: string): void {
    this.http.post(`${this.apiUrl}/verificar`, { id_empleado: idEmpleado }).subscribe({
      next: (res: any) => {
        if (res?.error) {
          this.statusSubj.next({ visible: true, message: res.msg || 'Error al registrar', type: 'error' });
        } else {
          this.statusSubj.next({
            visible: true,
            message: `Bienvenido ${nombre}`,
            type: 'success',
            nombre,
          });
        }
        setTimeout(() => {
          this.statusSubj.next({ visible: false, message: '', type: 'info' });
        }, 4000);
      },
      error: () => {
        this.statusSubj.next({ visible: true, message: 'Error de conexión', type: 'error' });
        setTimeout(() => {
          this.statusSubj.next({ visible: false, message: '', type: 'info' });
        }, 3000);
      },
    });
  }

  dispose(): void {
    this.listening = false;
    try {
      this.api?.webChannel?.disconnect();
    } catch {}
    this.api = null;
  }
}
