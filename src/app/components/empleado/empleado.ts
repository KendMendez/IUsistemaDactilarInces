import { Component, OnInit, OnDestroy, ChangeDetectorRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormGroup, FormControl, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { finalize } from 'rxjs/operators';
import { EmpleadoService } from '../../services/empleado';
import { CargoService } from '../../services/cargo';
import { RolService } from '../../services/rol';
import { HuellaService } from '../../services/huella';
import { KioskoService } from '../../services/kiosko';
import { MessageHelper } from '../../helpers/message';

function venezuelanPhoneValidator(control: AbstractControl): ValidationErrors | null {
  if (!control.value) return null;
  const cleaned = control.value.replace(/[\s\-\(\)]/g, '');
  const valid = /^0\d{10}$/.test(cleaned);
  return valid ? null : { phone: 'Debe ser un número venezolano válido (ej: 04121234567)' };
}

@Component({
  selector: 'app-empleado',
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './empleado.html',
  styles: ``,
})
export class Empleado implements OnInit, OnDestroy {
  list: any[] = [];
  filteredList: any[] = [];
  loading = false;
  saving = false;
  submitError = '';

  showForm = false;
  editId: string | null = null;

  cargos: any[] = [];
  roles: any[] = [];
  cargoCollapsed = false;
  rolesCollapsed = false;

  fotoArchivo: File | null = null;
  fotoPreview: string | null = null;

  huellasCapturadas: string[] = [];
  pasoHuella = 0;
  showHuellaModal = false;
  huellaCapturando = false;
  huellaMensaje = '';
  huellaError = '';

  showPassword = false;
  showPasswordText = false;

  searchQuery = '';
  buscando = false;

  form = new FormGroup({
    nombre: new FormControl('', Validators.required),
    apellido: new FormControl('', Validators.required),
    identificacion: new FormControl('', [Validators.required, Validators.pattern(/^\d+$/)]),
    correo: new FormControl('', [Validators.required, Validators.email]),
    contraseña: new FormControl(''),
    telefono: new FormControl('', [Validators.required, venezuelanPhoneValidator]),
    sexo: new FormControl('M', Validators.required),
    id_cargo: new FormControl('', Validators.required),
    roleId: new FormControl(''),
  });

  private cdr = inject(ChangeDetectorRef);

  constructor(
    private service: EmpleadoService,
    private cargoService: CargoService,
    private rolService: RolService,
    private huellaService: HuellaService,
    private kiosko: KioskoService,
    private msg: MessageHelper
  ) {}

  ngOnInit(): void {
    this.load();
    this.loadCargos();
    this.loadRoles();
  }

  ngOnDestroy(): void {
    this.huellaService.dispose();
  }

  load() {
    this.loading = true;
    this.service.index().pipe(finalize(() => {
      this.loading = false;
      this.cdr.detectChanges();
    })).subscribe({
      next: (res) => {
        const raw = res.results || res.data || [];
        this.list = Array.isArray(raw) ? raw : [];
        this.filteredList = [...this.list];
      },
      error: () => {
        this.submitError = this.msg.loadError('empleados');
        this.cdr.detectChanges();
      },
    });
  }

  loadCargos() {
    this.cargoService.index().subscribe({
      next: (res) => { this.cargos = res.results || []; this.cdr.detectChanges(); },
    });
  }

  loadRoles() {
    this.rolService.index().subscribe({
      next: (res) => { this.roles = res.results || []; this.cdr.detectChanges(); },
    });
  }

  onSearch() {
    const q = this.searchQuery.trim();
    if (!q) {
      this.filteredList = [...this.list];
      return;
    }
    this.buscando = true;
    this.service.search(q).pipe(finalize(() => {
      this.buscando = false;
      this.cdr.detectChanges();
    })).subscribe({
      next: (res) => {
        this.filteredList = res.results || [];
      },
      error: () => {
        this.filteredList = [];
        this.submitError = this.msg.notFound('Empleado');
      },
    });
  }

  clearSearch() {
    this.searchQuery = '';
    this.filteredList = [...this.list];
    this.submitError = '';
  }

  openForm(empleado?: any) {
    this.showForm = true;
    this.editId = empleado?.empleadoId || null;
    this.showPassword = false;
    this.submitError = '';
    this.fotoArchivo = null;
    this.fotoPreview = null;
    this.huellasCapturadas = [];
    this.pasoHuella = 0;

    this.form.reset({
      nombre: '', apellido: '', identificacion: '', correo: '',
      contraseña: '', telefono: '', sexo: 'M', id_cargo: '', roleId: '',
    });

    if (!this.editId) {
      this.form.get('correo')?.setValidators([Validators.required, Validators.email]);
      this.form.get('correo')?.updateValueAndValidity();
      this.form.get('contraseña')?.setValidators([Validators.required, Validators.minLength(8)]);
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
        this.fotoPreview = 'data:image/png;base64,' + empleado.foto;
      }
      if (empleado.rolIds?.length > 0) {
        this.form.patchValue({ roleId: empleado.rolIds[0] });
      }
    }
  }

  backToList() {
    this.showForm = false;
    this.editId = null;
    this.form.reset();
    this.fotoPreview = null;
    this.fotoArchivo = null;
    this.huellasCapturadas = [];
    this.pasoHuella = 0;
    this.showPassword = false;
    this.submitError = '';
  }

  limpiarFormulario() {
    const editId = this.editId;
    this.backToList();
    if (editId) {
      this.openForm(this.list.find(e => e.empleadoId === editId));
    } else {
      this.openForm();
    }
  }

  onFotoChange(event: any) {
    const file = event.target?.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      this.submitError = this.msg.photoSizeError();
      return;
    }

    this.fotoArchivo = file;
    this.fotoPreview = URL.createObjectURL(file);
  }

  private autoAdvanceTimer: any = null;

  openHuellaModal() {
    this.kiosko.pause();
    this.showHuellaModal = true;
    this.huellasCapturadas = [];
    this.huellaError = '';
    this.huellaMensaje = 'Coloque su dedo pulgar en el lector...';
    this.huellaCapturando = true;
    this.pasoHuella = 0;
    this.cdr.detectChanges();
    this.iniciarCapturaDedo(0);
  }

  iniciarCapturaDedo(index: number) {
    this.pasoHuella = index;
    this.huellaCapturando = true;
    this.huellaError = '';
    const nombreDedo = index === 0 ? 'pulgar' : 'índice';
    this.huellaMensaje = `Coloque su dedo ${nombreDedo} en el lector...`;
    this.cdr.detectChanges();

    this.huellaService.capture().subscribe({
      next: (base64) => {
        if (!this.showHuellaModal) return;
        this.huellasCapturadas[index] = base64;
        this.huellaCapturando = false;
        const nombres = ['pulgar', 'índice'];
        this.huellaMensaje = `Huella ${nombres[index]} tomada correctamente.`;
        this.cdr.detectChanges();

        if (index === 0) {
          this.autoAdvanceTimer = setTimeout(() => {
            if (this.showHuellaModal && this.huellasCapturadas.length === 1 && !this.huellaCapturando) {
              this.continuarCaptura();
            }
          }, 2000);
        }
      },
      error: (err) => {
        if (!this.showHuellaModal) return;
        this.huellaError = typeof err === 'string' ? err : this.msg.fingerprintError();
        this.huellaCapturando = false;
        this.cdr.detectChanges();
      },
    });
  }

  continuarCaptura() {
    if (this.autoAdvanceTimer) {
      clearTimeout(this.autoAdvanceTimer);
      this.autoAdvanceTimer = null;
    }
    if (this.huellaCapturando || this.huellasCapturadas.length !== 1) return;
    this.iniciarCapturaDedo(1);
  }

  closeHuellaModal() {
    if (this.autoAdvanceTimer) {
      clearTimeout(this.autoAdvanceTimer);
      this.autoAdvanceTimer = null;
    }
    this.huellaService.cancelCapture();
    this.showHuellaModal = false;
    this.huellaError = '';
    this.huellaMensaje = '';
    this.huellaCapturando = false;
    this.kiosko.resume();
  }

  fieldInvalid(field: string): boolean {
    const ctrl = this.form.get(field);
    return !!(ctrl?.invalid && ctrl?.touched);
  }

  fieldError(field: string): string {
    const ctrl = this.form.get(field);
    if (!ctrl || !ctrl.errors || !ctrl.touched) return '';
    if (ctrl.errors['required']) return this.msg.required();
    if (ctrl.errors['email']) return this.msg.invalidEmail();
    if (ctrl.errors['phone']) return ctrl.errors['phone'];
    if (ctrl.errors['pattern']) return this.msg.onlyNumbers();
    if (ctrl.errors['minlength']) return 'Mínimo ' + ctrl.errors['minlength'].requiredLength + ' caracteres';
    return this.msg.required();
  }

  togglePassword() {
    this.showPassword = !this.showPassword;
    if (!this.showPassword) {
      this.form.patchValue({ contraseña: '' });
      this.form.get('contraseña')?.clearValidators();
    } else {
      this.form.get('contraseña')?.setValidators([Validators.required, Validators.minLength(8)]);
    }
    this.form.get('contraseña')?.updateValueAndValidity();
  }

  togglePasswordText() {
    this.showPasswordText = !this.showPasswordText;
  }

  onSubmit() {
    Object.keys(this.form.controls).forEach(k => this.form.get(k)?.markAsTouched());
    if (this.form.invalid || this.saving) return;
    this.saving = true;
    this.submitError = '';

    const data: any = { ...this.form.value };

    if (this.fotoArchivo) {
      const reader = new FileReader();
      reader.onload = () => {
        data.foto = (reader.result as string).split(',')[1] || '';
        this.enviarDatos(data);
      };
      reader.onerror = () => {
        this.saving = false;
        this.submitError = this.msg.photoReadError();
        this.cdr.detectChanges();
      };
      reader.readAsDataURL(this.fotoArchivo);
      return;
    }

    this.enviarDatos(data);
  }

  private enviarDatos(data: any) {
    if (this.huellasCapturadas.length > 0) {
      data.huella_pulgar = this.huellasCapturadas[0] || undefined;
      data.huella_indice = this.huellasCapturadas[1] || undefined;
    }

    if (!data.contraseña) {
      delete data.contraseña;
    }

    if (data.roleId) {
      data.roleId = JSON.stringify([data.roleId]);
    } else {
      delete data.roleId;
    }

    const req = this.editId
      ? this.service.update(this.editId, data)
      : this.service.store(data);

    req.pipe(finalize(() => {
      this.saving = false;
      this.cdr.detectChanges();
    })).subscribe({
      next: (res: any) => {
        if (res?.error) {
          this.submitError = res.msg || res.message || this.msg.serverError();
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
          this.submitError = body?.msg || body?.message || err.message || this.msg.saveError();
        }
      },
    });
  }

  eliminar(id: string, force = false) {
    this.service.delete(id, force).subscribe({
      next: () => {
        this.filteredList = this.filteredList.filter(e => e.empleadoId !== id);
        this.list = this.list.filter(e => e.empleadoId !== id);
        this.cdr.detectChanges();
      },
      error: (err) => {
        const body = err.error;
        if (body?.requires_confirmation && confirm(body.msg)) {
          this.eliminar(id, true);
        } else {
          this.submitError = this.msg.deleteError('empleado');
        }
      },
    });
  }

  getCargoDisplay(item: any): string {
    if (!item.cargo) return '—';
    return typeof item.cargo === 'string' ? item.cargo : (item.cargo.cargo || '—');
  }

  toggleCargo() { this.cargoCollapsed = !this.cargoCollapsed; }

  toggleRol() { this.rolesCollapsed = !this.rolesCollapsed; }

  selectCargo(id: string) {
    this.form.patchValue({ id_cargo: id });
    this.cargoCollapsed = false;
  }

  selectRol(id: string) {
    this.form.patchValue({ roleId: id });
    this.rolesCollapsed = false;
  }

  getCargoName(id: string | null | undefined): string {
    if (!id) return 'Seleccionar cargo...';
    const c = this.cargos.find(x => x.cargoId === id);
    return c ? c.cargo : 'Seleccionar cargo...';
  }

  getRolName(id: string | null | undefined): string {
    if (!id) return 'Seleccionar rol...';
    const r = this.roles.find(x => x.rolId === id);
    return r ? r.role : 'Seleccionar rol...';
  }

  trackById(_index: number, item: any): string {
    return item.empleadoId || item.id;
  }
}
