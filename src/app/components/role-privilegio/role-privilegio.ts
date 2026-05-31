import { Component, OnInit, ChangeDetectorRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RolePrivilegioService } from '../../services/role-privilegio';
import { RolService } from '../../services/rol';
import { PrivilegioService } from '../../services/privilegio';

@Component({
  selector: 'app-role-privilegio',
  imports: [CommonModule],
  templateUrl: './role-privilegio.html',
  styles: ``,
})
export class RolePrivilegio implements OnInit {
  roles: any[] = [];
  privilegios: any[] = [];
  asignados: any[] = [];
  selectedRole: string = '';
  error = '';

  private cdr = inject(ChangeDetectorRef);

  constructor(
    private service: RolePrivilegioService,
    private rolService: RolService,
    private privilegioService: PrivilegioService
 ) {}

  ngOnInit(): void {
    this.rolService.index().subscribe({
      next: (res) => { this.roles = res.results || []; this.cdr.detectChanges(); },
      error: (err) => { console.error('[RolePrivilegio] load roles error', err); this.error = 'Error al cargar roles'; this.cdr.detectChanges(); },
    });
    this.privilegioService.index().subscribe({
      next: (res) => { this.privilegios = res.results || []; this.cdr.detectChanges(); },
      error: (err) => { console.error('[RolePrivilegio] load privilegios error', err); this.error = 'Error al cargar privilegios'; this.cdr.detectChanges(); },
    });
  }

  onRoleChange() {
    if (!this.selectedRole) return;
    this.service.showByRoleId(this.selectedRole).subscribe({
      next: (res) => { this.asignados = res.results || []; this.cdr.detectChanges(); },
      error: (err) => { console.error('[RolePrivilegio] showByRoleId error', err); this.error = 'Error al cargar privilegios del rol'; this.cdr.detectChanges(); },
    });
  }

  isAsignado(idPrivilegio: string): boolean {
    return this.asignados.some((a: any) => a.privilegioId === idPrivilegio);
  }

  togglePrivilegio(idPrivilegio: string) {
    if (!this.selectedRole) return;

    const arrPrivilegioId = this.isAsignado(idPrivilegio)
      ? this.asignados.filter((a: any) => a.privilegioId !== idPrivilegio).map((a: any) => a.privilegioId)
      : [...this.asignados.map((a: any) => a.privilegioId), idPrivilegio];

    this.service.store({ roleId: this.selectedRole, arrPrivilegioId: JSON.stringify(arrPrivilegioId) }).subscribe({
      next: () => this.onRoleChange(),
      error: (err) => {
        const body = err.error;
        console.error('[RolePrivilegio] store error status:', err.status, 'body:', body);
        this.error = body?.msg || body?.message || body?.error || err.message || 'Error al guardar privilegios';
        this.cdr.detectChanges();
      },
    });
  }
}
