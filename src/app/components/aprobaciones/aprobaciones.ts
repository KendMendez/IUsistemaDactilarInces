import { Component, OnInit, ChangeDetectorRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { finalize } from 'rxjs/operators';
import { AsistenciaService } from '../../services/asistencia';
import { MessageHelper } from '../../helpers/message';
import { Auth } from '../../services/auth';

@Component({
  selector: 'app-aprobaciones',
  imports: [CommonModule],
  templateUrl: './aprobaciones.html',
  styles: ``,
})
export class Aprobaciones implements OnInit {
  private cdr = inject(ChangeDetectorRef);
  public auth = inject(Auth);

  list: any[] = [];
  loading = false;
  processing = '';
  error = '';

  constructor(
    private service: AsistenciaService,
    private msg: MessageHelper
  ) {}

  ngOnInit(): void {
    if (!this.auth.hasPrivilege('aprobar asistencia')) return;
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
        this.error = this.msg.loadError('pendientes');
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
          this.error = res.msg || this.msg.approveError();
          return;
        }
        this.load();
      },
      error: () => {
        this.error = this.msg.approveError();
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
          this.error = res.msg || this.msg.rejectError();
          return;
        }
        this.load();
      },
      error: () => {
        this.error = this.msg.rejectError();
      },
    });
  }
}
