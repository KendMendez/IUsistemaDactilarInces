import { Injectable, NgZone } from '@angular/core';
import { Observable, Subject, throwError } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class HuellaService {
  private api: any = null;
  private subject: Subject<string> | null = null;
  private captureTimer: any = null;

  constructor(private ngZone: NgZone) {}

  private get F(): any {
    return (window as any).Fingerprint;
  }

  private initApi() {
    this.api = new this.F.WebApi();
    this.api.onSamplesAcquired    = (e: any) => this.ngZone.run(() => this.onSamples(e));
    this.api.onErrorOccurred      = (e: any) => this.ngZone.run(() => this.onError(e));
    this.api.onCommunicationFailed = ()      => this.ngZone.run(() => this.onCommFail());
  }

  private destroyApi() {
    try { this.api?.webChannel?.disconnect(); } catch {}
    this.api = null;
  }

  private clearCapture() {
    if (this.captureTimer) { clearTimeout(this.captureTimer); this.captureTimer = null; }
    this.subject = null;
  }

  private onSamples(e: any) {
    try {
      const samples = JSON.parse(e.samples);
      if (samples?.length) {
        this.subject?.next(this.F.b64UrlTo64(samples[0]));
        this.subject?.complete();
      }
    } catch {
      this.subject?.error('Error al procesar muestra');
    }
    this.clearCapture();
  }

  private onError(e: any) {
    this.subject?.error(`Error del lector: ${e.error}`);
    this.clearCapture();
  }

  private onCommFail() {
    this.subject?.error(
      'No se pudo conectar. Verifique que HID Agent esté instalado y ejecutándose.'
    );
    this.clearCapture();
    this.destroyApi();
  }

  capture(): Observable<string> {
    if (this.subject) {
      return throwError(() => 'Ya hay una captura en curso');
    }

    try {
      if (!this.api) this.initApi();
    } catch (e: any) {
      return throwError(() => e?.message || 'SDK no disponible');
    }

    this.subject = new Subject<string>();

    // timeout global de 30s para toda la captura
    this.captureTimer = setTimeout(() => {
      this.ngZone.run(() => {
        if (!this.subject) return;
        this.subject.error('Tiempo de espera agotado. Verifique el lector.');
        this.clearCapture();
        this.destroyApi();
      });
    }, 30000);

    // Plan B: enumerateDevices establece la conexión primero
    this.api.enumerateDevices()
      .then((devices: string[]) => {
        const uid = devices?.length ? devices[0] : undefined;
        // WebSocket listo, ahora sí iniciar captura
        return this.api.startAcquisition(this.F.SampleFormat.PngImage, uid);
      })
      .then(() => {
        // adquisición iniciada, timer sigue activo esperando muestra
        if (this.captureTimer) clearTimeout(this.captureTimer);
      })
      .catch((err: any) => {
        if (this.captureTimer) clearTimeout(this.captureTimer);
        this.ngZone.run(() => {
          this.subject?.error(
            err?.message?.includes('connect') || err?.message?.includes('acquire')
              ? `Error de conexión: ${err.message}`
              : `Error al iniciar: ${err?.message || err}`
          );
          this.clearCapture();
          this.destroyApi();
        });
      });

    return this.subject.asObservable();
  }

  dispose() {
    this.subject?.complete();
    this.clearCapture();
    this.destroyApi();
  }
}
