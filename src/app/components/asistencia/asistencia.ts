import { Component, OnInit, ChangeDetectorRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { finalize } from 'rxjs/operators';
import { AsistenciaService } from '../../services/asistencia';

@Component({
  selector: 'app-asistencia',
  imports: [CommonModule],
  templateUrl: './asistencia.html',
  styles: ``,
})
export class Asistencia implements OnInit {
  list: any[] = [];
  loading = false;
  error = '';

  private cdr = inject(ChangeDetectorRef);

  constructor(private service: AsistenciaService) {}

  ngOnInit(): void {
    this.load();
  }

  load() {
    this.loading = true;
    this.service.index().pipe(finalize(() => {
      this.loading = false;
      this.cdr.detectChanges();
    })).subscribe({
      next: (res) => {
        this.list = res.results || [];
      },
      error: (err) => {
        console.error('[Asistencia] load error', err);
        this.error = 'Error al cargar asistencias';
        this.cdr.detectChanges();
      },
    });
  }

  delete(id: string) {
    if (!confirm('¿Eliminar esta asistencia?')) return;
    this.service.delete(id).subscribe({
      next: () => this.load(),
      error: (err) => {
        console.error('[Asistencia] delete error', err);
        this.error = 'Error al eliminar asistencia';
      },
    });
  }
}
