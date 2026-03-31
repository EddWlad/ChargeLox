import { CommonModule, DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import {
  ChargingPoint,
  EstadoActividadTecnica,
  Prioridad,
  RolUsuario,
  TechnicalActivity,
  TechnicalActivityComment,
  TechnicalActivityEvidence,
  TechnicalActivityHistory,
  TipoActividadTecnica,
  User,
} from '../../core/models/domain.models';
import { AuthService } from '../../core/services/auth.service';
import { ChargingPointsApiService } from '../../core/services/charging-points-api.service';
import { TechnicalActivitiesApiService } from '../../core/services/technical-activities-api.service';
import { enableAutoDismiss } from '../../core/utils/auto-dismiss.util';

@Component({
  selector: 'app-technical-activity-detail-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, DatePipe],
  template: `
    <section class="section-stack">
      <article class="card" *ngIf="activity() as item">
        <header class="section-head">
          <h2>{{ item.titulo }}</h2>
          <p>
            {{ item.tipoActividad }} · {{ item.prioridad }} ·
            <span class="pill" [attr.data-tech-state]="item.estado">{{ item.estado }}</span>
          </p>
        </header>

        <div class="grid cards-2">
          <div class="info-block">
            <p><strong>Técnico:</strong> {{ item.tecnicoAsignado?.nombres ?? '-' }}</p>
            <p><strong>Supervisor:</strong> {{ item.supervisorAsignador?.nombres ?? '-' }}</p>
            <p><strong>Punto:</strong> {{ item.chargingPoint?.nombre ?? 'No asociado' }}</p>
            <p><strong>Programada:</strong> {{ item.fechaProgramada | date: 'mediumDate' }}</p>
            <p><strong>Límite:</strong> {{ item.fechaLimite ? (item.fechaLimite | date: 'mediumDate') : '-' }}</p>
            <p><strong>Descripción:</strong></p>
            <p class="activity-description-text">{{ item.descripcion }}</p>
          </div>

          <div class="info-block form-grid">
            <form [formGroup]="statusForm" (ngSubmit)="changeStatus()" class="form-grid" *ngIf="canChangeStatus()">
              <label>
                Cambiar estado
                <select formControlName="estado">
                  <option *ngFor="let value of estadoOptions" [value]="value">{{ value }}</option>
                </select>
              </label>
              <label>
                Observaciones ejecución (opcional)
                <input type="text" formControlName="observacionesEjecucion" />
              </label>
              <label>
                Observaciones cierre (opcional)
                <input type="text" formControlName="observacionesCierre" />
              </label>
              <button type="submit" class="btn btn-secondary" [disabled]="loading()">Actualizar estado</button>
            </form>

            <button
              type="button"
              class="btn btn-primary technical-pdf-btn"
              (click)="downloadPdf()"
              [disabled]="loading()"
            >
              Descargar PDF técnico
            </button>
          </div>
        </div>
      </article>

      <article class="card" *ngIf="canEditFields()">
        <header class="section-head compact">
          <h3>Actualizar datos técnicos</h3>
        </header>

        <form class="form-grid grid-3" [formGroup]="updateForm" (ngSubmit)="saveUpdate()">
          <ng-container *ngIf="canManageAssignment()">
            <label>
              Tipo
              <select formControlName="tipoActividad">
                <option *ngFor="let item of tipoActividadOptions" [value]="item">{{ item }}</option>
              </select>
            </label>
            <label>
              Título
              <input type="text" formControlName="titulo" />
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
                <option value="">Sin cambio</option>
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
              Fecha límite
              <input type="date" formControlName="fechaLimite" />
            </label>
            <label>
              Punto relacionado
              <select formControlName="chargingPointId">
                <option value="">Sin relación</option>
                <option *ngFor="let cp of chargingPoints()" [value]="cp.id">
                  {{ cp.nombre }} ({{ cp.codigoAsignado }})
                </option>
              </select>
            </label>
            <label>
              Ubicación
              <input type="text" formControlName="ubicacion" />
            </label>
            <label>
              Observaciones iniciales
              <input type="text" formControlName="observacionesIniciales" />
            </label>
            <label class="full-row">
              Descripción
              <textarea rows="2" formControlName="descripcion"></textarea>
            </label>
          </ng-container>

          <label>
            Fecha ejecución
            <input type="date" formControlName="fechaEjecucion" />
          </label>
          <label>
            Fecha instalación
            <input type="date" formControlName="fechaInstalacion" />
          </label>
          <label>
            Estado final
            <select formControlName="estadoFinal">
              <option value="">Sin definir</option>
              <option *ngFor="let item of estadoFinalOptions" [value]="item">{{ item }}</option>
            </select>
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
            Marca
            <input type="text" formControlName="marca" />
          </label>
          <label>
            Modelo
            <input type="text" formControlName="modelo" />
          </label>
          <label>
            Estado inicial
            <select formControlName="estadoInicial">
              <option value="">Sin definir</option>
              <option *ngFor="let item of estadoInicialOptions" [value]="item">{{ item }}</option>
            </select>
          </label>
          <label class="full-row">
            Características técnicas
            <textarea rows="2" formControlName="caracteristicasTecnicas"></textarea>
          </label>
          <label class="full-row">
            Diagnóstico
            <textarea rows="2" formControlName="diagnostico"></textarea>
          </label>
          <label class="full-row">
            Hallazgos
            <textarea rows="2" formControlName="hallazgos"></textarea>
          </label>
          <label class="full-row">
            Acciones realizadas
            <textarea rows="2" formControlName="accionesRealizadas"></textarea>
          </label>
          <label class="full-row">
            Componentes intervenidos
            <textarea rows="2" formControlName="componentesIntervenidos"></textarea>
          </label>
          <label class="full-row">
            Recomendaciones
            <textarea rows="2" formControlName="recomendaciones"></textarea>
          </label>
          <label class="full-row">
            Observaciones ejecución
            <textarea rows="2" formControlName="observacionesEjecucion"></textarea>
          </label>
          <label class="full-row">
            Observaciones cierre
            <textarea rows="2" formControlName="observacionesCierre"></textarea>
          </label>
          <button type="submit" class="btn btn-primary" [disabled]="loading()">Guardar cambios</button>
        </form>
      </article>

      <article class="card" *ngIf="canComment()">
        <header class="section-head compact">
          <h3>Comentarios</h3>
        </header>
        <form class="form-grid" [formGroup]="commentForm" (ngSubmit)="addComment()">
          <label class="full-row">
            Comentario
            <textarea rows="3" formControlName="comentario"></textarea>
          </label>
          <label *ngIf="canSetOptionalStatus()">
            Estado opcional
            <select formControlName="estadoNuevo">
              <option value="">Sin cambio</option>
              <option *ngFor="let item of estadoOptions" [value]="item">{{ item }}</option>
            </select>
          </label>
          <button type="submit" class="btn btn-primary" [disabled]="loading()">Publicar comentario</button>
        </form>
      </article>

      <article class="card">
        <header class="section-head compact">
          <h3>Historial de comentarios</h3>
        </header>
        <ul class="list-clean">
          <li *ngFor="let comment of comments()">
            <strong>{{ comment.nombreUsuario }}</strong>
            <p class="activity-comment-text">{{ comment.comentario }}</p>
            <small>
              {{ comment.createdAt | date: 'short' }}
              <span *ngIf="comment.estadoNuevo"> · Estado: {{ comment.estadoNuevo }}</span>
            </small>
          </li>
          <li *ngIf="comments().length === 0" class="muted">Sin comentarios registrados.</li>
        </ul>
      </article>

      <article class="card">
        <header class="section-head compact">
          <h3>Evidencias</h3>
          <label class="btn btn-secondary file-btn" *ngIf="canUploadEvidence()">
            Subir evidencia
            <input type="file" (change)="uploadEvidence($event)" />
          </label>
        </header>
        <ul class="list-clean">
          <li *ngFor="let evidence of evidences()" class="attachment-item">
            <div>
              <strong>{{ evidence.nombreOriginal }}</strong>
              <small>
                {{ evidence.mimeType }} · {{ formatSize(evidence.tamano) }} · {{ evidence.storageProvider }}
              </small>
            </div>
            <div class="inline-actions">
              <button type="button" class="btn btn-ghost" (click)="openEvidence(evidence)">Ver</button>
              <button type="button" class="btn btn-secondary" (click)="downloadEvidence(evidence)">
                Descargar
              </button>
            </div>
          </li>
          <li *ngIf="evidences().length === 0" class="muted">Sin evidencias registradas.</li>
        </ul>
      </article>

      <article class="card">
        <header class="section-head compact">
          <h3>Historial de cambios</h3>
        </header>
        <ul class="list-clean">
          <li *ngFor="let item of history()">
            <strong>{{ item.accion }}</strong>
            <p>{{ item.descripcion }}</p>
            <small>
              {{ item.createdAt | date: 'short' }}
              <span *ngIf="item.actorNombre"> · {{ item.actorNombre }}</span>
            </small>
          </li>
          <li *ngIf="history().length === 0" class="muted">Sin historial registrado.</li>
        </ul>
      </article>

      <p class="status ok" *ngIf="successMessage()">{{ successMessage() }}</p>
      <p class="status error" *ngIf="errorMessage()">{{ errorMessage() }}</p>
      <a routerLink="/app/technical-activities" class="btn btn-secondary">Volver al listado</a>
    </section>
  `,
})
export class TechnicalActivityDetailPageComponent implements OnInit {
  private readonly fb = inject(FormBuilder);

  readonly loading = signal(false);
  readonly errorMessage = signal('');
  readonly successMessage = signal('');

  readonly activity = signal<TechnicalActivity | null>(null);
  readonly comments = signal<TechnicalActivityComment[]>([]);
  readonly evidences = signal<TechnicalActivityEvidence[]>([]);
  readonly history = signal<TechnicalActivityHistory[]>([]);

  readonly technicians = signal<Array<Pick<User, 'id' | 'nombres' | 'email' | 'rol'>>>([]);
  readonly chargingPoints = signal<ChargingPoint[]>([]);

  readonly estadoOptions = Object.values(EstadoActividadTecnica);
  readonly prioridadOptions = Object.values(Prioridad);
  readonly tipoActividadOptions = Object.values(TipoActividadTecnica);
  readonly estadoFinalOptions = [
    'OPERATIVO - BLOQUEADO',
    'INOPERATIVO',
    'LIBRE',
  ];
  readonly estadoInicialOptions = ['INSTALANDO', 'OBRA CIVIL', 'OTRO'];

  readonly statusForm = this.fb.nonNullable.group({
    estado: [EstadoActividadTecnica.ASIGNADA, [Validators.required]],
    observacionesEjecucion: [''],
    observacionesCierre: [''],
  });

  readonly commentForm = this.fb.nonNullable.group({
    comentario: ['', [Validators.required]],
    estadoNuevo: [''],
  });

  readonly updateForm = this.fb.nonNullable.group({
    tipoActividad: [TipoActividadTecnica.INSTALACION, [Validators.required]],
    titulo: [''],
    descripcion: [''],
    prioridad: [Prioridad.MEDIA, [Validators.required]],
    tecnicoAsignadoId: [''],
    fechaProgramada: [''],
    fechaLimite: [''],
    chargingPointId: [''],
    ubicacion: [''],
    observacionesIniciales: [''],
    fechaEjecucion: [''],
    fechaInstalacion: [''],
    estadoFinal: [''],
    codigoAsignado: [''],
    serial: [''],
    puk: [''],
    marca: [''],
    modelo: [''],
    estadoInicial: [''],
    caracteristicasTecnicas: [''],
    diagnostico: [''],
    hallazgos: [''],
    accionesRealizadas: [''],
    componentesIntervenidos: [''],
    recomendaciones: [''],
    observacionesEjecucion: [''],
    observacionesCierre: [''],
  });

  private activityId = '';
  private autoObserveFromNotification = false;

  constructor(
    private readonly route: ActivatedRoute,
    private readonly technicalApi: TechnicalActivitiesApiService,
    private readonly chargingPointsApi: ChargingPointsApiService,
    private readonly authService: AuthService,
  ) {
    enableAutoDismiss([this.errorMessage, this.successMessage]);
  }

  ngOnInit(): void {
    this.activityId = this.route.snapshot.paramMap.get('id') ?? '';
    this.autoObserveFromNotification =
      this.route.snapshot.queryParamMap.get('autoObserve') === '1';

    if (!this.activityId) {
      this.errorMessage.set('ID de actividad técnica inválido.');
      return;
    }

    this.loadLookups();
    this.loadAll();
  }

  canManageAssignment(): boolean {
    return this.authService.hasAnyRole([
      RolUsuario.ADMINISTRADOR,
      RolUsuario.SUPERVISOR,
    ]);
  }

  canEditFields(): boolean {
    return this.authService.hasAnyRole([
      RolUsuario.ADMINISTRADOR,
      RolUsuario.SUPERVISOR,
      RolUsuario.TECNICO,
    ]);
  }

  canChangeStatus(): boolean {
    return this.canEditFields();
  }

  canComment(): boolean {
    return this.canEditFields();
  }

  canSetOptionalStatus(): boolean {
    return this.authService.hasAnyRole([
      RolUsuario.ADMINISTRADOR,
      RolUsuario.SUPERVISOR,
    ]);
  }

  canUploadEvidence(): boolean {
    return this.canEditFields();
  }

  loadLookups(): void {
    if (this.canManageAssignment()) {
      this.technicalApi.listAssignableTechnicians().subscribe({
        next: (users) => this.technicians.set(users),
      });
    }

    this.chargingPointsApi.listPrivate({ page: 1, limit: 100 }).subscribe({
      next: (response) => this.chargingPoints.set(response.items),
    });
  }

  loadAll(): void {
    this.loadActivity();
    this.loadComments();
    this.loadEvidences();
    this.loadHistory();
  }

  loadActivity(): void {
    this.loading.set(true);
    this.errorMessage.set('');

    this.technicalApi
      .getById(this.activityId)
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (activity) => {
          this.activity.set(activity);
          this.statusForm.patchValue({
            estado: activity.estado,
            observacionesEjecucion: activity.observacionesEjecucion ?? '',
            observacionesCierre: activity.observacionesCierre ?? '',
          });
          this.updateForm.patchValue({
            tipoActividad: activity.tipoActividad,
            titulo: activity.titulo,
            descripcion: activity.descripcion,
            prioridad: activity.prioridad,
            tecnicoAsignadoId: activity.tecnicoAsignadoId ?? '',
            fechaProgramada: activity.fechaProgramada ?? '',
            fechaLimite: activity.fechaLimite ?? '',
            chargingPointId: activity.chargingPointId ?? '',
            ubicacion: activity.ubicacion ?? '',
            observacionesIniciales: activity.observacionesIniciales ?? '',
            fechaEjecucion: activity.fechaEjecucion ?? '',
            fechaInstalacion: activity.fechaInstalacion ?? '',
            estadoFinal: activity.estadoFinal ?? '',
            codigoAsignado: activity.codigoAsignado ?? '',
            serial: activity.serial ?? '',
            puk: activity.puk ?? '',
            marca: activity.marca ?? '',
            modelo: activity.modelo ?? '',
            estadoInicial: activity.estadoInicial ?? '',
            caracteristicasTecnicas: activity.caracteristicasTecnicas ?? '',
            diagnostico: activity.diagnostico ?? '',
            hallazgos: activity.hallazgos ?? '',
            accionesRealizadas: activity.accionesRealizadas ?? '',
            componentesIntervenidos: activity.componentesIntervenidos ?? '',
            recomendaciones: activity.recomendaciones ?? '',
            observacionesEjecucion: activity.observacionesEjecucion ?? '',
            observacionesCierre: activity.observacionesCierre ?? '',
          });

          if (
            this.autoObserveFromNotification &&
            this.authService.hasRole(RolUsuario.TECNICO) &&
            activity.estado === EstadoActividadTecnica.ASIGNADA
          ) {
            this.autoObserveFromNotification = false;
            this.autoMarkAsObserved();
          }
        },
        error: (error: HttpErrorResponse) => {
          this.errorMessage.set(
            error.error?.message ??
              'No fue posible cargar la actividad técnica.',
          );
        },
      });
  }

  loadComments(): void {
    this.technicalApi.listComments(this.activityId).subscribe({
      next: (comments) => this.comments.set(comments),
      error: (error: HttpErrorResponse) => {
        this.errorMessage.set(
          error.error?.message ?? 'No fue posible cargar comentarios.',
        );
      },
    });
  }

  loadEvidences(): void {
    this.technicalApi.listEvidences(this.activityId).subscribe({
      next: (evidences) => this.evidences.set(evidences),
      error: (error: HttpErrorResponse) => {
        this.errorMessage.set(
          error.error?.message ?? 'No fue posible cargar evidencias.',
        );
      },
    });
  }

  loadHistory(): void {
    this.technicalApi.listHistory(this.activityId).subscribe({
      next: (history) => this.history.set(history),
      error: (error: HttpErrorResponse) => {
        this.errorMessage.set(
          error.error?.message ?? 'No fue posible cargar historial.',
        );
      },
    });
  }

  changeStatus(): void {
    if (this.statusForm.invalid || this.loading()) {
      return;
    }

    const raw = this.statusForm.getRawValue();
    const payload = {
      estado: raw.estado,
      observacionesEjecucion: raw.observacionesEjecucion || undefined,
      observacionesCierre: raw.observacionesCierre || undefined,
    };

    this.loading.set(true);
    this.errorMessage.set('');
    this.successMessage.set('');

    this.technicalApi
      .changeStatus(this.activityId, payload)
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: () => {
          this.successMessage.set('Estado actualizado correctamente.');
          this.loadAll();
        },
        error: (error: HttpErrorResponse) => {
          this.errorMessage.set(
            error.error?.message ?? 'No fue posible actualizar el estado.',
          );
        },
      });
  }

  saveUpdate(): void {
    if (!this.canEditFields() || this.loading()) {
      return;
    }

    const raw = this.updateForm.getRawValue();
    const payload = this.canManageAssignment()
      ? {
          tipoActividad: raw.tipoActividad,
          titulo: raw.titulo || undefined,
          descripcion: raw.descripcion || undefined,
          prioridad: raw.prioridad,
          tecnicoAsignadoId: raw.tecnicoAsignadoId || undefined,
          fechaProgramada: raw.fechaProgramada || undefined,
          fechaLimite: raw.fechaLimite || undefined,
          chargingPointId: raw.chargingPointId || undefined,
          ubicacion: raw.ubicacion || undefined,
          observacionesIniciales: raw.observacionesIniciales || undefined,
          fechaEjecucion: raw.fechaEjecucion || undefined,
          fechaInstalacion: raw.fechaInstalacion || undefined,
          estadoFinal: raw.estadoFinal || undefined,
          codigoAsignado: raw.codigoAsignado || undefined,
          serial: raw.serial || undefined,
          puk: raw.puk || undefined,
          marca: raw.marca || undefined,
          modelo: raw.modelo || undefined,
          estadoInicial: raw.estadoInicial || undefined,
          caracteristicasTecnicas: raw.caracteristicasTecnicas || undefined,
          diagnostico: raw.diagnostico || undefined,
          hallazgos: raw.hallazgos || undefined,
          accionesRealizadas: raw.accionesRealizadas || undefined,
          componentesIntervenidos: raw.componentesIntervenidos || undefined,
          recomendaciones: raw.recomendaciones || undefined,
          observacionesEjecucion: raw.observacionesEjecucion || undefined,
          observacionesCierre: raw.observacionesCierre || undefined,
        }
      : {
          fechaEjecucion: raw.fechaEjecucion || undefined,
          fechaInstalacion: raw.fechaInstalacion || undefined,
          estadoFinal: raw.estadoFinal || undefined,
          codigoAsignado: raw.codigoAsignado || undefined,
          serial: raw.serial || undefined,
          puk: raw.puk || undefined,
          marca: raw.marca || undefined,
          modelo: raw.modelo || undefined,
          estadoInicial: raw.estadoInicial || undefined,
          caracteristicasTecnicas: raw.caracteristicasTecnicas || undefined,
          diagnostico: raw.diagnostico || undefined,
          hallazgos: raw.hallazgos || undefined,
          accionesRealizadas: raw.accionesRealizadas || undefined,
          componentesIntervenidos: raw.componentesIntervenidos || undefined,
          recomendaciones: raw.recomendaciones || undefined,
          observacionesEjecucion: raw.observacionesEjecucion || undefined,
          observacionesCierre: raw.observacionesCierre || undefined,
        };

    this.loading.set(true);
    this.errorMessage.set('');
    this.successMessage.set('');

    this.technicalApi
      .update(this.activityId, payload)
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: () => {
          this.successMessage.set('Datos técnicos actualizados.');
          this.loadAll();
        },
        error: (error: HttpErrorResponse) => {
          this.errorMessage.set(
            error.error?.message ??
              'No fue posible actualizar los datos técnicos.',
          );
        },
      });
  }

  addComment(): void {
    if (this.commentForm.invalid || this.loading()) {
      this.commentForm.markAllAsTouched();
      return;
    }

    const raw = this.commentForm.getRawValue();
    const payload = {
      comentario: raw.comentario,
      estadoNuevo: this.canSetOptionalStatus()
        ? ((raw.estadoNuevo || undefined) as EstadoActividadTecnica | undefined)
        : undefined,
    };

    this.loading.set(true);
    this.errorMessage.set('');
    this.successMessage.set('');

    this.technicalApi
      .addComment(this.activityId, payload)
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: () => {
          this.successMessage.set('Comentario registrado.');
          this.commentForm.patchValue({ comentario: '', estadoNuevo: '' });
          this.loadAll();
        },
        error: (error: HttpErrorResponse) => {
          this.errorMessage.set(
            error.error?.message ?? 'No fue posible registrar comentario.',
          );
        },
      });
  }

  uploadEvidence(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file || this.loading()) {
      return;
    }

    this.loading.set(true);
    this.errorMessage.set('');
    this.successMessage.set('');

    this.technicalApi
      .uploadEvidence(this.activityId, file)
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: () => {
          this.successMessage.set('Evidencia subida correctamente.');
          this.loadEvidences();
        },
        error: (error: HttpErrorResponse) => {
          this.errorMessage.set(
            error.error?.message ?? 'No fue posible subir la evidencia.',
          );
        },
      });
  }

  openEvidence(evidence: TechnicalActivityEvidence): void {
    if (evidence.cloudinaryUrl) {
      window.open(evidence.cloudinaryUrl, '_blank', 'noopener');
      return;
    }
    this.downloadEvidence(evidence);
  }

  downloadEvidence(evidence: TechnicalActivityEvidence): void {
    this.technicalApi.downloadEvidence(evidence.id).subscribe({
      next: (blob) => {
        const url = URL.createObjectURL(blob);
        window.open(url, '_blank', 'noopener');
        setTimeout(() => URL.revokeObjectURL(url), 5000);
      },
      error: (error: HttpErrorResponse) => {
        this.errorMessage.set(
          error.error?.message ?? 'No fue posible descargar evidencia.',
        );
      },
    });
  }

  downloadPdf(): void {
    this.technicalApi.downloadPdf(this.activityId).subscribe({
      next: (blob) => {
        const title = this.activity()?.titulo ?? 'actividad-tecnica';
        const safeTitle = title
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .replace(/[^a-zA-Z0-9-_ ]/g, '')
          .trim()
          .replace(/\s+/g, '-')
          .toLowerCase();

        this.saveBlobAsFile(
          blob,
          `reporte-tecnico-${safeTitle || 'actividad-tecnica'}.pdf`,
        );
      },
      error: (error: HttpErrorResponse) => {
        this.errorMessage.set(
          error.error?.message ?? 'No fue posible descargar el PDF técnico.',
        );
      },
    });
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

  private autoMarkAsObserved(): void {
    this.loading.set(true);
    this.errorMessage.set('');

    this.technicalApi
      .changeStatus(this.activityId, { estado: EstadoActividadTecnica.OBSERVADA })
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: () => {
          this.successMessage.set('Actividad marcada automáticamente como OBSERVADA.');
          this.loadAll();
        },
        error: (error: HttpErrorResponse) => {
          this.errorMessage.set(
            error.error?.message ??
              'No fue posible actualizar el estado inicial de la actividad.',
          );
        },
      });
  }

  formatSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }
}
