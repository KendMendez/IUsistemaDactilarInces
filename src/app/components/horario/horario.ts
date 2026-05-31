import { Component, OnInit, ChangeDetectorRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormGroup, FormControl, Validators } from '@angular/forms';
import { finalize } from 'rxjs/operators';
import { HorarioService } from '../../services/horario';

@Component({
  selector: 'app-horario',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './horario.html',
  styles: ``,
})
export class Horario implements OnInit {
  list: any[] = [];
  loading = false;
  saving = false;
  submitError = '';
  showForm = false;
  editId: string | null = null;

  form = new FormGroup({
    hora_entrada: new FormControl('', Validators.required),
    hora_salida: new FormControl('', Validators.required),
    descripcion: new FormControl(''),
  });

  private cdr = inject(ChangeDetectorRef);

  constructor(private service: HorarioService) {}

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
      error: (err) => {
        console.error('[Horario] load error', err);
        this.submitError = 'Error al cargar horarios';
        this.cdr.detectChanges();
      },
    });
  }

  openForm(item?: any) {
    this.showForm = true;
    this.editId = null;
    this.submitError = '';
    this.form.reset({ hora_entrada: '', hora_salida: '', descripcion: '' });
    Object.keys(this.form.controls).forEach(k => this.form.get(k)?.markAsUntouched());
    if (item) {
      this.editId = item.id_horario ?? item.id ?? item.horarioId;
      this.form.patchValue({
        hora_entrada: item.hora_entrada,
        hora_salida: item.hora_salida,
        descripcion: item.descripcion || '',
      });
    }
  }

  back() {
    this.showForm = false;
    this.editId = null;
    this.form.reset();
    this.submitError = '';
  }

  onSubmit() {
    Object.keys(this.form.controls).forEach(k => this.form.get(k)?.markAsTouched());
    if (this.form.invalid || this.saving) return;
    this.saving = true;
    this.submitError = '';
    const data = this.form.value;
    const req = this.editId ? this.service.update(this.editId, data) : this.service.store(data);
    req.pipe(finalize(() => (this.saving = false))).subscribe({
      next: (res: any) => {
        if (res?.error) { this.submitError = res.msg || res.message || 'Error del servidor'; return; }
        this.back(); this.load();
      },
      error: (err: any) => {
        const body = err.error;
        this.submitError = body?.msg || body?.message || body?.error || err.message || 'Error al guardar';
      },
    });
  }

  delete(id: string) {
    if (!confirm('¿Eliminar este horario?')) return;
    this.service.delete(id).subscribe({
      next: () => this.load(),
      error: (err) => {
        console.error('[Horario] delete error', err);
        this.submitError = 'Error al eliminar horario';
        this.cdr.detectChanges();
      },
    });
  }

  trackById(_i: number, item: any): string {
    return item.id_horario ?? item.id ?? item.horarioId;
  }
}
