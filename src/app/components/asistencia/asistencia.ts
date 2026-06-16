import { Component, OnInit, ChangeDetectorRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { finalize } from 'rxjs/operators';
import { AsistenciaService } from '../../services/asistencia';
import { MessageHelper } from '../../helpers/message';
import { Auth } from '../../services/auth';

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
  public auth = inject(Auth);

  constructor(
    private service: AsistenciaService,
    private msg: MessageHelper
  ) {}

  ngOnInit(): void {
    if (!this.auth.hasPrivilege('ver asistencias')) return;
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
        this.error = this.msg.loadError('asistencias');
        this.cdr.detectChanges();
      },
    });
  }

  trackById(index: number, item: any): string {
    return item.asistenciaId || index.toString();
  }

  eliminar(id: string, force = false) {
    this.service.delete(id, force).subscribe({
      next: () => this.load(),
      error: (err) => {
        const body = err.error;
        if (body?.requires_confirmation && confirm(body.msg)) {
          this.eliminar(id, true);
        } else {
          console.error('[Asistencia] delete error', err);
          this.error = this.msg.deleteError('asistencia');
        }
      },
    });
  }
}
