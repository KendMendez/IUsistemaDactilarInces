import { Injectable, NgZone } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject } from 'rxjs';
import { KIOSKO_API_KEY, URL_API } from '../config/constants';

interface KioskoStatus {
  visible: boolean;
  message: string;
  type: 'info' | 'success' | 'error';
  nombre?: string;
}

@Injectable({ providedIn: 'root' })
export class KioskoService {
  private apiUrl = `${URL_API}/kiosko`;
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

      const png = this.F.b64UrlTo64(samples[0]);

      this.statusSubj.next({ visible: true, message: 'Verificando huella...', type: 'info' });

      this.http.post(`${this.apiUrl}/match`, { huella: png }, {
        headers: { 'X-Kiosko-Key': KIOSKO_API_KEY }
      }).subscribe({
        next: (res: any) => {
          if (res?.match && res.id_empleado) {
            this.registrarAsistencia(res.id_empleado, res.nombre);
          } else {
            this.statusSubj.next({ visible: true, message: 'Huella no reconocida', type: 'error' });
            setTimeout(() => {
              this.statusSubj.next({ visible: false, message: '', type: 'info' });
            }, 3000);
          }
        },
        error: () => {
          this.statusSubj.next({ visible: true, message: 'Error de conexión', type: 'error' });
          setTimeout(() => {
            this.statusSubj.next({ visible: false, message: '', type: 'info' });
          }, 3000);
        },
      });
    } catch (ex: any) {
      console.error('[Kiosko] onSample error:', ex?.message || ex);
    }
  }

  private registrarAsistencia(idEmpleado: string, nombre: string): void {
    this.http.post(`${this.apiUrl}/verificar`, { id_empleado: idEmpleado }, {
      headers: { 'X-Kiosko-Key': KIOSKO_API_KEY }
    }).subscribe({
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

  pause(): void {
    this.listening = false;
    try {
      this.api?.webChannel?.disconnect();
    } catch {}
    try {
      this.api?.stopAcquisition();
    } catch {}
    this.api = null;
  }

  resume(): void {
    if (this.listening) return;
    this.startListening();
  }
}
