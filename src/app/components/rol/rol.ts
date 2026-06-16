import { Component, OnInit, ChangeDetectorRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormGroup, FormControl, Validators } from '@angular/forms';
import { finalize } from 'rxjs/operators';
import { RolService } from '../../services/rol';
import { RolePrivilegioService } from '../../services/role-privilegio';
import { PrivilegioService } from '../../services/privilegio';
import { MessageHelper } from '../../helpers/message';

@Component({
  selector: 'app-rol',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './rol.html',
  styles: ``,
})
export class Rol implements OnInit {
  list: any[] = [];
  loading = false;
  saving = false;
  submitError = '';
  showForm = false;
  editId: string | null = null;

  form = new FormGroup({
    role: new FormControl('', Validators.required),
  });

  privilegios: any[] = [];
  selectedPrivs: string[] = [];

  private cdr = inject(ChangeDetectorRef);

  constructor(
    private service: RolService,
    private rolePrivService: RolePrivilegioService,
    private privService: PrivilegioService,
    private msg: MessageHelper
  ) {}

  ngOnInit(): void {
    this.load();
    this.privService.index().subscribe({
      next: (res) => { this.privilegios = res.results || []; this.cdr.detectChanges(); },
      error: (err) => { console.error('[Rol] load privilegios error', err); this.cdr.detectChanges(); },
    });
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
        console.error('[Rol] load error', err);
        this.submitError = this.msg.loadError('roles');
        this.cdr.detectChanges();
      },
    });
  }

  openForm(item?: any) {
    this.showForm = true;
    this.editId = null;
    this.submitError = '';
    this.form.reset({ role: '' });
    this.selectedPrivs = [];
    Object.keys(this.form.controls).forEach(k => this.form.get(k)?.markAsUntouched());

    if (item) {
      this.editId = item.rolId ?? item.id;
      this.form.patchValue({ role: item.role });

      this.rolePrivService.showByRoleId(this.editId!).subscribe({
        next: (res) => {
          this.privilegios = res.results || [];
          this.selectedPrivs = this.privilegios
            .filter((p: any) => p.selected)
            .map((p: any) => String(p.privilegioId));
          this.cdr.detectChanges();
        },
        error: (err) => { console.error('[Rol] showByRoleId error', err); this.cdr.detectChanges(); },
      });
    }
  }

  back() {
    this.showForm = false;
    this.editId = null;
    this.form.reset();
    this.submitError = '';
    this.selectedPrivs = [];
  }

  privId(p: any): string {
    return String(p.privilegioId ?? p.id);
  }

  isChecked(id: string): boolean {
    return this.selectedPrivs.includes(id);
  }

  togglePriv(id: string) {
    if (this.selectedPrivs.includes(id)) {
      this.selectedPrivs = this.selectedPrivs.filter(v => v !== id);
    } else {
      this.selectedPrivs = [...this.selectedPrivs, id];
    }
  }

  getCampos(): string[] {
    const map: Record<string, boolean> = {};
    for (const p of this.privilegios) {
      const c = p.campo || '';
      if (c) map[c] = true;
    }
    return Object.keys(map);
  }

  getPrivsByCampo(campo: string): any[] {
    return this.privilegios.filter(p => (p.campo || '') === campo);
  }

  isCampoAllSelected(campo: string): boolean {
    const ids = this.getPrivsByCampo(campo).map(p => this.privId(p));
    return ids.length > 0 && ids.every(id => this.selectedPrivs.includes(id));
  }

  toggleCampo(campo: string) {
    const ids = this.getPrivsByCampo(campo).map(p => this.privId(p));
    const allSelected = ids.every(id => this.selectedPrivs.includes(id));
    if (allSelected) {
      this.selectedPrivs = this.selectedPrivs.filter(v => !ids.includes(v));
    } else {
      for (const id of ids) {
        if (!this.selectedPrivs.includes(id)) {
          this.selectedPrivs = [...this.selectedPrivs, id];
        }
      }
    }
  }

  private savePrivs(rolId: string) {
    return this.rolePrivService.store({
      roleId: rolId,
      arrPrivilegioId: this.selectedPrivs,
    });
  }

  onSubmit() {
    Object.keys(this.form.controls).forEach(k => this.form.get(k)?.markAsTouched());
    if (this.form.invalid || this.saving) return;

    if (this.selectedPrivs.length === 0) {
      this.submitError = this.msg.noPrivileges();
      this.saving = false;
      return;
    }

    this.saving = true;
    this.submitError = '';

    const v = this.form.value.role;
    const data = { role: v, nombre: v, rol: v };

    const onPrivError = (err: any) => {
      const body = err.error;
      console.error('[Rol] savePrivs error status:', err.status, 'body:', body);
      this.submitError = body?.msg || body?.message || body?.mensaje || body?.error || err.message || this.msg.serverError();
      this.saving = false;
    };

    if (this.editId) {
      this.service.update(this.editId, data).pipe(finalize(() => { this.saving = false; this.cdr.detectChanges(); })).subscribe({
        next: (res: any) => {
          if (res?.error) { this.submitError = res.msg || res.message || res.mensaje || this.msg.serverError(); return; }
          this.savePrivs(this.editId!).subscribe({ next: (privRes: any) => {
            if (privRes?.error) { this.submitError = privRes.msg || privRes.message || this.msg.serverError(); return; }
            this.back(); this.load();
          }, error: onPrivError });
        },
        error: (err: any) => {
          const body = err.error;
          this.submitError = body?.msg || body?.message || body?.mensaje || body?.error || err.message || this.msg.saveError();
        },
      });
    } else {
      this.service.store(data).pipe(finalize(() => { this.saving = false; this.cdr.detectChanges(); })).subscribe({
        next: (res: any) => {
          if (res?.error) { this.submitError = res.msg || res.message || res.mensaje || this.msg.serverError(); return; }
          const r = res.results || res.data || res;
          const newId = r.rolId ?? r.id ?? null;
          if (newId) {
            this.savePrivs(newId).subscribe({ next: (privRes: any) => {
              if (privRes?.error) { this.submitError = privRes.msg || privRes.message || this.msg.serverError(); return; }
              this.back(); this.load();
            }, error: onPrivError });
          } else {
            this.submitError = 'No se pudo obtener el ID del rol creado. Revise la consola.';
            console.error('Response de rol.store:', res);
          }
        },
        error: (err: any) => {
          const body = err.error;
          this.submitError = body?.msg || body?.message || body?.mensaje || body?.error || err.message || this.msg.saveError();
        },
      });
    }
  }

  eliminar(id: string, force = false) {
    this.service.delete(id, force).subscribe({
      next: () => this.load(),
      error: (err) => {
        const body = err.error;
        if (body?.requires_confirmation && confirm(body.msg)) {
          this.eliminar(id, true);
        } else {
          console.error('[Rol] delete error', err);
          this.submitError = this.msg.deleteError('rol');
        }
      },
    });
  }

  trackById(_i: number, item: any): string {
    return item.rolId ?? item.id;
  }
}
