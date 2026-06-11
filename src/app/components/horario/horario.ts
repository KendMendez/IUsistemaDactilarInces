import { Component, OnInit, ChangeDetectorRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormGroup, FormControl, Validators } from '@angular/forms';
import { finalize } from 'rxjs/operators';
import { HorarioService } from '../../services/horario';
import { EmpleadoService } from '../../services/empleado';
import { MessageHelper } from '../../helpers/message';

const DIAS = ['lunes','martes','miércoles','jueves','viernes','sábado','domingo'];

@Component({
  selector: 'app-horario',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './horario.html',
  styles: ``,
})
export class Horario implements OnInit {
  list: any[] = [];
  empleados: any[] = [];
  dias = DIAS;
  loading = false;
  saving = false;
  submitError = '';
  showForm = false;
  editId: string | null = null;

  selectedDias: Record<string, boolean> = {};

  form = new FormGroup({
    id_empleado: new FormControl('', Validators.required),
    hora_entrada: new FormControl(''),
    hora_salida: new FormControl(''),
    hora_entrada_tolerada: new FormControl('', Validators.required),
    hora_salida_tolerada: new FormControl('', Validators.required),
  });

  private cdr = inject(ChangeDetectorRef);

  constructor(
    private service: HorarioService,
    private empleadoService: EmpleadoService,
    private msg: MessageHelper
  ) {}

  ngOnInit(): void {
    this.load();
  }

  load() {
    this.loading = true;
    this.service.index().pipe(finalize(() => {
      this.loading = false;
      this.cdr.detectChanges();
    })).subscribe({
      next: (res) => { this.list = res.results || res.data || []; },
      error: () => {
        this.submitError = this.msg.loadError('horarios');
        this.cdr.detectChanges();
      },
    });
  }

  openForm(item?: any) {
    this.showForm = true;
    this.editId = null;
    this.submitError = '';
    this.selectedDias = {};
    this.form.reset({ id_empleado: '', hora_entrada: '', hora_salida: '', hora_entrada_tolerada: '', hora_salida_tolerada: '' });
    Object.keys(this.form.controls).forEach(k => this.form.get(k)?.markAsUntouched());

    this.empleadoService.index().pipe(finalize(() => this.cdr.detectChanges())).subscribe({
      next: (res) => {
        this.empleados = res.results || res.data || [];
      },
    });

    if (item) {
      this.editId = item.horarioId;
      this.form.patchValue({
        id_empleado: item.id_empleado || '',
        hora_entrada: item.hora_entrada || '',
        hora_salida: item.hora_salida || '',
        hora_entrada_tolerada: item.hora_entrada_tolerada || '',
        hora_salida_tolerada: item.hora_salida_tolerada || '',
      });
      if (Array.isArray(item.dia)) {
        item.dia.forEach((d: string) => this.selectedDias[d] = true);
      }
    }
  }

  back() {
    this.showForm = false;
    this.editId = null;
    this.form.reset();
    this.submitError = '';
  }

  toggleDia(dia: string) {
    this.selectedDias[dia] = !this.selectedDias[dia];
  }

  get diaArray(): string[] {
    return Object.keys(this.selectedDias).filter(d => this.selectedDias[d]);
  }

  get diaValido(): boolean {
    return this.diaArray.length > 0;
  }

  onSubmit() {
    Object.keys(this.form.controls).forEach(k => this.form.get(k)?.markAsTouched());
    if (this.form.invalid || !this.diaValido || this.saving) return;
    this.saving = true;
    this.submitError = '';
    const data = { ...this.form.value, dia: this.diaArray };
    const req = this.editId ? this.service.update(this.editId, data) : this.service.store(data);
    req.pipe(finalize(() => { this.saving = false; this.cdr.detectChanges(); })).subscribe({
      next: (res: any) => {
        if (res?.error) { this.submitError = res.msg || res.message || this.msg.serverError(); return; }
        this.back(); this.load();
      },
      error: (err: any) => {
        const body = err.error;
        this.submitError = body?.msg || body?.message || body?.error || err.message || this.msg.saveError();
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
          console.error('[Horario] delete error', err);
          this.submitError = this.msg.deleteError('horario');
          this.cdr.detectChanges();
        }
      },
    });
  }

  mostrarDias(item: any): string {
    return Array.isArray(item.dia) ? item.dia.join(', ') : item.dia || '';
  }

  getEmpleadoNombre(item: any): string {
    if (item.empleado) return `${item.empleado.nombre} ${item.empleado.apellido}`;
    return item.id_empleado || '';
  }

  trackById(_i: number, item: any): string {
    return item.horarioId;
  }
}
