import { CommonModule, DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import {
  Component,
  OnDestroy,
  OnInit,
  inject,
  signal,
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { finalize } from 'rxjs';
import {
  ExtraActivity,
  ExtraActivityPriority,
  ExtraActivityStatus,
  ExtraActivityType,
  PaginationResponse,
  RolUsuario,
  User,
  WorkTimeCategory,
} from '../../core/models/domain.models';
import { AuthService } from '../../core/services/auth.service';
import { ExtraActivitiesApiService } from '../../core/services/extra-activities-api.service';
import { enableAutoDismiss } from '../../core/utils/auto-dismiss.util';

@Component({
  selector: 'app-extra-activities-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, DatePipe],
  styles: [
    `
      .extra-kpis {
        display: grid;
        gap: 1rem;
        grid-template-columns: repeat(auto-fit, minmax(16rem, 1fr));
      }

      .extra-kpi {
        border: 0.1rem solid var(--line);
        border-radius: 1.2rem;
        background: var(--surface-soft);
        padding: 1rem 1.2rem;
      }

      .extra-kpi strong {
        display: block;
        font-size: 2rem;
        margin-top: 0.3rem;
      }

      .extra-active-card {
        border: 0.1rem solid #bfdbfe;
        background: #eff6ff;
        border-radius: 1.2rem;
        padding: 1.6rem;
        display: grid;
        gap: 1.2rem;
      }

      .extra-active-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(22rem, 1fr));
        gap: 1.2rem;
      }

      .extra-active-item {
        display: grid;
        gap: 0.4rem;
      }

      .extra-active-label {
        font-size: 1.2rem;
        color: var(--text-soft);
        font-weight: 600;
      }

      .extra-active-value {
        font-size: 1.8rem;
        font-weight: 700;
        color: var(--text);
        line-height: 1.25;
      }

      .extra-timer {
        font-weight: 800;
        font-size: 2rem;
        color: #1d4ed8;
      }

      .extra-filter-actions {
        display: flex;
        align-items: flex-end;
        gap: 0.8rem;
      }

      .extra-filter-actions .btn {
        min-width: 10rem;
      }

      .extra-modal-backdrop {
        position: fixed;
        inset: 0;
        z-index: 1200;
        display: grid;
        place-items: center;
        padding: 1.6rem;
        background: rgba(15, 23, 42, 0.5);
      }

      .extra-modal {
        width: min(54rem, 100%);
        border: 0.1rem solid var(--line);
        border-radius: 1.6rem;
        background: #fff;
        box-shadow: 0 2.4rem 6rem rgba(15, 23, 42, 0.24);
        padding: 2rem;
        display: grid;
        gap: 1rem;
      }

      .extra-modal h3,
      .extra-modal p {
        margin: 0;
      }

      .extra-detail-modal {
        width: min(96rem, 100%);
        max-height: 86vh;
        overflow: auto;
      }

      .extra-modal-actions {
        display: flex;
        justify-content: flex-end;
        gap: 0.8rem;
      }

      .extra-row-title {
        font-weight: 600;
      }

      @media (max-width: 48rem) {
        .extra-filter-actions {
          flex-direction: row;
          width: 100%;
        }

        .extra-filter-actions .btn {
          flex: 1;
          min-width: 0;
        }

        .extra-modal {
          padding: 1.6rem;
        }

        .extra-active-grid {
          grid-template-columns: 1fr;
          gap: 1rem;
        }

        .extra-active-value {
          font-size: 1.6rem;
        }

        .extra-timer {
          font-size: 1.8rem;
        }

        .extra-modal-actions {
          flex-direction: column-reverse;
        }

        .extra-modal-actions .btn {
          width: 100%;
        }
      }
    `,
  ],
  template: `
    <section class="section-stack">
      <article class="card">
        <header class="section-head compact">
          <h2>Actividades Extraordinarias</h2>
          <p>
            Registro de QA, bugs, reuniones y actividades adicionales realizadas dentro o fuera del turno.
          </p>
        </header>

        <div class="extra-kpis">
          <div class="extra-kpi">
            <small>Horas hoy</small>
            <strong>{{ summaryMe().hoursToday | number: '1.0-2' }}</strong>
          </div>
          <div class="extra-kpi">
            <small>Horas del mes</small>
            <strong>{{ summaryMe().hoursMonth | number: '1.0-2' }}</strong>
          </div>
          <div class="extra-kpi">
            <small>Fuera de turno (mes)</small>
            <strong>{{ summaryMe().hoursOutsideShift | number: '1.0-2' }}</strong>
          </div>
          <div class="extra-kpi">
            <small>Finalizadas</small>
            <strong>{{ summaryMe().finishedCount }}</strong>
          </div>
        </div>

        <div class="extra-kpis" *ngIf="isAdmin()">
          <div class="extra-kpi">
            <small>Total horas mes (global)</small>
            <strong>{{ summaryGlobal().hoursMonth | number: '1.0-2' }}</strong>
          </div>
          <div class="extra-kpi">
            <small>Fuera de turno (global)</small>
            <strong>{{ summaryGlobal().hoursOutsideShift | number: '1.0-2' }}</strong>
          </div>
          <div class="extra-kpi">
            <small>Finalizadas (global)</small>
            <strong>{{ summaryGlobal().finishedCount }}</strong>
          </div>
          <div class="extra-kpi">
            <small>En progreso (global)</small>
            <strong>{{ summaryGlobal().inProgressCount }}</strong>
          </div>
        </div>

        <p class="status ok" *ngIf="successMessage()">{{ successMessage() }}</p>
        <p class="status error" *ngIf="errorMessage()">{{ errorMessage() }}</p>
      </article>

      <article class="card" *ngIf="activeActivity() as active">
        <header class="section-head compact">
          <h3>Actividad en progreso</h3>
          <p>Debes finalizar esta actividad para iniciar una nueva.</p>
        </header>

        <div class="extra-active-card">
          <div class="extra-active-grid">
            <div class="extra-active-item">
              <span class="extra-active-label">Título</span>
              <strong class="extra-active-value">{{ active.title }}</strong>
            </div>
            <div class="extra-active-item">
              <span class="extra-active-label">Tipo</span>
              <strong class="extra-active-value">{{ typeLabel(active.type) }}</strong>
            </div>
            <div class="extra-active-item">
              <span class="extra-active-label">Inicio</span>
              <strong class="extra-active-value">{{ active.startedAt | date: 'short' }}</strong>
            </div>
            <div class="extra-active-item">
              <span class="extra-active-label">Tiempo transcurrido</span>
              <strong class="extra-timer">{{ elapsedLabel() }}</strong>
            </div>
          </div>
          <div class="inline-actions">
            <button
              type="button"
              class="btn btn-danger"
              (click)="openFinishModal(active)"
              [disabled]="loading() || finishing()"
            >
              Finalizar actividad
            </button>
          </div>
        </div>
      </article>

      <article class="card" *ngIf="!activeActivity()">
        <header class="section-head compact">
          <h3>Nueva actividad extra</h3>
          <p>Inicia una actividad extraordinaria adicional a la operación normal.</p>
        </header>

        <form class="form-grid grid-3" [formGroup]="createForm" (ngSubmit)="startActivity()">
          <label>
            Tipo
            <select formControlName="type">
              <option *ngFor="let item of typeOptions" [value]="item">
                {{ typeLabel(item) }}
              </option>
            </select>
          </label>
          <label>
            Prioridad
            <select formControlName="priority">
              <option *ngFor="let item of priorityOptions" [value]="item">
                {{ priorityLabel(item) }}
              </option>
            </select>
          </label>
          <label>
            Jornada
            <select formControlName="workTimeCategory">
              <option *ngFor="let item of workTimeCategoryOptions" [value]="item">
                {{ workTimeCategoryLabel(item) }}
              </option>
            </select>
          </label>
          <label>
            Título
            <input type="text" formControlName="title" placeholder="Ej. QA módulo de notificaciones" />
          </label>
          <label>
            Módulo relacionado (opcional)
            <input type="text" formControlName="moduleName" />
          </label>
          <label>
            Referencia Azure DevOps (opcional)
            <input type="text" formControlName="externalReference" />
          </label>
          <label class="full-row">
            Descripción (opcional)
            <textarea rows="3" formControlName="description"></textarea>
          </label>

          <button type="submit" class="btn btn-primary" [disabled]="loading()">
            Iniciar actividad
          </button>
        </form>
      </article>

      <article class="card">
        <form [formGroup]="filtersForm" (ngSubmit)="loadList(true)" class="filter-bar">
          <label>
            Fecha desde
            <input type="date" formControlName="dateFrom" />
          </label>
          <label>
            Fecha hasta
            <input type="date" formControlName="dateTo" />
          </label>
          <label>
            Tipo
            <select formControlName="type">
              <option value="">Todos</option>
              <option *ngFor="let item of typeOptions" [value]="item">{{ typeLabel(item) }}</option>
            </select>
          </label>
          <label>
            Jornada
            <select formControlName="workTimeCategory">
              <option value="">Todas</option>
              <option *ngFor="let item of workTimeCategoryOptions" [value]="item">
                {{ workTimeCategoryLabel(item) }}
              </option>
            </select>
          </label>
          <label>
            Estado
            <select formControlName="status">
              <option value="">Todos</option>
              <option *ngFor="let item of statusOptions" [value]="item">
                {{ statusLabel(item) }}
              </option>
            </select>
          </label>
          <label>
            Prioridad
            <select formControlName="priority">
              <option value="">Todas</option>
              <option *ngFor="let item of priorityOptions" [value]="item">
                {{ priorityLabel(item) }}
              </option>
            </select>
          </label>
          <label *ngIf="isAdmin()">
            Analista
            <select formControlName="userId">
              <option value="">Todos</option>
              <option *ngFor="let user of analysts()" [value]="user.id">
                {{ user.nombres }} {{ user.apellidos ?? '' }} · {{ user.email }}
              </option>
            </select>
          </label>
          <label>
            Referencia
            <input type="text" formControlName="externalReference" />
          </label>
          <div class="extra-filter-actions">
            <button type="submit" class="btn btn-secondary" [disabled]="loading()">Filtrar</button>
            <button type="button" class="btn btn-secondary" (click)="downloadExcel()" [disabled]="loading()">
              Excel
            </button>
          </div>
        </form>

        <div class="table-wrap">
          <table class="mobile-card-table">
            <thead>
              <tr>
                <th *ngIf="isAdmin()">Analista</th>
                <th>Fecha</th>
                <th>Tipo</th>
                <th>Título</th>
                <th>Jornada</th>
                <th>Inicio</th>
                <th>Fin</th>
                <th>Duración</th>
                <th>Estado</th>
                <th class="table-actions-col">Acciones</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let item of items()">
                <td *ngIf="isAdmin()" data-label="Analista">
                  {{ item.user?.nombres }} {{ item.user?.apellidos ?? '' }}
                </td>
                <td data-label="Fecha">{{ item.startedAt | date: 'mediumDate' }}</td>
                <td data-label="Tipo">{{ typeLabel(item.type) }}</td>
                <td data-label="Título"><span class="extra-row-title">{{ item.title }}</span></td>
                <td data-label="Jornada">{{ workTimeCategoryLabel(item.workTimeCategory) }}</td>
                <td data-label="Inicio">{{ item.startedAt | date: 'short' }}</td>
                <td data-label="Fin">{{ item.endedAt ? (item.endedAt | date: 'short') : '---' }}</td>
                <td data-label="Duración">{{ item.durationMinutes ?? 0 }} min</td>
                <td data-label="Estado">
                  <span class="pill" [attr.data-tech-state]="statusToPill(item.status)">
                    {{ statusLabel(item.status) }}
                  </span>
                </td>
                <td data-label="Acciones" class="table-actions-col">
                  <div class="icon-actions wrap" role="group" aria-label="Acciones de actividad extra">
                    <button
                      type="button"
                      class="icon-btn"
                      (click)="selectForEdit(item)"
                      title="Ver detalle"
                      aria-label="Ver detalle"
                    >
                      <span class="material-symbols-outlined" aria-hidden="true">visibility</span>
                    </button>
                    <button
                      *ngIf="canCancel(item)"
                      type="button"
                      class="icon-btn"
                      (click)="cancelActivity(item)"
                      title="Cancelar"
                      aria-label="Cancelar"
                    >
                      <span class="material-symbols-outlined" aria-hidden="true">do_not_disturb_on</span>
                    </button>
                    <button
                      *ngIf="isAdmin()"
                      type="button"
                      class="icon-btn danger"
                      (click)="deleteActivity(item)"
                      title="Eliminar"
                      aria-label="Eliminar"
                    >
                      <span class="material-symbols-outlined" aria-hidden="true">delete</span>
                    </button>
                  </div>
                </td>
              </tr>
              <tr *ngIf="items().length === 0">
                <td [attr.colspan]="isAdmin() ? 10 : 9" class="muted">
                  No hay actividades extraordinarias para los filtros actuales.
                </td>
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

    <div
      *ngIf="finishModalOpen()"
      class="extra-modal-backdrop"
      (click)="closeFinishModal()"
    >
      <article
        class="extra-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="extra-finish-title"
        (click)="$event.stopPropagation()"
      >
        <h3 id="extra-finish-title">Finalizar actividad extraordinaria</h3>
        <p>
          Esta acción cerrará la actividad activa y calculará su duración automáticamente.
        </p>
        <label>
          Resultado / comentario final (opcional)
          <textarea rows="4" [formControl]="finishResultControl"></textarea>
        </label>
        <div class="extra-modal-actions">
          <button type="button" class="btn btn-secondary" (click)="closeFinishModal()" [disabled]="finishing()">
            Cancelar
          </button>
          <button type="button" class="btn btn-primary" (click)="confirmFinish()" [disabled]="finishing()">
            {{ finishing() ? 'Finalizando...' : 'Finalizar actividad' }}
          </button>
        </div>
      </article>
    </div>

    <div
      *ngIf="selectedActivity()"
      class="extra-modal-backdrop"
      (click)="clearSelection()"
    >
      <article
        class="extra-modal extra-detail-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="extra-detail-title"
        (click)="$event.stopPropagation()"
      >
        <h3 id="extra-detail-title">Detalle de actividad extra</h3>
        <p>Visualiza y actualiza datos permitidos del registro seleccionado.</p>

        <form class="form-grid grid-3" [formGroup]="editForm" (ngSubmit)="saveEdit()">
          <label>
            Tipo
            <select formControlName="type">
              <option *ngFor="let item of typeOptions" [value]="item">{{ typeLabel(item) }}</option>
            </select>
          </label>
          <label>
            Prioridad
            <select formControlName="priority">
              <option *ngFor="let item of priorityOptions" [value]="item">{{ priorityLabel(item) }}</option>
            </select>
          </label>
          <label>
            Jornada
            <select formControlName="workTimeCategory">
              <option *ngFor="let item of workTimeCategoryOptions" [value]="item">
                {{ workTimeCategoryLabel(item) }}
              </option>
            </select>
          </label>
          <label>
            Título
            <input type="text" formControlName="title" />
          </label>
          <label>
            Módulo relacionado (opcional)
            <input type="text" formControlName="moduleName" />
          </label>
          <label>
            Referencia Azure DevOps (opcional)
            <input type="text" formControlName="externalReference" />
          </label>
          <label class="full-row">
            Descripción (opcional)
            <textarea rows="3" formControlName="description"></textarea>
          </label>
          <label class="full-row">
            Resultado final (opcional)
            <textarea rows="3" formControlName="resultDescription"></textarea>
          </label>
          <div class="inline-actions">
            <button type="submit" class="btn btn-primary" [disabled]="loading()">Guardar cambios</button>
            <button type="button" class="btn btn-secondary" (click)="clearSelection()">Cerrar</button>
          </div>
        </form>
      </article>
    </div>
  `,
})
export class ExtraActivitiesPageComponent implements OnInit, OnDestroy {
  private readonly fb = inject(FormBuilder);

  readonly loading = signal(false);
  readonly finishing = signal(false);
  readonly errorMessage = signal('');
  readonly successMessage = signal('');

  readonly items = signal<ExtraActivity[]>([]);
  readonly total = signal(0);
  readonly analysts = signal<Array<Pick<User, 'id' | 'nombres' | 'apellidos' | 'email' | 'rol'>>>([]);
  readonly activeActivity = signal<ExtraActivity | null>(null);
  readonly selectedActivity = signal<ExtraActivity | null>(null);
  readonly finishModalOpen = signal(false);
  readonly finishTargetId = signal<string | null>(null);
  readonly elapsedLabel = signal('00:00:00');

  readonly summaryMe = signal({
    minutesToday: 0,
    hoursToday: 0,
    minutesMonth: 0,
    hoursMonth: 0,
    minutesOutsideShift: 0,
    hoursOutsideShift: 0,
    finishedCount: 0,
    activeActivity: null as ExtraActivity | null,
  });

  readonly summaryGlobal = signal({
    minutesMonth: 0,
    hoursMonth: 0,
    minutesOutsideShift: 0,
    hoursOutsideShift: 0,
    finishedCount: 0,
    inProgressCount: 0,
    byUser: [] as Array<{
      user: Pick<User, 'id' | 'nombres' | 'apellidos' | 'email'>;
      minutesMonth: number;
      hoursMonth: number;
      finishedCount: number;
    }>,
  });

  readonly typeOptions = Object.values(ExtraActivityType);
  readonly statusOptions = Object.values(ExtraActivityStatus);
  readonly priorityOptions = Object.values(ExtraActivityPriority);
  readonly workTimeCategoryOptions = Object.values(WorkTimeCategory);

  readonly createForm = this.fb.nonNullable.group({
    type: [ExtraActivityType.QA_FUNCTIONAL, [Validators.required]],
    title: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(180)]],
    description: [''],
    moduleName: [''],
    priority: [ExtraActivityPriority.MEDIUM, [Validators.required]],
    workTimeCategory: [WorkTimeCategory.DURING_SHIFT, [Validators.required]],
    externalReference: [''],
  });

  readonly filtersForm = this.fb.nonNullable.group({
    dateFrom: [''],
    dateTo: [''],
    type: [''],
    status: [''],
    workTimeCategory: [''],
    priority: [''],
    userId: [''],
    externalReference: [''],
  });

  readonly editForm = this.fb.nonNullable.group({
    type: [ExtraActivityType.QA_FUNCTIONAL, [Validators.required]],
    title: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(180)]],
    description: [''],
    moduleName: [''],
    priority: [ExtraActivityPriority.MEDIUM, [Validators.required]],
    workTimeCategory: [WorkTimeCategory.DURING_SHIFT, [Validators.required]],
    externalReference: [''],
    resultDescription: [''],
  });

  readonly finishResultControl = this.fb.nonNullable.control('');

  query: {
    page: number;
    limit: number;
    type?: ExtraActivityType | '';
    status?: ExtraActivityStatus | '';
    workTimeCategory?: WorkTimeCategory | '';
    priority?: ExtraActivityPriority | '';
    userId?: string;
    dateFrom?: string;
    dateTo?: string;
    externalReference?: string;
  } = {
    page: 1,
    limit: 10,
  };

  private elapsedTimer: ReturnType<typeof setInterval> | null = null;

  constructor(
    private readonly extraActivitiesApi: ExtraActivitiesApiService,
    private readonly authService: AuthService,
  ) {
    enableAutoDismiss([this.errorMessage, this.successMessage]);
  }

  ngOnInit(): void {
    if (this.isAdmin()) {
      this.loadAnalysts();
      this.loadSummaryGlobal();
    }
    this.loadSummaryMe();
    this.loadActive();
    this.loadList();
  }

  ngOnDestroy(): void {
    this.clearElapsedTimer();
  }

  isAdmin(): boolean {
    return this.authService.hasRole(RolUsuario.ADMINISTRADOR);
  }

  private canMutate(activity: ExtraActivity): boolean {
    if (this.isAdmin()) {
      return true;
    }
    return activity.userId === this.authService.currentUser()?.id;
  }

  canCancel(activity: ExtraActivity): boolean {
    return this.canMutate(activity) && activity.status === ExtraActivityStatus.IN_PROGRESS;
  }

  loadAnalysts(): void {
    this.extraActivitiesApi.listAnalysts().subscribe({
      next: (users) => this.analysts.set(users),
    });
  }

  loadSummaryMe(): void {
    this.extraActivitiesApi.summaryMe().subscribe({
      next: (summary) => this.summaryMe.set(summary),
      error: (error: HttpErrorResponse) => {
        this.errorMessage.set(
          error.error?.message ?? 'No fue posible cargar el resumen personal.',
        );
      },
    });
  }

  loadSummaryGlobal(): void {
    if (!this.isAdmin()) {
      return;
    }
    this.extraActivitiesApi.summaryGlobal().subscribe({
      next: (summary) => this.summaryGlobal.set(summary),
      error: (error: HttpErrorResponse) => {
        this.errorMessage.set(
          error.error?.message ?? 'No fue posible cargar el resumen global.',
        );
      },
    });
  }

  loadActive(): void {
    this.extraActivitiesApi.getMyActive().subscribe({
      next: (activity) => {
        this.activeActivity.set(activity);
        this.summaryMe.update((current) => ({
          ...current,
          activeActivity: activity,
        }));
        if (activity) {
          this.startElapsedTimer(activity.startedAt);
        } else {
          this.clearElapsedTimer();
          this.elapsedLabel.set('00:00:00');
        }
      },
      error: (error: HttpErrorResponse) => {
        this.errorMessage.set(
          error.error?.message ?? 'No fue posible consultar actividad activa.',
        );
      },
    });
  }

  private startElapsedTimer(startedAtIso: string): void {
    this.clearElapsedTimer();
    const startedAt = new Date(startedAtIso);
    const updateLabel = () => {
      const seconds = Math.max(0, Math.floor((Date.now() - startedAt.getTime()) / 1000));
      const hh = String(Math.floor(seconds / 3600)).padStart(2, '0');
      const mm = String(Math.floor((seconds % 3600) / 60)).padStart(2, '0');
      const ss = String(seconds % 60).padStart(2, '0');
      this.elapsedLabel.set(`${hh}:${mm}:${ss}`);
    };

    updateLabel();
    this.elapsedTimer = setInterval(updateLabel, 1000);
  }

  private clearElapsedTimer(): void {
    if (this.elapsedTimer) {
      clearInterval(this.elapsedTimer);
      this.elapsedTimer = null;
    }
  }

  loadList(resetPage = false): void {
    if (resetPage) {
      this.query.page = 1;
    }

    const filters = this.filtersForm.getRawValue();
    this.query = {
      ...this.query,
      type: (filters.type as ExtraActivityType | '') || undefined,
      status: (filters.status as ExtraActivityStatus | '') || undefined,
      workTimeCategory:
        (filters.workTimeCategory as WorkTimeCategory | '') || undefined,
      priority: (filters.priority as ExtraActivityPriority | '') || undefined,
      userId: filters.userId || undefined,
      dateFrom: filters.dateFrom || undefined,
      dateTo: filters.dateTo || undefined,
      externalReference: filters.externalReference || undefined,
    };

    this.loading.set(true);
    this.extraActivitiesApi
      .list(this.query)
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (response: PaginationResponse<ExtraActivity>) => {
          this.items.set(response.items);
          this.total.set(response.total);
        },
        error: (error: HttpErrorResponse) => {
          this.errorMessage.set(
            error.error?.message ??
              'No fue posible cargar actividades extraordinarias.',
          );
        },
      });
  }

  startActivity(): void {
    if (this.createForm.invalid || this.loading()) {
      this.createForm.markAllAsTouched();
      return;
    }

    const raw = this.createForm.getRawValue();
    this.loading.set(true);
    this.errorMessage.set('');
    this.successMessage.set('');

    this.extraActivitiesApi
      .start({
        type: raw.type,
        title: raw.title.trim(),
        description: raw.description.trim() || undefined,
        moduleName: raw.moduleName.trim() || undefined,
        priority: raw.priority,
        workTimeCategory: raw.workTimeCategory,
        externalReference: raw.externalReference.trim() || undefined,
      })
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: () => {
          this.successMessage.set('Actividad extraordinaria iniciada correctamente.');
          this.createForm.patchValue({
            title: '',
            description: '',
            moduleName: '',
            externalReference: '',
          });
          this.reloadAll();
        },
        error: (error: HttpErrorResponse) => {
          this.errorMessage.set(
            error.error?.message ??
              'No fue posible iniciar la actividad extraordinaria.',
          );
        },
      });
  }

  openFinishModal(activity: ExtraActivity): void {
    this.finishTargetId.set(activity.id);
    this.finishResultControl.setValue('');
    this.finishModalOpen.set(true);
  }

  closeFinishModal(): void {
    if (this.finishing()) {
      return;
    }
    this.finishModalOpen.set(false);
    this.finishTargetId.set(null);
    this.finishResultControl.setValue('');
  }

  confirmFinish(): void {
    const targetId = this.finishTargetId();
    if (!targetId || this.finishing()) {
      return;
    }

    this.finishing.set(true);
    this.loading.set(true);
    this.errorMessage.set('');
    this.successMessage.set('');

    this.extraActivitiesApi
      .finish(targetId, {
        resultDescription: this.finishResultControl.value.trim() || undefined,
      })
      .pipe(
        finalize(() => {
          this.finishing.set(false);
          this.loading.set(false);
        }),
      )
      .subscribe({
        next: () => {
          this.successMessage.set('Actividad extraordinaria finalizada correctamente.');
          this.finishing.set(false);
          this.closeFinishModal();
          this.reloadAll();
        },
        error: (error: HttpErrorResponse) => {
          this.errorMessage.set(
            error.error?.message ??
              'No fue posible finalizar la actividad extraordinaria.',
          );
        },
      });
  }

  cancelActivity(activity: ExtraActivity): void {
    if (!this.canCancel(activity) || this.loading()) {
      return;
    }

    this.loading.set(true);
    this.errorMessage.set('');
    this.successMessage.set('');

    this.extraActivitiesApi
      .cancel(activity.id, {})
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: () => {
          this.successMessage.set('Actividad extraordinaria cancelada.');
          this.reloadAll();
        },
        error: (error: HttpErrorResponse) => {
          this.errorMessage.set(
            error.error?.message ??
              'No fue posible cancelar la actividad extraordinaria.',
          );
        },
      });
  }

  deleteActivity(activity: ExtraActivity): void {
    if (!this.isAdmin() || this.loading()) {
      return;
    }

    const confirmed = window.confirm(
      `¿Seguro que deseas eliminar la actividad "${activity.title}"?`,
    );
    if (!confirmed) {
      return;
    }

    this.loading.set(true);
    this.errorMessage.set('');
    this.successMessage.set('');

    this.extraActivitiesApi
      .remove(activity.id)
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (response) => {
          this.successMessage.set(response.message);
          this.reloadAll();
        },
        error: (error: HttpErrorResponse) => {
          this.errorMessage.set(
            error.error?.message ??
              'No fue posible eliminar la actividad extraordinaria.',
          );
        },
      });
  }

  selectForEdit(activity: ExtraActivity): void {
    this.selectedActivity.set(activity);
    this.editForm.patchValue({
      type: activity.type,
      title: activity.title,
      description: activity.description ?? '',
      moduleName: activity.moduleName ?? '',
      priority: activity.priority,
      workTimeCategory: activity.workTimeCategory,
      externalReference: activity.externalReference ?? '',
      resultDescription: activity.resultDescription ?? '',
    });
  }

  clearSelection(): void {
    this.selectedActivity.set(null);
  }

  saveEdit(): void {
    const current = this.selectedActivity();
    if (!current || this.editForm.invalid || this.loading()) {
      this.editForm.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    this.errorMessage.set('');
    this.successMessage.set('');

    const raw = this.editForm.getRawValue();
    this.extraActivitiesApi
      .update(current.id, {
        type: raw.type,
        title: raw.title.trim(),
        description: raw.description.trim() || undefined,
        moduleName: raw.moduleName.trim() || undefined,
        priority: raw.priority,
        workTimeCategory: raw.workTimeCategory,
        externalReference: raw.externalReference.trim() || undefined,
        resultDescription: raw.resultDescription.trim() || undefined,
      })
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (updated) => {
          this.successMessage.set('Actividad extraordinaria actualizada correctamente.');
          this.selectedActivity.set(updated);
          this.reloadAll();
        },
        error: (error: HttpErrorResponse) => {
          this.errorMessage.set(
            error.error?.message ??
              'No fue posible actualizar la actividad extraordinaria.',
          );
        },
      });
  }

  downloadExcel(): void {
    if (this.loading()) {
      return;
    }

    this.loading.set(true);
    this.errorMessage.set('');
    this.successMessage.set('');

    this.extraActivitiesApi
      .downloadExcel(this.query)
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (blob) => {
          const date = new Date().toISOString().slice(0, 10);
          this.saveBlobAsFile(blob, `extra-activities-${date}.xlsx`);
          this.successMessage.set('Reporte Excel generado correctamente.');
        },
        error: (error: HttpErrorResponse) => {
          this.errorMessage.set(
            error.error?.message ??
              'No fue posible descargar el reporte Excel.',
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

  private reloadAll(): void {
    this.loadActive();
    this.loadList();
    this.loadSummaryMe();
    if (this.isAdmin()) {
      this.loadSummaryGlobal();
    }
  }

  typeLabel(value: ExtraActivityType): string {
    const labels: Record<ExtraActivityType, string> = {
      [ExtraActivityType.QA_FUNCTIONAL]: 'QA funcional',
      [ExtraActivityType.QA_UI]: 'QA visual / UI',
      [ExtraActivityType.BUG_REPORT]: 'Reporte de bug',
      [ExtraActivityType.BUG_FIX]: 'Corrección de bug',
      [ExtraActivityType.BUG_VALIDATION]: 'Validación de corrección',
      [ExtraActivityType.PRODUCTION_REVIEW]: 'Revisión en producción',
      [ExtraActivityType.OPERATIONAL_SUPPORT]: 'Soporte operativo',
      [ExtraActivityType.DOCUMENTATION]: 'Documentación',
      [ExtraActivityType.MEETING]: 'Reunión',
      [ExtraActivityType.TRAINING]: 'Capacitación',
      [ExtraActivityType.TECHNICAL_ANALYSIS]: 'Análisis técnico',
      [ExtraActivityType.EXTRA_MONITORING]: 'Monitoreo extraordinario',
      [ExtraActivityType.OTHER]: 'Otro',
    };

    return labels[value] ?? value;
  }

  workTimeCategoryLabel(value: WorkTimeCategory): string {
    const labels: Record<WorkTimeCategory, string> = {
      [WorkTimeCategory.DURING_SHIFT]: 'Dentro del turno',
      [WorkTimeCategory.OUTSIDE_SHIFT]: 'Fuera del turno',
      [WorkTimeCategory.WEEKEND_OR_HOLIDAY]: 'Fin de semana / feriado',
      [WorkTimeCategory.EMERGENCY]: 'Emergencia',
      [WorkTimeCategory.MIXED]: 'Mixto',
    };

    return labels[value] ?? value;
  }

  priorityLabel(value: ExtraActivityPriority): string {
    const labels: Record<ExtraActivityPriority, string> = {
      [ExtraActivityPriority.LOW]: 'Baja',
      [ExtraActivityPriority.MEDIUM]: 'Media',
      [ExtraActivityPriority.HIGH]: 'Alta',
      [ExtraActivityPriority.CRITICAL]: 'Crítica',
    };

    return labels[value] ?? value;
  }

  statusLabel(value: ExtraActivityStatus): string {
    const labels: Record<ExtraActivityStatus, string> = {
      [ExtraActivityStatus.IN_PROGRESS]: 'En progreso',
      [ExtraActivityStatus.FINISHED]: 'Finalizada',
      [ExtraActivityStatus.CANCELLED]: 'Cancelada',
    };
    return labels[value] ?? value;
  }

  statusToPill(value: ExtraActivityStatus): 'EN_PROCESO' | 'COMPLETADA' | 'OBSERVADA' {
    if (value === ExtraActivityStatus.FINISHED) {
      return 'COMPLETADA';
    }
    if (value === ExtraActivityStatus.CANCELLED) {
      return 'OBSERVADA';
    }
    return 'EN_PROCESO';
  }

  prevPage(): void {
    if ((this.query.page ?? 1) <= 1) return;
    this.query.page = (this.query.page ?? 1) - 1;
    this.loadList();
  }

  nextPage(): void {
    if (this.isLastPage()) return;
    this.query.page = (this.query.page ?? 1) + 1;
    this.loadList();
  }

  isLastPage(): boolean {
    const page = this.query.page ?? 1;
    const limit = this.query.limit ?? 10;
    return page * limit >= this.total();
  }
}
