import { CommonModule, DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import {
  ChargingPoint,
  EstadoActividadTecnica,
  Prioridad,
  RolUsuario,
  TechnicalActivity,
  TechnicalActivityQuery,
  TipoActividadTecnica,
  User,
} from '../../core/models/domain.models';
import { AuthService } from '../../core/services/auth.service';
import { ChargingPointsApiService } from '../../core/services/charging-points-api.service';
import { TechnicalActivitiesApiService } from '../../core/services/technical-activities-api.service';
import { enableAutoDismiss } from '../../core/utils/auto-dismiss.util';

@Component({
  selector: 'app-technical-activities-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, DatePipe],
  template: `
    <section class="section-stack">
      <article class="card" *ngIf="canCreate()">
        <header class="section-head compact">
          <h2>Nueva actividad técnica</h2>
          <p>Asignación de trabajo de campo para técnicos.</p>
        </header>

        <form class="form-grid grid-3" [formGroup]="createForm" (ngSubmit)="create()">
          <label>
            Tipo de actividad
            <select formControlName="tipoActividad">
              <option *ngFor="let item of tipoActividadOptions" [value]="item">{{ item }}</option>
            </select>
          </label>
          <label>
            Título
            <input type="text" formControlName="titulo" placeholder="Ej. Instalación en punto norte" />
          </label>
          <label>
            Prioridad
            <select formControlName="prioridad">
              <option *ngFor="let item of prioridadOptions" [value]="item">{{ item }}</option>
            </select>
          </label>
          <label>
            Técnico asignado
            <select formControlName="tecnicoAsignadoId">
              <option value="">Seleccione técnico</option>
              <option *ngFor="let user of technicians()" [value]="user.id">
                {{ user.nombres }} · {{ user.email }}
              </option>
            </select>
          </label>
          <label>
            Fecha programada
            <input type="date" formControlName="fechaProgramada" />
          </label>
          <label>
            Fecha límite (opcional)
            <input type="date" formControlName="fechaLimite" />
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
            Ubicación (opcional)
            <input type="text" formControlName="ubicacion" />
          </label>
          <label>
            Observaciones iniciales (opcional)
            <input type="text" formControlName="observacionesIniciales" />
          </label>
          <label class="full-row">
            Descripción
            <textarea rows="3" formControlName="descripcion"></textarea>
          </label>

          <button type="submit" class="btn btn-primary" [disabled]="loading()">
            Crear actividad técnica
          </button>
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
            Estado
            <select formControlName="estado">
              <option value="">Todos</option>
              <option *ngFor="let item of estadoOptions" [value]="item">{{ item }}</option>
            </select>
          </label>
          <label>
            Prioridad
            <select formControlName="prioridad">
              <option value="">Todas</option>
              <option *ngFor="let item of prioridadOptions" [value]="item">{{ item }}</option>
            </select>
          </label>
          <label *ngIf="canFilterByTechnician()">
            Técnico
            <select formControlName="tecnicoAsignadoId">
              <option value="">Todos</option>
              <option *ngFor="let user of technicians()" [value]="user.id">{{ user.nombres }}</option>
            </select>
          </label>
          <label *ngIf="canExportExcel()">
            Fecha desde
            <input type="date" formControlName="fechaDesde" />
          </label>
          <label *ngIf="canExportExcel()">
            Fecha hasta
            <input type="date" formControlName="fechaHasta" />
          </label>
          <div class="technical-filter-actions">
            <button type="submit" class="btn btn-secondary" [disabled]="loading()">Filtrar</button>
            <button
              *ngIf="canExportExcel()"
              type="button"
              class="icon-btn technical-excel-icon-btn"
              (click)="downloadExcel()"
              [disabled]="loading()"
              aria-label="Descargar Excel técnico"
              title="Descargar Excel técnico"
            >
              <span class="material-symbols-outlined" aria-hidden="true">table_view</span>
            </button>
          </div>
        </form>

        <p class="status ok" *ngIf="successMessage()">{{ successMessage() }}</p>
        <p class="status error" *ngIf="errorMessage()">{{ errorMessage() }}</p>

        <div class="table-wrap">
          <table class="mobile-card-table">
            <thead>
              <tr>
                <th>Título</th>
                <th>Tipo</th>
                <th>Estado</th>
                <th>Prioridad</th>
                <th>Técnico</th>
                <th>Programada</th>
                <th class="table-actions-col">Acciones</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let item of items()">
                <td data-label="Título">{{ item.titulo }}</td>
                <td data-label="Tipo">{{ item.tipoActividad }}</td>
                <td data-label="Estado">
                  <span class="pill" [attr.data-tech-state]="item.estado">{{ item.estado }}</span>
                </td>
                <td data-label="Prioridad">
                  <span class="pill" [attr.data-priority]="item.prioridad">{{ item.prioridad }}</span>
                </td>
                <td data-label="Técnico">{{ item.tecnicoAsignado?.nombres ?? '-' }}</td>
                <td data-label="Programada">{{ item.fechaProgramada | date: 'mediumDate' }}</td>
                <td data-label="Acciones" class="table-actions-col">
                  <a class="btn btn-secondary" [routerLink]="['/app/technical-activities', item.id]">
                    Ver detalle
                  </a>
                </td>
              </tr>
              <tr *ngIf="items().length === 0">
                <td colspan="7" class="muted">No hay actividades técnicas para los filtros actuales.</td>
              </tr>
            </tbody>
          </table>
        </div>

        <footer class="pagination" *ngIf="items().length > 0">
          <button type="button" class="btn btn-secondary" (click)="prevPage()" [disabled]="query.page === 1 || loading()">
            Anterior
          </button>
          <span>Página {{ query.page }} · Total {{ total() }}</span>
          <button type="button" class="btn btn-secondary" (click)="nextPage()" [disabled]="isLastPage() || loading()">
            Siguiente
          </button>
        </footer>
      </article>
    </section>
  `,
})
export class TechnicalActivitiesPageComponent implements OnInit {
  private readonly fb = inject(FormBuilder);

  readonly loading = signal(false);
  readonly items = signal<TechnicalActivity[]>([]);
  readonly total = signal(0);
  readonly errorMessage = signal('');
  readonly successMessage = signal('');

  readonly technicians = signal<Array<Pick<User, 'id' | 'nombres' | 'email' | 'rol'>>>([]);
  readonly chargingPoints = signal<ChargingPoint[]>([]);

  readonly tipoActividadOptions = Object.values(TipoActividadTecnica);
  readonly estadoOptions = Object.values(EstadoActividadTecnica);
  readonly prioridadOptions = Object.values(Prioridad);

  readonly filtersForm = this.fb.nonNullable.group({
    tipoActividad: [''],
    estado: [''],
    prioridad: [''],
    tecnicoAsignadoId: [''],
    fechaDesde: [''],
    fechaHasta: [''],
  });

  readonly createForm = this.fb.nonNullable.group({
    tipoActividad: [TipoActividadTecnica.INSTALACION, [Validators.required]],
    titulo: ['', [Validators.required]],
    descripcion: [''],
    prioridad: [Prioridad.MEDIA, [Validators.required]],
    tecnicoAsignadoId: ['', [Validators.required]],
    fechaProgramada: ['', [Validators.required]],
    fechaLimite: [''],
    chargingPointId: [''],
    ubicacion: [''],
    observacionesIniciales: [''],
  });

  query: TechnicalActivityQuery = {
    page: 1,
    limit: 10,
  };

  constructor(
    private readonly technicalApi: TechnicalActivitiesApiService,
    private readonly chargingPointsApi: ChargingPointsApiService,
    private readonly authService: AuthService,
  ) {
    enableAutoDismiss([this.errorMessage, this.successMessage]);
  }

  ngOnInit(): void {
    this.loadLookups();
    this.load();
  }

  canCreate(): boolean {
    return this.authService.hasAnyRole([
      RolUsuario.ADMINISTRADOR,
      RolUsuario.SUPERVISOR,
    ]);
  }

  canFilterByTechnician(): boolean {
    return !this.authService.hasRole(RolUsuario.TECNICO);
  }

  canExportExcel(): boolean {
    return this.authService.hasAnyRole([
      RolUsuario.ADMINISTRADOR,
      RolUsuario.SUPERVISOR,
    ]);
  }

  private isTechnician(): boolean {
    return this.authService.hasRole(RolUsuario.TECNICO);
  }

  loadLookups(): void {
    if (this.canCreate() || this.canFilterByTechnician()) {
      this.technicalApi.listAssignableTechnicians().subscribe({
        next: (users) => this.technicians.set(users),
      });
    }

    this.chargingPointsApi.listPrivate({ page: 1, limit: 100 }).subscribe({
      next: (response) => this.chargingPoints.set(response.items),
    });
  }

  load(resetPage = false): void {
    if (resetPage) {
      this.query.page = 1;
    }

    const filters = this.filtersForm.getRawValue();
    if (!this.validateDateRange(filters.fechaDesde, filters.fechaHasta)) {
      return;
    }

    this.query = {
      ...this.query,
      tipoActividad: filters.tipoActividad as TipoActividadTecnica | '',
      estado: filters.estado as EstadoActividadTecnica | '',
      prioridad: filters.prioridad as Prioridad | '',
      tecnicoAsignadoId: filters.tecnicoAsignadoId || undefined,
      fechaDesde: filters.fechaDesde || undefined,
      fechaHasta: filters.fechaHasta || undefined,
    };

    this.loading.set(true);
    this.errorMessage.set('');

    const request$ = this.isTechnician()
      ? this.technicalApi.listMine(this.query)
      : this.technicalApi.list(this.query);

    request$.pipe(finalize(() => this.loading.set(false))).subscribe({
      next: (response) => {
        this.items.set(response.items);
        this.total.set(response.total);
      },
      error: (error: HttpErrorResponse) => {
        this.errorMessage.set(
          error.error?.message ??
            'No fue posible cargar actividades técnicas.',
        );
      },
    });
  }

  create(): void {
    if (!this.canCreate()) {
      return;
    }

    if (this.createForm.invalid || this.loading()) {
      this.createForm.markAllAsTouched();
      return;
    }

    const raw = this.createForm.getRawValue();
    const payload = {
      ...raw,
      fechaLimite: raw.fechaLimite || undefined,
      chargingPointId: raw.chargingPointId || undefined,
      ubicacion: raw.ubicacion || undefined,
      observacionesIniciales: raw.observacionesIniciales || undefined,
    };

    this.loading.set(true);
    this.errorMessage.set('');
    this.successMessage.set('');

    this.technicalApi
      .create(payload)
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: () => {
          this.successMessage.set('Actividad técnica creada correctamente.');
          this.createForm.patchValue({
            titulo: '',
            descripcion: '',
            tecnicoAsignadoId: '',
            fechaProgramada: '',
            fechaLimite: '',
            chargingPointId: '',
            ubicacion: '',
            observacionesIniciales: '',
          });
          this.load(true);
        },
        error: (error: HttpErrorResponse) => {
          this.errorMessage.set(
            error.error?.message ??
              'No fue posible crear la actividad técnica.',
          );
        },
      });
  }

  downloadExcel(): void {
    if (!this.canExportExcel() || this.loading()) {
      return;
    }

    const filters = this.filtersForm.getRawValue();
    if (!this.validateDateRange(filters.fechaDesde, filters.fechaHasta)) {
      return;
    }

    this.loading.set(true);
    this.errorMessage.set('');
    this.successMessage.set('');

    this.technicalApi
      .downloadExcel({
        fechaDesde: filters.fechaDesde || undefined,
        fechaHasta: filters.fechaHasta || undefined,
      })
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (blob) => {
          this.saveBlobAsFile(
            blob,
            `technical-activities-${new Date().toISOString().slice(0, 10)}.xlsx`,
          );
          this.successMessage.set('Reporte Excel generado correctamente.');
        },
        error: (error: HttpErrorResponse) => {
          this.errorMessage.set(
            error.error?.message ?? 'No fue posible descargar el reporte Excel.',
          );
        },
      });
  }

  private validateDateRange(fechaDesde?: string, fechaHasta?: string): boolean {
    if (!fechaDesde || !fechaHasta) {
      return true;
    }

    const from = new Date(fechaDesde);
    const to = new Date(fechaHasta);

    if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime())) {
      this.errorMessage.set('El rango de fechas no es válido.');
      return false;
    }

    if (from.getTime() > to.getTime()) {
      this.errorMessage.set(
        'La fecha desde no puede ser mayor que la fecha hasta.',
      );
      return false;
    }

    return true;
  }

  private saveBlobAsFile(blob: Blob, fileName: string): void {
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = fileName;
    anchor.rel = 'noopener';
    anchor.style.display = 'none';
    document.body.appendChild(anchor);
    anchor.click();

    setTimeout(() => {
      URL.revokeObjectURL(url);
      anchor.remove();
    }, 15000);
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
