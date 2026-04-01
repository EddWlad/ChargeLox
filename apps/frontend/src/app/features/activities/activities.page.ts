import { CommonModule, DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import {
  Activity,
  ActivityQuery,
  ChargingPoint,
  EstadoActividad,
  Prioridad,
  RolUsuario,
  TipoActividad,
  User,
} from '../../core/models/domain.models';
import { ActivitiesApiService } from '../../core/services/activities-api.service';
import { AuthService } from '../../core/services/auth.service';
import { ChargingPointsApiService } from '../../core/services/charging-points-api.service';
import { UsersApiService } from '../../core/services/users-api.service';

import { enableAutoDismiss } from '../../core/utils/auto-dismiss.util';

@Component({
  selector: 'app-activities-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, DatePipe],
  template: `
    <section class="section-stack">
      <article class="card" *ngIf="canCreateActivity()">
        <header class="section-head compact">
          <h2>Nueva actividad</h2>
          <p>Novedades y seguimientos del turno operativo.</p>
        </header>

        <form class="form-grid grid-3" [formGroup]="createForm" (ngSubmit)="create()">
          <label>
            Tipo actividad
            <select formControlName="tipoActividad">
              <option *ngFor="let item of tipoActividadOptions" [value]="item">{{ item }}</option>
            </select>
          </label>
          <label>
            Prioridad
            <select formControlName="prioridad">
              <option *ngFor="let item of prioridadOptions" [value]="item">{{ item }}</option>
            </select>
          </label>
          <label>
            Estado inicial
            <select formControlName="estado">
              <option *ngFor="let item of estadoActividadOptions" [value]="item">{{ item }}</option>
            </select>
          </label>
          <label>
            Punto relacionado (opcional)
            <select formControlName="chargingPointId">
              <option value="">Sin relación</option>
              <option *ngFor="let cp of chargingPoints()" [value]="cp.id">
                {{ cp.nombre }} ({{ cp.codigoAsignado }})
              </option>
            </select>
          </label>
          <label>
            Usuario relacionado (opcional)
            <select formControlName="usuarioId">
              <option value="">Sin relación</option>
              <option *ngFor="let user of users()" [value]="user.id">{{ user.nombres }} · {{ user.email }}</option>
            </select>
          </label>
          <label class="full-row">
            Descripción
            <textarea formControlName="descripcion" rows="3"></textarea>
          </label>

          <button type="submit" class="btn btn-primary" [disabled]="loading()">Crear actividad</button>
        </form>
      </article>

      <article class="card">
        <form [formGroup]="filtersForm" (ngSubmit)="load(true)" class="filter-bar">
          <label>
            Tipo
            <select formControlName="tipoActividad">
              <option value="">Todos</option>
              <option *ngFor="let item of tipoActividadOptions" [value]="item">{{ item }}</option>
            </select>
          </label>
          <label>
            Prioridad
            <select formControlName="prioridad">
              <option value="">Todas</option>
              <option *ngFor="let item of prioridadOptions" [value]="item">{{ item }}</option>
            </select>
          </label>
          <label>
            Estado
            <select formControlName="estado">
              <option value="">Todos</option>
              <option *ngFor="let item of estadoActividadOptions" [value]="item">{{ item }}</option>
            </select>
          </label>
          <button type="submit" class="btn btn-secondary" [disabled]="loading()">Filtrar</button>
        </form>

        <p class="status ok" *ngIf="successMessage()">{{ successMessage() }}</p>
        <p class="status error" *ngIf="errorMessage()">{{ errorMessage() }}</p>

        <div class="table-wrap">
          <table class="mobile-card-table">
            <thead>
              <tr>
                <th>Tipo</th>
                <th>Descripción</th>
                <th>Estado</th>
                <th>Prioridad</th>
                <th>Creado por</th>
                <th>Fecha</th>
                <th class="table-actions-col">Acciones</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let item of items()">
                <td data-label="Tipo">{{ item.tipoActividad }}</td>
                <td data-label="Descripción">{{ item.descripcion }}</td>
                <td data-label="Estado">
                  <span class="pill" [attr.data-activity-state]="item.estado">{{ item.estado }}</span>
                </td>
                <td data-label="Prioridad">
                  <span class="pill" [attr.data-priority]="item.prioridad">{{ item.prioridad }}</span>
                </td>
                <td data-label="Creado por">{{ item.creadoPorNombre }}</td>
                <td data-label="Fecha">{{ item.createdAt | date: 'short' }}</td>
                <td data-label="Acciones" class="table-actions-col">
                  <div class="icon-actions wrap" role="group" aria-label="Acciones de actividad">
                    <a
                      class="icon-btn"
                      [routerLink]="['/app/activities', item.id]"
                      title="Ver detalle"
                      aria-label="Ver detalle"
                    >
                      <span class="material-symbols-outlined" aria-hidden="true">visibility</span>
                    </a>

                    <button
                      type="button"
                      class="icon-btn"
                      (click)="selectForEdit(item)"
                      title="Editar"
                      aria-label="Editar"
                    >
                      <span class="material-symbols-outlined" aria-hidden="true">edit</span>
                    </button>

                    <select #statusSelect class="mini-select status-select" aria-label="Seleccionar estado" [value]="item.estado" [attr.data-selected]="item.estado">
                      <option *ngFor="let status of estadoActividadOptions" [value]="status">{{ status }}</option>
                    </select>

                    <button
                      type="button"
                      class="icon-btn"
                      (click)="changeStatus(item.id, statusSelect.value)"
                      title="Cambiar estado"
                      aria-label="Cambiar estado"
                    >
                      <span class="material-symbols-outlined" aria-hidden="true">sync_alt</span>
                    </button>

                    <button
                      type="button"
                      class="icon-btn danger"
                      (click)="remove(item.id)"
                      title="Eliminar"
                      aria-label="Eliminar"
                    >
                      <span class="material-symbols-outlined" aria-hidden="true">delete</span>
                    </button>
                  </div>
                </td>
              </tr>
              <tr *ngIf="items().length === 0">
                <td colspan="7" class="muted">No hay actividades para los filtros actuales.</td>
              </tr>
            </tbody>
          </table>
        </div>

        <footer class="pagination" *ngIf="items().length > 0">
          <button type="button" class="btn btn-secondary" (click)="prevPage()" [disabled]="query.page === 1 || loading()">Anterior</button>
          <span>Página {{ query.page }} · Total {{ total() }}</span>
          <button type="button" class="btn btn-secondary" (click)="nextPage()" [disabled]="isLastPage() || loading()">Siguiente</button>
        </footer>
      </article>

      <article class="card" *ngIf="editingId()">
        <header class="section-head compact">
          <h3>Editar actividad</h3>
        </header>

        <form class="form-grid" [formGroup]="editForm" (ngSubmit)="saveEdit()">
          <label>
            Tipo
            <select formControlName="tipoActividad">
              <option *ngFor="let item of tipoActividadOptions" [value]="item">{{ item }}</option>
            </select>
          </label>
          <label>
            Prioridad
            <select formControlName="prioridad">
              <option *ngFor="let item of prioridadOptions" [value]="item">{{ item }}</option>
            </select>
          </label>
          <label>
            Estado
            <select formControlName="estado">
              <option *ngFor="let item of estadoActividadOptions" [value]="item">{{ item }}</option>
            </select>
          </label>
          <label class="full-row">
            Descripción
            <textarea rows="3" formControlName="descripcion"></textarea>
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
export class ActivitiesPageComponent implements OnInit {
  private readonly fb = inject(FormBuilder);

  readonly items = signal<Activity[]>([]);
  readonly total = signal(0);
  readonly loading = signal(false);
  readonly errorMessage = signal('');
  readonly successMessage = signal('');
  readonly editingId = signal<string | null>(null);

  readonly users = signal<User[]>([]);
  readonly chargingPoints = signal<ChargingPoint[]>([]);

  readonly tipoActividadOptions = Object.values(TipoActividad);
  readonly prioridadOptions = Object.values(Prioridad);
  readonly estadoActividadOptions = Object.values(EstadoActividad);

  query: ActivityQuery = {
    page: 1,
    limit: 10,
  };

  readonly filtersForm = this.fb.nonNullable.group({
    tipoActividad: [''],
    prioridad: [''],
    estado: [''],
  });

  readonly createForm = this.fb.nonNullable.group({
    tipoActividad: [TipoActividad.NOVEDAD, [Validators.required]],
    prioridad: [Prioridad.MEDIA, [Validators.required]],
    descripcion: ['', [Validators.required]],
    estado: [EstadoActividad.EN_REVISION, [Validators.required]],
    usuarioId: [''],
    turnoId: [''],
    chargingPointId: [''],
  });

  readonly editForm = this.fb.nonNullable.group({
    tipoActividad: [TipoActividad.NOVEDAD, [Validators.required]],
    prioridad: [Prioridad.MEDIA, [Validators.required]],
    descripcion: ['', [Validators.required]],
    estado: [EstadoActividad.EN_REVISION, [Validators.required]],
  });

  constructor(
    private readonly activitiesApi: ActivitiesApiService,
    private readonly authService: AuthService,
    private readonly usersApi: UsersApiService,
    private readonly chargingPointsApi: ChargingPointsApiService,
  ) {
    enableAutoDismiss([this.errorMessage, this.successMessage]);
  }

  ngOnInit(): void {
    this.loadRelatedData();
    this.load();
  }

  isAdmin(): boolean {
    return this.authService.currentUser()?.rol === RolUsuario.ADMINISTRADOR;
  }

  canCreateActivity(): boolean {
    return this.authService.hasAnyRole([
      RolUsuario.ADMINISTRADOR,
      RolUsuario.ANALISTA,
    ]);
  }

  loadRelatedData(): void {
    this.chargingPointsApi.listPrivate({ page: 1, limit: 100 }).subscribe({
      next: (response) => this.chargingPoints.set(response.items),
    });

    this.usersApi.list({ page: 1, limit: 100 }).subscribe({
      next: (response) =>
        this.users.set(
          response.items.filter((user) => user.rol === RolUsuario.ANALISTA),
        ),
    });
  }

  load(resetPage = false): void {
    if (resetPage) {
      this.query.page = 1;
    }

    const filters = this.filtersForm.getRawValue();

    this.query = {
      ...this.query,
      tipoActividad: filters.tipoActividad as TipoActividad | '',
      prioridad: filters.prioridad as Prioridad | '',
      estado: filters.estado as EstadoActividad | '',
    };

    this.loading.set(true);
    this.errorMessage.set('');

    const request$ = this.isAdmin()
      ? this.activitiesApi.listAll(this.query)
      : this.activitiesApi.listMine(this.query);

    request$.pipe(finalize(() => this.loading.set(false))).subscribe({
      next: (response) => {
        this.items.set(response.items);
        this.total.set(response.total);
      },
      error: (error: HttpErrorResponse) => {
        this.errorMessage.set(error.error?.message ?? 'No fue posible cargar actividades.');
      },
    });
  }

  create(): void {
    if (!this.canCreateActivity()) {
      return;
    }

    if (this.createForm.invalid || this.loading()) {
      this.createForm.markAllAsTouched();
      return;
    }

    const rawValue = this.createForm.getRawValue();
    const payload = {
      ...rawValue,
      usuarioId: rawValue.usuarioId || undefined,
      turnoId: rawValue.turnoId || undefined,
      chargingPointId: rawValue.chargingPointId || undefined,
    };

    this.loading.set(true);
    this.errorMessage.set('');
    this.successMessage.set('');

    this.activitiesApi
      .create(payload)
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: () => {
          this.successMessage.set('Actividad creada correctamente.');
          this.createForm.patchValue({ descripcion: '', turnoId: '', usuarioId: '', chargingPointId: '' });
          this.load();
        },
        error: (error: HttpErrorResponse) => {
          this.errorMessage.set(error.error?.message ?? 'No fue posible crear actividad.');
        },
      });
  }

  selectForEdit(activity: Activity): void {
    this.editingId.set(activity.id);
    this.editForm.patchValue({
      tipoActividad: activity.tipoActividad,
      prioridad: activity.prioridad,
      descripcion: activity.descripcion,
      estado: activity.estado,
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

    this.activitiesApi
      .update(id, this.editForm.getRawValue())
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: () => {
          this.successMessage.set('Actividad actualizada correctamente.');
          this.editingId.set(null);
          this.load();
        },
        error: (error: HttpErrorResponse) => {
          this.errorMessage.set(error.error?.message ?? 'No fue posible actualizar la actividad.');
        },
      });
  }

  changeStatus(id: string, statusValue: string): void {
    const status = statusValue as EstadoActividad;

    if (!this.estadoActividadOptions.includes(status) || this.loading()) {
      return;
    }

    this.loading.set(true);
    this.errorMessage.set('');
    this.successMessage.set('');

    this.activitiesApi
      .changeStatus(id, status)
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: () => {
          this.successMessage.set('Estado actualizado correctamente.');
          this.load();
        },
        error: (error: HttpErrorResponse) => {
          this.errorMessage.set(error.error?.message ?? 'No fue posible cambiar estado.');
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

    this.activitiesApi
      .remove(id)
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (response) => {
          this.successMessage.set(response.message);
          this.load();
        },
        error: (error: HttpErrorResponse) => {
          this.errorMessage.set(error.error?.message ?? 'No fue posible eliminar la actividad.');
        },
      });
  }

  prevPage(): void {
    if ((this.query.page ?? 1) <= 1) return;
    this.query.page = (this.query.page ?? 1) - 1;
    this.load();
  }

  nextPage(): void {
    if (this.isLastPage()) return;
    this.query.page = (this.query.page ?? 1) + 1;
    this.load();
  }

  isLastPage(): boolean {
    const page = this.query.page ?? 1;
    const limit = this.query.limit ?? 10;
    return page * limit >= this.total();
  }
}





