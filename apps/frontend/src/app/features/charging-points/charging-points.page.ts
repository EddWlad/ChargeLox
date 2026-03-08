import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import {
  ChargingPoint,
  ChargingPointQuery,
  EstadoConexion,
  EstadoPunto,
  Prioridad,
  RolUsuario,
  TipoPunto,
} from '../../core/models/domain.models';
import { AuthService } from '../../core/services/auth.service';
import { ChargingPointsApiService } from '../../core/services/charging-points-api.service';

import { enableAutoDismiss } from '../../core/utils/auto-dismiss.util';

@Component({
  selector: 'app-charging-points-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
    <section class="section-stack">
      <article class="card" *ngIf="canCreatePoint()">
        <header class="section-head compact">
          <h2>Crear punto de carga / electrolinera</h2>
          <p>Disponible para ADMINISTRADOR y ANALISTA.</p>
        </header>

        <form class="form-grid grid-3" [formGroup]="createForm" (ngSubmit)="create()">
          <label>
            Nombre
            <input type="text" formControlName="nombre" />
          </label>
          <label>
            Código asignado
            <input type="text" formControlName="codigoAsignado" />
          </label>
          <label>
            Serial
            <input type="text" formControlName="serial" />
          </label>
          <label>
            PUK
            <input type="text" formControlName="puk" />
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
              <option *ngFor="let item of estadoPuntoOptions" [value]="item">{{ item }}</option>
            </select>
          </label>
          <label>
            Conexión
            <select formControlName="estadoConexion">
              <option *ngFor="let item of estadoConexionOptions" [value]="item">{{ item }}</option>
            </select>
          </label>
          <label>
            Puerto
            <input type="text" formControlName="puerto" />
          </label>
          <label>
            Tipo
            <select formControlName="tipo">
              <option *ngFor="let item of tipoPuntoOptions" [value]="item">{{ item }}</option>
            </select>
          </label>

          <button type="submit" class="btn btn-primary" [disabled]="loading()">Guardar</button>
        </form>
      </article>

      <article class="card" *ngIf="isAdmin()">
        <header class="section-head compact">
          <h3>Carga masiva desde Excel</h3>
          <p>UI preparada. Requiere endpoint backend de importación para activación completa.</p>
        </header>

        <div class="inline-actions wrap">
          <label class="btn btn-secondary file-btn" title="Seleccionar archivo Excel (.xlsx)" aria-label="Seleccionar archivo Excel">
            <span class="material-symbols-outlined" aria-hidden="true">upload_file</span>
            Seleccionar archivo
            <input type="file" accept=".xlsx,.xls,.csv" (change)="onBulkFileSelected($event)" />
          </label>

          <button type="button" class="btn btn-primary" (click)="prepareBulkImport()" [disabled]="!bulkFileName()">
            <span class="material-symbols-outlined" aria-hidden="true">cloud_upload</span>
            Preparar carga
          </button>

          <span class="muted" *ngIf="bulkFileName()">Archivo: {{ bulkFileName() }}</span>
        </div>
      </article>

      <article class="card">
        <form class="filter-bar" [formGroup]="filtersForm" (ngSubmit)="load(true)">
          <label>
            Buscar
            <input type="text" formControlName="search" placeholder="Nombre o código" />
          </label>
          <label>
            Estado conexión
            <select formControlName="estadoConexion">
              <option value="">Todos</option>
              <option *ngFor="let item of estadoConexionOptions" [value]="item">{{ item }}</option>
            </select>
          </label>
          <label>
            Prioridad
            <select formControlName="prioridad">
              <option value="">Todas</option>
              <option *ngFor="let item of prioridadOptions" [value]="item">{{ item }}</option>
            </select>
          </label>
          <button type="submit" class="btn btn-primary" [disabled]="loading()">Filtrar</button>
        </form>

        <p class="status ok" *ngIf="successMessage()">{{ successMessage() }}</p>
        <p class="status error" *ngIf="errorMessage()">{{ errorMessage() }}</p>

        <div class="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Código</th>
                <th>Conexión</th>
                <th>Prioridad</th>
                <th>Tipo</th>
                <th class="table-actions-col">Acciones</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let point of items()">
                <td>{{ point.nombre }}</td>
                <td>{{ point.codigoAsignado }}</td>
                <td>
                  <span class="pill" [attr.data-connection]="point.estadoConexion">{{ point.estadoConexion }}</span>
                </td>
                <td>
                  <span class="pill" [attr.data-priority]="point.prioridad">{{ point.prioridad }}</span>
                </td>
                <td>{{ point.tipo }}</td>
                <td class="table-actions-col">
                  <div class="icon-actions" role="group" aria-label="Acciones de punto de carga">
                    <a
                      class="icon-btn"
                      [routerLink]="['/app/charging-points', point.id]"
                      title="Ver detalle"
                      aria-label="Ver detalle"
                    >
                      <span class="material-symbols-outlined" aria-hidden="true">visibility</span>
                    </a>

                    <button
                      *ngIf="isAdmin()"
                      type="button"
                      class="icon-btn danger"
                      (click)="remove(point.id)"
                      title="Eliminar"
                      aria-label="Eliminar"
                    >
                      <span class="material-symbols-outlined" aria-hidden="true">delete</span>
                    </button>
                  </div>
                </td>
              </tr>
              <tr *ngIf="items().length === 0">
                <td colspan="6" class="muted">No hay registros para los filtros actuales.</td>
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
    </section>
  `,
})
export class ChargingPointsPageComponent implements OnInit {
  private readonly fb = inject(FormBuilder);

  readonly items = signal<ChargingPoint[]>([]);
  readonly total = signal(0);
  readonly loading = signal(false);
  readonly errorMessage = signal('');
  readonly successMessage = signal('');
  readonly bulkFileName = signal('');

  readonly estadoConexionOptions = Object.values(EstadoConexion);
  readonly estadoPuntoOptions = Object.values(EstadoPunto);
  readonly prioridadOptions = Object.values(Prioridad);
  readonly tipoPuntoOptions = Object.values(TipoPunto);

  query: ChargingPointQuery = {
    page: 1,
    limit: 10,
  };

  readonly filtersForm = this.fb.nonNullable.group({
    search: [''],
    estadoConexion: [''],
    prioridad: [''],
  });

  readonly createForm = this.fb.nonNullable.group({
    nombre: ['', [Validators.required]],
    codigoAsignado: ['', [Validators.required]],
    serial: ['', [Validators.required]],
    puk: ['', [Validators.required]],
    prioridad: [Prioridad.MEDIA, [Validators.required]],
    estado: [EstadoPunto.LIBRE, [Validators.required]],
    estadoConexion: [EstadoConexion.OK, [Validators.required]],
    puerto: ['', [Validators.required]],
    tipo: [TipoPunto.PUNTO_CARGA, [Validators.required]],
  });

  constructor(
    private readonly chargingPointsApi: ChargingPointsApiService,
    private readonly authService: AuthService,
  ) {
    enableAutoDismiss([this.errorMessage, this.successMessage]);
  }

  ngOnInit(): void {
    this.load();
  }

  isAdmin(): boolean {
    return this.authService.currentUser()?.rol === RolUsuario.ADMINISTRADOR;
  }

  canCreatePoint(): boolean {
    const role = this.authService.currentUser()?.rol;
    return role === RolUsuario.ADMINISTRADOR || role === RolUsuario.ANALISTA;
  }

  onBulkFileSelected(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    this.bulkFileName.set(file?.name ?? '');
  }

  prepareBulkImport(): void {
    if (!this.bulkFileName()) {
      return;
    }

    this.successMessage.set(
      'UI de carga masiva lista. Falta endpoint backend para procesar Excel en bloque sin riesgo de romper el flujo actual.',
    );
  }

  load(resetPage = false): void {
    if (resetPage) {
      this.query.page = 1;
    }

    const filters = this.filtersForm.getRawValue();

    this.query = {
      ...this.query,
      search: filters.search.trim(),
      estadoConexion: filters.estadoConexion as EstadoConexion | '',
      prioridad: filters.prioridad as Prioridad | '',
    };

    this.loading.set(true);
    this.errorMessage.set('');

    this.chargingPointsApi
      .listPrivate(this.query)
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (response) => {
          this.items.set(response.items);
          this.total.set(response.total);
        },
        error: (error: HttpErrorResponse) => {
          this.errorMessage.set(error.error?.message ?? 'No fue posible cargar puntos de carga.');
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

    this.chargingPointsApi
      .create(this.createForm.getRawValue())
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: () => {
          this.successMessage.set('Punto creado correctamente.');
          this.createForm.reset({
            nombre: '',
            codigoAsignado: '',
            serial: '',
            puk: '',
            prioridad: Prioridad.MEDIA,
            estado: EstadoPunto.LIBRE,
            estadoConexion: EstadoConexion.OK,
            puerto: '',
            tipo: TipoPunto.PUNTO_CARGA,
          });
          this.load();
        },
        error: (error: HttpErrorResponse) => {
          this.errorMessage.set(error.error?.message ?? 'No fue posible crear el punto.');
        },
      });
  }

  remove(id: string): void {
    if (!this.isAdmin() || this.loading()) {
      return;
    }

    this.loading.set(true);
    this.errorMessage.set('');
    this.successMessage.set('');

    this.chargingPointsApi
      .remove(id)
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (response) => {
          this.successMessage.set(response.message);
          this.load();
        },
        error: (error: HttpErrorResponse) => {
          this.errorMessage.set(error.error?.message ?? 'No fue posible eliminar el punto.');
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








