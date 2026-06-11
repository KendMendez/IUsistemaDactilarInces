import { Component, ChangeDetectorRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormGroup, FormControl, Validators } from '@angular/forms';
import { Auth } from '../../services/auth';
import { Router } from '@angular/router';
import { MessageHelper } from '../../helpers/message';

@Component({
  selector: 'app-login',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './login.html',
  styles: ``,
})
export class Login {
  loginForm: FormGroup;
  error: any = '';
  seeding = false;

  private cdr = inject(ChangeDetectorRef);

  constructor(
    private authService: Auth,
    private router: Router,
    private msg: MessageHelper
  ) {
    this.loginForm = new FormGroup({
      correo: new FormControl('', [Validators.required, Validators.email]),
      contraseña: new FormControl('', [Validators.required])
    });
  }

  onSubmit() {
    if (this.loginForm.invalid) return;
    if (this.seeding) return;

    this.seeding = true;
    this.error = '';
    this.cdr.detectChanges();

    this.authService.login(this.loginForm.value).subscribe({
      next: (response) => {
        if (response.results?.token) {
          this.router.navigate(['/menu']);
        }
        this.seeding = false;
      },
      error: (err) => {
        this.error = err?.error?.msg || this.msg.loginError();
        this.loginForm.get('contraseña')?.setValue('');
        this.seeding = false;
      },
    });
  }
}
