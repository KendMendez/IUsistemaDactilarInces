import { Component, OnInit, ChangeDetectorRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { finalize } from 'rxjs/operators';
import { InasistenciaService } from '../../services/inasistencia';

@Component({
  selector: 'app-inasistencia',
  imports: [CommonModule],
  templateUrl: './inasistencia.html',
  styles: ``,
})
export class Inasistencia implements OnInit {
  list: any[] = [];
  loading = false;
  error = '';

  private cdr = inject(ChangeDetectorRef);

  constructor(private service: InasistenciaService) {}

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
        console.error('[Inasistencia] load error', err);
        this.error = 'Error al cargar inasistencias';
        this.cdr.detectChanges();
      },
    });
  }

  eliminar(id: string, force = false) {
    this.service.delete(id, force).subscribe({
      next: () => this.load(),
      error: (err) => {
        const body = err.error;
        if (body?.requires_confirmation && confirm(body.msg)) {
          this.eliminar(id, true);
        } else {
          console.error('[Inasistencia] delete error', err);
          this.error = 'Error al eliminar inasistencia';
        }
      },
    });
  }
}
