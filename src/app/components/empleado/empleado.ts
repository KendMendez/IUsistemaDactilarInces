import { Component, OnInit, OnDestroy, ChangeDetectorRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormGroup, FormControl, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { finalize } from 'rxjs/operators';
import { EmpleadoService } from '../../services/empleado';
import { CargoService } from '../../services/cargo';
import { RolService } from '../../services/rol';
import { HuellaService } from '../../services/huella';

function venezuelanPhoneValidator(control: AbstractControl): ValidationErrors | null {
  if (!control.value) return null;
  const cleaned = control.value.replace(/[\s\-\(\)]/g, '');
  const valid = /^0\d{10}$/.test(cleaned);
  return valid ? null : { phone: 'Debe ser un número venezolano válido (ej: 04121234567)' };
}

@Component({
  selector: 'app-empleado',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './empleado.html',
  styles: ``,
})
export class Empleado implements OnInit, OnDestroy {
  list: any[] = [];
  loading = false;
  saving = false;
  submitError = '';

  showForm = false;
  editId: string | null = null;

  cargos: any[] = [];
  roles: any[] = [];
  fotoPreview: string | null = null;
  fotoBase64 = '';

  showHuellaModal = false;
  pulgarStatus: 'pending' | 'capturing' | 'done' = 'pending';
  indiceStatus: 'pending' | 'capturing' | 'done' = 'pending';
  pulgarPreview: string | null = null;
  indicePreview: string | null = null;
  pulgarBase64 = '';
  indiceBase64 = '';
  huellaError = '';
  huellaMensaje = '';

  showPassword = false;

  form = new FormGroup({
    nombre: new FormControl('', Validators.required),
    apellido: new FormControl('', Validators.required),
    identificacion: new FormControl('', Validators.required),
    correo: new FormControl('', [Validators.required, Validators.email]),
    contraseña: new FormControl(''),
    telefono: new FormControl('', [Validators.required, venezuelanPhoneValidator]),
    sexo: new FormControl('M', Validators.required),
    id_cargo: new FormControl('', Validators.required),
    foto: new FormControl(''),
    roleId: new FormControl(''),
  });

  private cdr = inject(ChangeDetectorRef);

  constructor(
    private service: EmpleadoService,
    private cargoService: CargoService,
    private rolService: RolService,
    private huellaService: HuellaService
  ) {}

  ngOnInit(): void {
    this.load();
    this.loadCargos();
    this.loadRoles();
  }

  ngOnDestroy(): void {
    this.huellaService.dispose();
  }

  get selectedRole(): any {
    const id = this.form.value.roleId;
    if (!id) return null;
    return this.roles.find(r => r.rolId === id) || null;
  }

  load() {
    this.loading = true;
    this.service.index().pipe(finalize(() => {
      this.loading = false;
      this.cdr.detectChanges();
    })).subscribe({
      next: (res) => {
        const raw = res.results || res.data || res.empleados || [];
        this.list = (Array.isArray(raw) ? raw : []).map((e: any) => ({
          empleadoId: e.empleadoId || e.id,
          nombre: e.nombre,
          apellido: e.apellido,
          identificacion: e.identificacion,
          cargo: e.cargo,
          correo: e.correo,
          telefono: e.telefono,
          sexo: e.sexo,
          id_cargo: e.id_cargo,
          rolIds: e.rolIds,
        }));
      },
      error: (err) => {
        console.error('[Empleado] load error', err);
        this.submitError = 'Error al cargar empleados';
        this.cdr.detectChanges();
      },
    });
  }

  loadCargos() {
    this.cargoService.index().subscribe({
      next: (res) => { this.cargos = res.results || []; this.cdr.detectChanges(); },
      error: (err) => { console.error('[Empleado] loadCargos error', err); this.cdr.detectChanges(); },
    });
  }

  loadRoles() {
    this.rolService.index().subscribe({
      next: (res) => { this.roles = res.results || []; this.cdr.detectChanges(); },
      error: (err) => { console.error('[Empleado] loadRoles error', err); this.cdr.detectChanges(); },
    });
  }

  openForm(empleado?: any) {
    this.showForm = true;
    this.editId = empleado?.empleadoId || null;
    this.showPassword = false;
    this.submitError = '';

    this.form.reset({
      nombre: '',
      apellido: '',
      identificacion: '',
      correo: '',
      contraseña: '',
      telefono: '',
      sexo: 'M',
      id_cargo: '',
      foto: '',
      roleId: '',
    });
    this.fotoPreview = null;
    this.fotoBase64 = '';
    this.pulgarBase64 = '';
    this.indiceBase64 = '';

    if (!this.editId) {
      this.form.get('correo')?.setValidators([Validators.required, Validators.email]);
      this.form.get('correo')?.updateValueAndValidity();
      this.form.get('contraseña')?.setValidators([Validators.required]);
      this.form.get('contraseña')?.updateValueAndValidity();
    }

    Object.keys(this.form.controls).forEach(k => this.form.get(k)?.markAsUntouched());

    if (empleado) {
      this.form.patchValue({
        nombre: empleado.nombre,
        apellido: empleado.apellido,
        identificacion: empleado.identificacion,
        correo: empleado.correo || '',
        telefono: empleado.telefono || '',
        sexo: empleado.sexo,
        id_cargo: empleado.id_cargo,
      });
      if (empleado.foto) {
        this.fotoBase64 = empleado.foto;
        this.fotoPreview = 'data:image/png;base64,' + empleado.foto;
        this.form.patchValue({ foto: empleado.foto });
      }
      if (empleado.rolIds?.length > 0) {
        this.form.patchValue({ roleId: empleado.rolIds[0] });
        this.onRoleChange();
      }
    }
  }

  backToList() {
    this.showForm = false;
    this.editId = null;
    this.form.reset();
    this.fotoPreview = null;
    this.fotoBase64 = '';
    this.showPassword = false;
    this.submitError = '';
  }

  onRoleChange() {
    this.form.get('correo')?.setValidators([Validators.required, Validators.email]);
    if (!this.editId || this.showPassword) {
      this.form.get('contraseña')?.setValidators([Validators.required]);
    }
    this.form.get('correo')?.updateValueAndValidity();
    this.form.get('contraseña')?.updateValueAndValidity();
  }

  fieldInvalid(field: string): boolean {
    const ctrl = this.form.get(field);
    return !!(ctrl?.invalid && ctrl?.touched);
  }

  fieldError(field: string): string {
    const ctrl = this.form.get(field);
    if (!ctrl || !ctrl.errors || !ctrl.touched) return '';
    if (ctrl.errors['required']) return 'Campo requerido';
    if (ctrl.errors['email']) return 'Correo electrónico inválido';
    if (ctrl.errors['phone']) return ctrl.errors['phone'];
    return 'Campo inválido';
  }

  onFotoChange(event: any) {
    const file = event.target?.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      this.fotoPreview = dataUrl;
      this.fotoBase64 = dataUrl.split(',')[1] || '';
      this.form.patchValue({ foto: this.fotoBase64 });
    };
    reader.readAsDataURL(file);
  }

  togglePassword() {
    this.showPassword = !this.showPassword;
    if (!this.showPassword) {
      this.form.patchValue({ contraseña: '' });
      this.form.get('contraseña')?.clearValidators();
    } else {
      this.form.get('contraseña')?.setValidators([Validators.required]);
    }
    this.form.get('contraseña')?.updateValueAndValidity();
  }

  openHuellaModal() {
    this.showHuellaModal = true;
    this.pulgarStatus = this.pulgarBase64 ? 'done' : 'pending';
    this.indiceStatus = this.indiceBase64 ? 'done' : 'pending';
    this.pulgarPreview = null;
    this.indicePreview = null;
    this.huellaError = '';
    this.huellaMensaje = '';
  }

  closeHuellaModal() {
    this.showHuellaModal = false;
    this.huellaError = '';
    this.huellaMensaje = '';
  }

  guardarHuellas() {
    this.closeHuellaModal();
  }

  capturarHuella(dedo: 'pulgar' | 'indice') {
    if (this.pulgarStatus === 'capturing' || this.indiceStatus === 'capturing') return;

    this.huellaError = '';
    this.huellaMensaje = 'Coloque el dedo en el lector...';

    if (dedo === 'pulgar') this.pulgarStatus = 'capturing';
    else this.indiceStatus = 'capturing';

    this.huellaService.capture().subscribe({
      next: (base64) => {
        const dataUrl = 'data:image/png;base64,' + base64;
        if (dedo === 'pulgar') {
          this.pulgarBase64 = base64;
          this.pulgarPreview = dataUrl;
          this.pulgarStatus = 'done';
        } else {
          this.indiceBase64 = base64;
          this.indicePreview = dataUrl;
          this.indiceStatus = 'done';
        }
        this.huellaMensaje = `Huella de ${dedo === 'pulgar' ? 'pulgar' : 'índice'} capturada correctamente`;
      },
      error: (err) => {
        if (dedo === 'pulgar') this.pulgarStatus = 'pending';
        else this.indiceStatus = 'pending';
        this.huellaError = typeof err === 'string' ? err : 'Error al capturar huella';
        this.huellaMensaje = '';
      },
    });
  }

  onSubmit() {
    Object.keys(this.form.controls).forEach(k => this.form.get(k)?.markAsTouched());

    if (this.form.invalid) return;
    if (this.saving) return;

    this.saving = true;
    this.submitError = '';

    const data: any = {
      ...this.form.value,
      foto: this.fotoBase64 || undefined,
      huella_pulgar: this.pulgarBase64 || undefined,
      huella_indice: this.indiceBase64 || undefined,
    };

    if (!data.contraseña) {
      delete data.contraseña;
    }
    if (data.roleId) {
      data.roleId = JSON.stringify([data.roleId]);
    } else {
      data.roleId = '[]';
    }

    const req = this.editId
      ? this.service.update(this.editId, data)
      : this.service.store(data);

    req.pipe(finalize(() => (this.saving = false))).subscribe({
      next: (res: any) => {
        if (res?.error) {
          this.submitError = res.msg || res.message || res.mensaje || 'Error del servidor';
          return;
        }
        this.backToList();
        this.load();
      },
      error: (err: any) => {
        const body = err.error;
        if (body?.errors) {
          const msgs = Object.entries(body.errors)
            .map(([field, messages]: [string, any]) => `${field}: ${Array.isArray(messages) ? messages.join(', ') : messages}`)
            .join('; ');
          this.submitError = msgs;
        } else {
          this.submitError =
            body?.msg ||
            body?.message ||
            body?.mensaje ||
            body?.error ||
            err.message ||
            'Error al guardar. Verifique la conexión con el servidor.';
        }
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
          console.error('[Empleado] delete error', err);
          this.submitError = 'Error al eliminar empleado';
        }
      },
    });
  }

  trackById(_index: number, item: any): string {
    return item.empleadoId || item.id;
  }
}
