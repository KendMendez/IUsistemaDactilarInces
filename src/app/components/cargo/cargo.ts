import { Component, OnInit, ChangeDetectorRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormGroup, FormControl, Validators } from '@angular/forms';
import { finalize } from 'rxjs/operators';
import { CargoService } from '../../services/cargo';

@Component({
  selector: 'app-cargo',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './cargo.html',
  styles: ``,
})
export class Cargo implements OnInit {
  list: any[] = [];
  loading = false;
  saving = false;
  submitError = '';
  showForm = false;
  editId: string | null = null;

  form = new FormGroup({
    cargo: new FormControl('', Validators.required),
  });
  private cdr = inject(ChangeDetectorRef);


  constructor(private service: CargoService) {}

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
        this.list = res.results || res.data || [];
      },
      error: (err) => {
        console.error('[Cargo] load error', err);
        this.submitError = 'Error al cargar los cargos';
        this.cdr.detectChanges();
      },
    });
  }

  openForm(item?: any) {
    this.showForm = true;
    this.editId = null;
    this.submitError = '';
    this.form.reset({ cargo: '' });
    Object.keys(this.form.controls).forEach(k => this.form.get(k)?.markAsUntouched());

    if (item) {
      this.editId = item.id_cargo ?? item.id ?? item.cargoId;
      this.form.patchValue({ cargo: item.cargo });
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

    const data = { cargo: this.form.value.cargo };
    const req = this.editId
      ? this.service.update(this.editId, data)
      : this.service.store(data);

    req.pipe(finalize(() => (this.saving = false))).subscribe({
      next: (res: any) => {
        if (res?.error) {
          this.submitError = res.msg || res.message || res.mensaje || 'Error del servidor';
          return;
        }
        this.back();
        this.load();
      },
      error: (err: any) => {
        const body = err.error;
        this.submitError = body?.msg || body?.message || body?.mensaje || body?.error || err.message || 'Error al guardar';
      },
    });
  }

  delete(id: string) {
    if (!confirm('¿Eliminar este cargo?')) return;
    this.service.delete(id).subscribe({
      next: () => this.load(),
      error: (err) => {
        console.error('[Cargo] delete error', err);
        this.submitError = 'Error al eliminar el cargo';
      },
    });
  }

  trackById(_i: number, item: any): string {
    return item.id_cargo ?? item.id ?? item.cargoId;
  }
}
