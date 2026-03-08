import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, signal, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { finalize } from 'rxjs';
import { User } from '../../core/models/domain.models';
import { AuthService } from '../../core/services/auth.service';
import { UsersApiService } from '../../core/services/users-api.service';

import { enableAutoDismiss } from '../../core/utils/auto-dismiss.util';

@Component({
  selector: 'app-profile-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <section class="section-stack">
      <article class="card">
        <header class="section-head">
          <h2>Perfil del usuario</h2>
          <p>Actualiza tus datos básicos, contraseña y avatar.</p>
        </header>

        <div class="grid cards-2">
          <form [formGroup]="profileForm" (ngSubmit)="saveProfile()" class="form-grid">
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
            <button type="submit" class="btn btn-primary" [disabled]="loading()">Guardar perfil</button>
          </form>

          <form [formGroup]="passwordForm" (ngSubmit)="changePassword()" class="form-grid">
            <label>
              Contraseña actual
              <input type="password" formControlName="passwordActual" />
            </label>
            <label>
              Nueva contraseña
              <input type="password" formControlName="nuevaPassword" />
            </label>
            <button type="submit" class="btn btn-secondary" [disabled]="loading()">Cambiar contraseña</button>
          </form>
        </div>

        <div class="avatar-row" *ngIf="profile() as user">
          <img *ngIf="user.avatarUrl; else noAvatar" [src]="user.avatarUrl" alt="Avatar" class="avatar-preview" />
          <ng-template #noAvatar>
            <div class="avatar-empty">{{ user.nombres.slice(0, 1) }}</div>
          </ng-template>

          <label class="btn btn-ghost file-btn">
            Subir avatar
            <input type="file" accept="image/*" (change)="onAvatarSelected($event)" />
          </label>
        </div>

        <p class="status ok" *ngIf="successMessage()">{{ successMessage() }}</p>
        <p class="status error" *ngIf="errorMessage()">{{ errorMessage() }}</p>
      </article>
    </section>
  `,
})
export class ProfilePageComponent {
  private readonly fb = inject(FormBuilder);
  readonly profile = signal<User | null>(null);
  readonly loading = signal(false);
  readonly errorMessage = signal('');
  readonly successMessage = signal('');

  readonly profileForm = this.fb.nonNullable.group({
    nombres: ['', [Validators.required, Validators.maxLength(120)]],
    apellidos: [''],
    email: ['', [Validators.required, Validators.email]],
  });

  readonly passwordForm = this.fb.nonNullable.group({
    passwordActual: ['', [Validators.required, Validators.minLength(6)]],
    nuevaPassword: ['', [Validators.required, Validators.minLength(6)]],
  });

  constructor(
    private readonly usersApi: UsersApiService,
    private readonly authService: AuthService,
  ) {
    enableAutoDismiss([this.errorMessage, this.successMessage]);
  }

  ngOnInit(): void {
    this.loadProfile();
  }

  loadProfile(): void {
    this.loading.set(true);
    this.errorMessage.set('');

    this.usersApi
      .getMe()
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (user) => {
          this.profile.set(user);
          this.profileForm.patchValue({
            nombres: user.nombres,
            apellidos: user.apellidos ?? '',
            email: user.email,
          });
          this.authService.updateCurrentUser(user);
        },
        error: (error: HttpErrorResponse) => {
          this.errorMessage.set(error.error?.message ?? 'No fue posible cargar el perfil.');
        },
      });
  }

  saveProfile(): void {
    if (this.profileForm.invalid || this.loading()) {
      this.profileForm.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    this.errorMessage.set('');
    this.successMessage.set('');

    this.usersApi
      .updateMe(this.profileForm.getRawValue())
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (user) => {
          this.profile.set(user);
          this.authService.updateCurrentUser(user);
          this.successMessage.set('Perfil actualizado correctamente.');
        },
        error: (error: HttpErrorResponse) => {
          this.errorMessage.set(error.error?.message ?? 'No fue posible actualizar el perfil.');
        },
      });
  }

  changePassword(): void {
    if (this.passwordForm.invalid || this.loading()) {
      this.passwordForm.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    this.errorMessage.set('');
    this.successMessage.set('');

    this.usersApi
      .changeMyPassword(this.passwordForm.getRawValue())
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (response) => {
          this.passwordForm.reset();
          this.successMessage.set(response.message);
        },
        error: (error: HttpErrorResponse) => {
          this.errorMessage.set(error.error?.message ?? 'No fue posible actualizar la contraseña.');
        },
      });
  }

  onAvatarSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];

    if (!file || this.loading()) {
      return;
    }

    this.loading.set(true);
    this.errorMessage.set('');
    this.successMessage.set('');

    this.usersApi
      .updateMyAvatar(file)
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (user) => {
          this.profile.set(user);
          this.authService.updateCurrentUser(user);
          this.successMessage.set('Avatar actualizado correctamente.');
        },
        error: (error: HttpErrorResponse) => {
          this.errorMessage.set(error.error?.message ?? 'No fue posible subir el avatar.');
        },
      });
  }
}



