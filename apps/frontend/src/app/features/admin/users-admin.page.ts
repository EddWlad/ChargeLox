import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { finalize } from 'rxjs';
import { RolUsuario, User } from '../../core/models/domain.models';
import { UsersApiService } from '../../core/services/users-api.service';

import { enableAutoDismiss } from '../../core/utils/auto-dismiss.util';

@Component({
  selector: 'app-users-admin-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <section class="section-stack">
      <article class="card">
        <header class="section-head compact">
          <h2>Gestión de usuarios</h2>
          <p>Administración de cuentas y roles.</p>
        </header>

        <form class="form-grid grid-3" [formGroup]="createForm" (ngSubmit)="create()">
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
          <label>
            Rol
            <select formControlName="rol">
              <option *ngFor="let role of rolOptions" [value]="role">{{ role }}</option>
            </select>
          </label>
          <label>
            Activo
            <select formControlName="activo">
              <option [ngValue]="true">Sí</option>
              <option [ngValue]="false">No</option>
            </select>
          </label>
          <button type="submit" class="btn btn-primary" [disabled]="loading()">Crear usuario</button>
        </form>
      </article>

      <article class="card">
        <form [formGroup]="searchForm" (ngSubmit)="load()" class="filter-bar">
          <label>
            Buscar
            <input type="text" formControlName="search" placeholder="Nombre o email" />
          </label>
          <button type="submit" class="btn btn-secondary" [disabled]="loading()">Buscar</button>
        </form>

        <p class="status ok" *ngIf="successMessage()">{{ successMessage() }}</p>
        <p class="status error" *ngIf="errorMessage()">{{ errorMessage() }}</p>

        <div class="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Email</th>
                <th>Rol</th>
                <th>Estado</th>
                <th class="table-actions-col">Acciones</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let user of users()">
                <td>{{ user.nombres }} {{ user.apellidos ?? '' }}</td>
                <td>{{ user.email }}</td>
                <td>
                  <span class="pill" [attr.data-role]="user.rol">{{ user.rol }}</span>
                </td>
                <td>
                  <span class="pill" [attr.data-user-state]="user.activo ? 'ACTIVO' : 'INACTIVO'">
                    {{ user.activo ? 'Activo' : 'Inactivo' }}
                  </span>
                </td>
                <td class="table-actions-col">
                  <div class="icon-actions" role="group" aria-label="Acciones de usuario">
                    <button
                      type="button"
                      class="icon-btn"
                      (click)="selectForEdit(user)"
                      title="Editar"
                      aria-label="Editar"
                    >
                      <span class="material-symbols-outlined" aria-hidden="true">edit</span>
                    </button>

                    <button
                      type="button"
                      class="icon-btn danger"
                      (click)="remove(user.id)"
                      title="Eliminar"
                      aria-label="Eliminar"
                    >
                      <span class="material-symbols-outlined" aria-hidden="true">delete</span>
                    </button>
                  </div>
                </td>
              </tr>
              <tr *ngIf="users().length === 0">
                <td colspan="5" class="muted">No hay usuarios para la búsqueda actual.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </article>

      <article class="card" *ngIf="editingId()">
        <header class="section-head compact">
          <h3>Editar usuario</h3>
        </header>

        <form [formGroup]="editForm" (ngSubmit)="saveEdit()" class="form-grid grid-3">
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
            Rol
            <select formControlName="rol">
              <option *ngFor="let role of rolOptions" [value]="role">{{ role }}</option>
            </select>
          </label>
          <label>
            Activo
            <select formControlName="activo">
              <option [ngValue]="true">Sí</option>
              <option [ngValue]="false">No</option>
            </select>
          </label>

          <div class="inline-actions">
            <button type="submit" class="btn btn-primary" [disabled]="loading()">Guardar cambios</button>
            <button type="button" class="btn btn-secondary" (click)="cancelEdit()">Cancelar</button>
          </div>
        </form>
      </article>
    </section>
  `,
})
export class UsersAdminPageComponent implements OnInit {
  private readonly fb = inject(FormBuilder);

  readonly users = signal<User[]>([]);
  readonly loading = signal(false);
  readonly errorMessage = signal('');
  readonly successMessage = signal('');
  readonly editingId = signal<string | null>(null);

  readonly rolOptions = Object.values(RolUsuario);

  readonly searchForm = this.fb.nonNullable.group({
    search: [''],
  });

  readonly createForm = this.fb.nonNullable.group({
    nombres: ['', [Validators.required]],
    apellidos: [''],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
    rol: [RolUsuario.ANALISTA, [Validators.required]],
    activo: [true, [Validators.required]],
  });

  readonly editForm = this.fb.nonNullable.group({
    nombres: ['', [Validators.required]],
    apellidos: [''],
    email: ['', [Validators.required, Validators.email]],
    rol: [RolUsuario.ANALISTA, [Validators.required]],
    activo: [true, [Validators.required]],
  });

  constructor(private readonly usersApi: UsersApiService) {
    enableAutoDismiss([this.errorMessage, this.successMessage]);
  }

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    const search = this.searchForm.getRawValue().search.trim();

    this.loading.set(true);
    this.errorMessage.set('');

    this.usersApi
      .list({ page: 1, limit: 50, search: search || undefined })
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (response) => this.users.set(response.items),
        error: (error: HttpErrorResponse) => {
          this.errorMessage.set(error.error?.message ?? 'No fue posible cargar usuarios.');
        },
      });
  }

  create(): void {
    if (this.createForm.invalid || this.loading()) {
      this.createForm.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    this.errorMessage.set('');
    this.successMessage.set('');

    this.usersApi
      .create(this.createForm.getRawValue())
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: () => {
          this.successMessage.set('Usuario creado correctamente.');
          this.createForm.patchValue({
            nombres: '',
            apellidos: '',
            email: '',
            password: '',
            rol: RolUsuario.ANALISTA,
            activo: true,
          });
          this.load();
        },
        error: (error: HttpErrorResponse) => {
          this.errorMessage.set(error.error?.message ?? 'No fue posible crear usuario.');
        },
      });
  }

  selectForEdit(user: User): void {
    this.editingId.set(user.id);
    this.editForm.patchValue({
      nombres: user.nombres,
      apellidos: user.apellidos ?? '',
      email: user.email,
      rol: user.rol,
      activo: user.activo,
    });
  }

  cancelEdit(): void {
    this.editingId.set(null);
  }

  saveEdit(): void {
    const id = this.editingId();

    if (!id || this.editForm.invalid || this.loading()) {
      this.editForm.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    this.errorMessage.set('');
    this.successMessage.set('');

    this.usersApi
      .update(id, this.editForm.getRawValue())
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: () => {
          this.successMessage.set('Usuario actualizado correctamente.');
          this.editingId.set(null);
          this.load();
        },
        error: (error: HttpErrorResponse) => {
          this.errorMessage.set(error.error?.message ?? 'No fue posible actualizar usuario.');
        },
      });
  }

  remove(id: string): void {
    if (this.loading()) {
      return;
    }

    this.loading.set(true);
    this.errorMessage.set('');
    this.successMessage.set('');

    this.usersApi
      .remove(id)
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (response) => {
          this.successMessage.set(response.message);
          this.load();
        },
        error: (error: HttpErrorResponse) => {
          this.errorMessage.set(error.error?.message ?? 'No fue posible eliminar usuario.');
        },
      });
  }
}

