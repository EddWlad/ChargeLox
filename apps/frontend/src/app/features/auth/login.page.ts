import { CommonModule } from '@angular/common';
import { Component, signal, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { finalize } from 'rxjs';
import { AuthService } from '../../core/services/auth.service';

import { enableAutoDismiss } from '../../core/utils/auto-dismiss.util';

@Component({
  selector: 'app-login-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <section class="auth-page container">
      <div class="auth-panel card">
        <header class="section-head">
          <h2>Acceso ChargeLox</h2>
          <p>Autenticación por JWT con roles ADMINISTRADOR y ANALISTA.</p>
        </header>

        <div class="auth-switch">
          <button type="button" class="btn" [class.btn-primary]="mode() === 'login'" [class.btn-secondary]="mode() !== 'login'" (click)="setMode('login')">
            Iniciar sesión
          </button>
          <button type="button" class="btn" [class.btn-primary]="mode() === 'register'" [class.btn-secondary]="mode() !== 'register'" (click)="setMode('register')">
            Registro público
          </button>
        </div>

        <form *ngIf="mode() === 'login'" [formGroup]="loginForm" (ngSubmit)="submitLogin()" class="form-grid">
          <label>
            Email
            <input type="email" formControlName="email" placeholder="admin@chargelox.com" />
          </label>
          <label>
            Contraseña
            <input type="password" formControlName="password" placeholder="******" />
          </label>
          <button type="submit" class="btn btn-primary" [disabled]="loading()">Entrar</button>
        </form>

        <form *ngIf="mode() === 'register'" [formGroup]="registerForm" (ngSubmit)="submitRegister()" class="form-grid">
          <label>
            Nombres
            <input type="text" formControlName="nombres" />
          </label>
          <label>
            Apellidos
            <input type="text" formControlName="apellidos" />
          </label>
          <label>
            Email
            <input type="email" formControlName="email" />
          </label>
          <label>
            Contraseña
            <input type="password" formControlName="password" />
          </label>
          <button type="submit" class="btn btn-primary" [disabled]="loading()">Crear cuenta</button>
        </form>

        <p class="status ok" *ngIf="successMessage()">{{ successMessage() }}</p>
        <p class="status error" *ngIf="errorMessage()">{{ errorMessage() }}</p>

        <footer class="auth-hint">
          <small>
            Credencial seed admin: <strong>admin@chargelox.com</strong> / <strong>Password123*</strong>
          </small>
        </footer>
      </div>
    </section>
  `,
})
export class LoginPageComponent {
  private readonly fb = inject(FormBuilder);
  readonly mode = signal<'login' | 'register'>('login');
  readonly loading = signal(false);
  readonly errorMessage = signal('');
  readonly successMessage = signal('');

  readonly loginForm = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
  });

  readonly registerForm = this.fb.nonNullable.group({
    nombres: ['', [Validators.required, Validators.maxLength(120)]],
    apellidos: [''],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
  });

  constructor(
    private readonly authService: AuthService,
    private readonly router: Router,
    private readonly route: ActivatedRoute,
  ) {
    enableAutoDismiss([this.errorMessage, this.successMessage]);
    if (this.authService.isAuthenticated()) {
      void this.router.navigate(['/app/dashboard']);
    }
  }

  setMode(mode: 'login' | 'register'): void {
    this.mode.set(mode);
    this.errorMessage.set('');
    this.successMessage.set('');
  }

  submitLogin(): void {
    if (this.loginForm.invalid || this.loading()) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    this.errorMessage.set('');
    this.successMessage.set('');

    this.authService
      .login(this.loginForm.getRawValue())
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: () => {
          const redirectTo = this.route.snapshot.queryParamMap.get('redirectTo') ?? '/app/dashboard';
          void this.router.navigateByUrl(redirectTo);
        },
        error: (error: HttpErrorResponse) => {
          this.errorMessage.set(error.error?.message ?? 'No fue posible iniciar sesión.');
        },
      });
  }

  submitRegister(): void {
    if (this.registerForm.invalid || this.loading()) {
      this.registerForm.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    this.errorMessage.set('');
    this.successMessage.set('');

    const payload = this.registerForm.getRawValue();

    this.authService
      .register(payload)
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: () => {
          this.successMessage.set('Usuario registrado. Ahora inicia sesión.');
          this.setMode('login');
          this.loginForm.patchValue({ email: payload.email, password: '' });
        },
        error: (error: HttpErrorResponse) => {
          this.errorMessage.set(error.error?.message ?? 'No fue posible registrar el usuario.');
        },
      });
  }
}




