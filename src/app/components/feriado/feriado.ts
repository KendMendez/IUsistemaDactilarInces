import { Component, OnInit, ChangeDetectorRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormGroup, FormControl, Validators } from '@angular/forms';
import { finalize } from 'rxjs/operators';
import { FeriadoService } from '../../services/feriado';
import { MessageHelper } from '../../helpers/message';
import { Auth } from '../../services/auth';
import { FullCalendarModule } from '@fullcalendar/angular';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import { CalendarOptions } from '@fullcalendar/core';

@Component({
  selector: 'app-feriado',
  imports: [CommonModule, ReactiveFormsModule, FullCalendarModule],
  templateUrl: './feriado.html',
  styles: ``,
})
export class Feriado implements OnInit {
  list: any[] = [];
  feriadoEvents: any[] = [];
  loading = false;
  saving = false;
  submitError = '';
  showForm = false;
  editId: string | null = null;

  form = new FormGroup({
    fecha: new FormControl('', Validators.required),
    descripcion: new FormControl('', Validators.required),
  });

  calendarOptions: CalendarOptions = {
    plugins: [dayGridPlugin, interactionPlugin],
    initialView: 'dayGridMonth',
    locale: 'es',
    height: 'auto',
    headerToolbar: {
      left: 'prev,next today',
      center: 'title',
      right: '',
    },
    buttonText: { today: 'Hoy' },
    eventColor: '#EF4444',
    dateClick: (info) => this.onDateClick(info),
    eventClick: (info) => this.onEventClick(info),
  };

  private cdr = inject(ChangeDetectorRef);
  public auth = inject(Auth);

  constructor(
    private service: FeriadoService,
    private msg: MessageHelper
  ) {}

  ngOnInit(): void {
    if (!this.auth.hasPrivilege('ver feriados')) return;
    this.load();
  }

  load() {
    this.loading = true;
    this.service.index().pipe(finalize(() => {
      this.loading = false;
      this.cdr.detectChanges();
    })).subscribe({
      next: (res) => {
        this.list = res.results || res.data || [];
        this.feriadoEvents = this.mapToEvents();
      },
      error: () => {
        this.submitError = this.msg.loadError('feriados');
        this.cdr.detectChanges();
      },
    });
  }

  private mapToEvents(): any[] {
    return this.list.map(f => ({
      id: f.feriadoId,
      title: f.descripcion,
      start: f.fecha,
      allDay: true,
      extendedProps: { feriado: f },
    }));
  }

  onDateClick(info: any) {
    if (!this.auth.hasPrivilege('crear feriado')) return;
    this.openForm();
    this.form.patchValue({ fecha: info.dateStr });
    this.cdr.detectChanges();
  }

  onEventClick(info: any) {
    if (!this.auth.hasPrivilege('editar feriado')) return;
    const feriado = info.event.extendedProps?.feriado;
    if (feriado) this.openForm(feriado);
    this.cdr.detectChanges();
  }

  openForm(item?: any) {
    this.showForm = true;
    this.editId = null;
    this.submitError = '';
    this.form.reset({ fecha: '', descripcion: '' });
    Object.keys(this.form.controls).forEach(k => this.form.get(k)?.markAsUntouched());
    if (item) {
      this.editId = item.feriadoId;
      this.form.patchValue({
        fecha: item.fecha || '',
        descripcion: item.descripcion || '',
      });
    }
  }

  back() {
    this.showForm = false;
    this.editId = null;
    this.form.reset();
    this.submitError = '';
    this.load();
  }

  onSubmit() {
    Object.keys(this.form.controls).forEach(k => this.form.get(k)?.markAsTouched());
    if (this.form.invalid || this.saving) return;
    this.saving = true;
    this.submitError = '';
    const data = this.form.value;
    const req = this.editId ? this.service.update(this.editId, data) : this.service.store(data);
    req.pipe(finalize(() => { this.saving = false; this.cdr.detectChanges(); })).subscribe({
      next: (res: any) => {
        if (res?.error) { this.submitError = res.msg || res.message || this.msg.serverError(); return; }
        this.back();
      },
      error: (err: any) => {
        const body = err.error;
        this.submitError = body?.msg || body?.message || body?.error || err.message || this.msg.saveError();
      },
    });
  }

  eliminar(id: string, force = false) {
    this.service.delete(id, force).subscribe({
      next: () => this.back(),
      error: (err) => {
        const body = err.error;
        if (body?.requires_confirmation && confirm(body.msg)) {
          this.eliminar(id, true);
        } else {
          console.error('[Feriado] delete error', err);
          this.submitError = this.msg.deleteError('feriado');
          this.cdr.detectChanges();
        }
      },
    });
  }
}
