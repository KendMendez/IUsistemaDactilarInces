import { Component, OnInit, ChangeDetectorRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { finalize } from 'rxjs/operators';
import { AsistenciaService } from '../../services/asistencia';

@Component({
  selector: 'app-aprobaciones',
  imports: [CommonModule],
  templateUrl: './aprobaciones.html',
  styles: ``,
})
export class Aprobaciones implements OnInit {
  private cdr = inject(ChangeDetectorRef);

  list: any[] = [];
  loading = false;
  processing = '';
  error = '';

  constructor(private service: AsistenciaService) {}

  ngOnInit(): void {
    this.load();
  }

  load() {
    this.loading = true;
    this.error = '';
    this.service.pending().pipe(finalize(() => {
      this.loading = false;
      this.cdr.detectChanges();
    })).subscribe({
      next: (res) => {
        this.list = res.results || [];
      },
      error: () => {
        this.error = 'Error al cargar pendientes';
      },
    });
  }

  approve(id: string) {
    this.processing = id;
    this.service.approve(id).pipe(finalize(() => {
      this.processing = '';
      this.cdr.detectChanges();
    })).subscribe({
      next: (res: any) => {
        if (res?.error) {
          this.error = res.msg || 'Error al aprobar';
          return;
        }
        this.load();
      },
      error: () => {
        this.error = 'Error al aprobar';
      },
    });
  }

  reject(id: string) {
    this.processing = id;
    this.service.reject(id).pipe(finalize(() => {
      this.processing = '';
      this.cdr.detectChanges();
    })).subscribe({
      next: (res: any) => {
        if (res?.error) {
          this.error = res.msg || 'Error al rechazar';
          return;
        }
        this.load();
      },
      error: () => {
        this.error = 'Error al rechazar';
      },
    });
  }
}
