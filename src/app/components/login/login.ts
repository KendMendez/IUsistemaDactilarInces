import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { Auth } from '../../services/auth';
import { Token } from '../../services/token';

@Component({
  selector: 'app-login',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './login.html',
  styles: ``,
})
export class Login {
  loginForm!: UntypedFormGroup;

  error: any = '';
  seeding = false;

  constructor(
    private fb: UntypedFormBuilder,
    private authService: Auth,
    private tokenService: Token
  ) {}

  ngOnInit(): void {
    this.initLoginForm();
  }

  initLoginForm() {
    this.loginForm = this.fb.group({
      cedula: ['', [Validators.required]],
      password: ['', [Validators.required, Validators.minLength(8), Validators.maxLength(50)]]
    });
  }

  onSubmit() {
    if (this.seeding) return;

    this.seeding = true;
    this.error = '';

    this.authService.login(this.loginForm.value).subscribe({
      next: (res: any) => {
        this.tokenService.handleToken(res.token);
        this.authService.isAuthenticated();
        this.loginForm.reset();
        this.seeding = false;
      },
      error: (err) => {
        this.loginForm.get('password')?.setValue('');
        this.error = err?.error?.message || 'Error al iniciar sesión';
        this.seeding = false;
      }
    });
  }
}
