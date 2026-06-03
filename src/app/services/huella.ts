import { Injectable, NgZone } from '@angular/core';
import { Observable, Subject, throwError } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class HuellaService {
  private api: any = null;
  private subject: Subject<string> | null = null;
  private captureTimer: any = null;
  private _disposed = false;

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

  destroyApi() {
    if (this.api) {
      try {
        this.api?.webChannel?.disconnect();
      } catch (e) {
        console.error('destroyApi disconnect error:', e);
      }
    }
    this.api = null;
  }

  private clearCapture() {
    if (this.captureTimer) {
      clearTimeout(this.captureTimer);
      this.captureTimer = null;
    }
    this.subject = null;
  }

  private onSamples(e: any) {
    try {
      try { this.api?.stopAcquisition(); } catch {}
      const samples = JSON.parse(e.samples);
      if (samples?.length) {
        const b64 = this.F.b64UrlTo64(samples[0]);
        this.subject?.next(b64);
        this.subject?.complete();
      }
    } catch (ex) {
      console.error('onSamplesAcquired parse error:', ex);
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
      if (!this.api) {
        this.initApi();
      }
    } catch (e: any) {
      return throwError(() => e?.message || 'SDK no disponible');
    }

    this.subject = new Subject<string>();

    this.captureTimer = setTimeout(() => {
      this.ngZone.run(() => {
        if (!this.subject) return;
        this.subject.error('Tiempo de espera agotado. Verifique el lector.');
        this.clearCapture();
        this.destroyApi();
      });
    }, 30000);

    this.api.startAcquisition(this.F.SampleFormat.PngImage, undefined)
      .then(() => {
        if (this.captureTimer) {
          clearTimeout(this.captureTimer);
          this.captureTimer = null;
        }
      })
      .catch((err: any) => {
        if (this.captureTimer) {
          clearTimeout(this.captureTimer);
          this.captureTimer = null;
        }
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

  cancelCapture() {
    if (this.api) {
      try { this.api.stopAcquisition(); } catch {}
    }
    this.clearCapture();
  }

  dispose() {
    this._disposed = true;
    this.subject?.complete();
    this.clearCapture();
    this.destroyApi();
  }
}
