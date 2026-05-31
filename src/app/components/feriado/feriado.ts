import { Component, OnInit, ChangeDetectorRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { finalize } from 'rxjs/operators';
import { FeriadoService } from '../../services/feriado';

@Component({
  selector: 'app-feriado',
  imports: [CommonModule],
  templateUrl: './feriado.html',
  styles: ``,
})
export class Feriado implements OnInit {
  list: any[] = [];
  loading = false;
  error = '';

  private cdr = inject(ChangeDetectorRef);

  constructor(private service: FeriadoService) {}

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
        console.error('[Feriado] load error', err);
        this.error = 'Error al cargar feriados';
        this.cdr.detectChanges();
      },
    });
  }

  delete(id: string) {
    if (!confirm('¿Eliminar este feriado?')) return;
    this.service.delete(id).subscribe({
      next: () => this.load(),
      error: (err) => {
        console.error('[Feriado] delete error', err);
        this.error = 'Error al eliminar feriado';
      },
    });
  }
}
