import { Injectable, NgZone } from '@angular/core';
import { Observable, Subject, throwError } from 'rxjs';

const LOG = '[Huella]';

@Injectable({ providedIn: 'root' })
export class HuellaService {
  private api: any = null;
  private subject: Subject<string> | null = null;
  private captureTimer: any = null;
  private _disposed = false;

  constructor(private ngZone: NgZone) {
    console.debug(LOG, 'service constructed', new Date().toISOString());
  }

  private get F(): any {
    return (window as any).Fingerprint;
  }

  private initApi() {
    console.debug(LOG, 'initApi — creating new Fingerprint.WebApi');
    this.api = new this.F.WebApi();
    this.api.onSamplesAcquired    = (e: any) => this.ngZone.run(() => this.onSamples(e));
    this.api.onErrorOccurred      = (e: any) => this.ngZone.run(() => this.onError(e));
    this.api.onCommunicationFailed = ()      => this.ngZone.run(() => this.onCommFail());
    console.debug(LOG, 'initApi — event handlers attached');
  }

  destroyApi() {
    console.debug(LOG, 'destroyApi — entering, api is', this.api ? 'set' : 'null');
    if (this.api) {
      console.debug(LOG, 'destroyApi — disconnecting webChannel');
      try {
        this.api?.webChannel?.disconnect();
        console.debug(LOG, 'destroyApi — disconnect completed');
        if (this.api?.webChannel?.ws) {
          console.debug(LOG, 'destroyApi — ws state:', this.api.webChannel.ws.readyState);
        }
      } catch (e) {
        console.error(LOG, 'destroyApi — disconnect error:', e);
      }
    }
    this.api = null;
    console.debug(LOG, 'destroyApi — exiting, api set to null');
  }

  private clearCapture() {
    if (this.captureTimer) {
      console.debug(LOG, 'clearCapture — clearing timeout');
      clearTimeout(this.captureTimer);
      this.captureTimer = null;
    }
    this.subject = null;
  }

  private onSamples(e: any) {
    console.debug(LOG, 'onSamplesAcquired — samples received:', e?.samples?.length || 0, 'bytes');
    try {
      const samples = JSON.parse(e.samples);
      if (samples?.length) {
        const b64 = this.F.b64UrlTo64(samples[0]);
        console.debug(LOG, 'onSamplesAcquired — decoded base64, length:', b64?.length);
        this.subject?.next(b64);
        this.subject?.complete();
      } else {
        console.warn(LOG, 'onSamplesAcquired — no samples in array');
      }
    } catch (ex) {
      console.error(LOG, 'onSamplesAcquired — parse error:', ex);
      this.subject?.error('Error al procesar muestra');
    }
    this.clearCapture();
  }

  private onError(e: any) {
    console.error(LOG, 'onErrorOccurred:', e?.error);
    this.subject?.error(`Error del lector: ${e.error}`);
    this.clearCapture();
  }

  private onCommFail() {
    console.error(LOG, 'onCommunicationFailed — entered, killing connection');
    this.subject?.error(
      'No se pudo conectar. Verifique que HID Agent esté instalado y ejecutándose.'
    );
    this.clearCapture();
    this.destroyApi();
    console.error(LOG, 'onCommunicationFailed — exit');
  }

  capture(): Observable<string> {
    const ts = new Date().toISOString();
    console.debug(LOG, 'capture — entered at', ts, '| api null?', !this.api);
    if (this.subject) {
      console.warn(LOG, 'capture — already in progress, rejecting');
      return throwError(() => 'Ya hay una captura en curso');
    }

    try {
      if (!this.api) {
        console.debug(LOG, 'capture — calling initApi');
        this.initApi();
      }
    } catch (e: any) {
      console.error(LOG, 'capture — initApi threw:', e);
      return throwError(() => e?.message || 'SDK no disponible');
    }

    this.subject = new Subject<string>();

    this.captureTimer = setTimeout(() => {
      this.ngZone.run(() => {
        console.error(LOG, 'capture — 30s timeout fired');
        if (!this.subject) return;
        this.subject.error('Tiempo de espera agotado. Verifique el lector.');
        this.clearCapture();
        this.destroyApi();
      });
    }, 30000);
    console.debug(LOG, 'capture — 30s timeout set');

    console.debug(LOG, 'capture — calling startAcquisition with uid=undefined (zero GUID)');
    this.api.startAcquisition(this.F.SampleFormat.PngImage, undefined)
      .then(() => {
        console.debug(LOG, 'capture — startAcquisition resolved, acquiring...');
        if (this.captureTimer) {
          clearTimeout(this.captureTimer);
          this.captureTimer = null;
          console.debug(LOG, 'capture — 30s timeout cleared after acquisition start');
        }
      })
      .catch((err: any) => {
        const hexCode = err?.message?.match(/[0-9a-fA-F]{8}/)?.[0];
        console.error(LOG, 'capture — startAcquisition failed:', err?.message || err, 'hex:', hexCode);
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

  dispose() {
    console.debug(LOG, 'dispose — called');
    this._disposed = true;
    this.subject?.complete();
    this.clearCapture();
    this.destroyApi();
    console.debug(LOG, 'dispose — complete');
  }
}
