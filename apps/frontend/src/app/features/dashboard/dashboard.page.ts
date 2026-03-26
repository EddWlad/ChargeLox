import { CommonModule, DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, computed, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { Activity, EstadoTurno, Notification, RolUsuario, ShiftLog } from '../../core/models/domain.models';
import { ActivitiesApiService } from '../../core/services/activities-api.service';
import { AuthService } from '../../core/services/auth.service';
import { NotificationsApiService } from '../../core/services/notifications-api.service';
import { ShiftLogsApiService } from '../../core/services/shift-logs-api.service';

import { enableAutoDismiss } from '../../core/utils/auto-dismiss.util';

@Component({
  selector: 'app-dashboard-page',
  standalone: true,
  imports: [CommonModule, RouterLink, DatePipe],
  template: `
    <section class="section-stack">
      <article class="card dashboard-turno" *ngIf="canViewShiftModule()">
        <div>
          <h2>Estado del turno</h2>
          <p *ngIf="activeShift(); else noShift">
            Turno activo iniciado {{ activeShift()?.horaInicio | date: 'short' }}
          </p>
          <ng-template #noShift>
            <p>No hay turno abierto actualmente.</p>
          </ng-template>
        </div>

        <div class="inline-actions">
          <button type="button" class="btn btn-secondary" (click)="startShift()" [disabled]="loadingShift() || !!activeShift()">
            Iniciar turno
          </button>
          <button type="button" class="btn btn-danger" (click)="finishShift()" [disabled]="loadingShift() || !activeShift()">
            Finalizar turno
          </button>
        </div>
      </article>

      <p class="status error" *ngIf="errorMessage()">{{ errorMessage() }}</p>

      <section class="grid cards-2">
        <article class="card" *ngIf="canViewActivitiesModule()">
          <header class="section-head compact">
            <h3>Actividades Prioritarias</h3>
            <a routerLink="/app/activities">Ver todas</a>
          </header>

          <ul class="list-clean">
            <li *ngFor="let item of prioritarias()">
              <strong>{{ item.tipoActividad }}</strong>
              <p>{{ item.descripcion }}</p>
              <small>{{ item.estado }} · {{ item.prioridad }}</small>
            </li>
            <li *ngIf="prioritarias().length === 0" class="muted">No hay actividades prioritarias.</li>
          </ul>
        </article>

        <article class="card">
          <header class="section-head compact">
            <h3>Notificaciones Recientes</h3>
            <a routerLink="/app/notifications">Ir a notificaciones</a>
          </header>

          <ul class="list-clean">
            <li *ngFor="let notification of notifications()">
              <strong>{{ notification.titulo }}</strong>
              <p>{{ notification.mensaje }}</p>
              <small>{{ notification.createdAt | date: 'short' }}</small>
            </li>
            <li *ngIf="notifications().length === 0" class="muted">No hay notificaciones recientes.</li>
          </ul>
        </article>
      </section>
    </section>
  `,
})
export class DashboardPageComponent implements OnInit {
  readonly prioritarias = signal<Activity[]>([]);
  readonly notifications = signal<Notification[]>([]);
  readonly shiftLogs = signal<ShiftLog[]>([]);
  readonly loadingShift = signal(false);
  readonly errorMessage = signal('');

  readonly activeShift = computed(() =>
    this.shiftLogs().find((shift) => shift.estadoTurno === EstadoTurno.ABIERTO) ?? null,
  );

  constructor(
    private readonly activitiesApi: ActivitiesApiService,
    private readonly notificationsApi: NotificationsApiService,
    private readonly shiftLogsApi: ShiftLogsApiService,
    private readonly authService: AuthService,
  ) {
    enableAutoDismiss([this.errorMessage]);
  }

  ngOnInit(): void {
    this.loadDashboard();
  }

  loadDashboard(): void {
    this.errorMessage.set('');

    if (this.canViewActivitiesModule()) {
      this.activitiesApi.listPrioritarias().subscribe({
        next: (items) => this.prioritarias.set(items.slice(0, 4)),
        error: (error: HttpErrorResponse) => {
          this.errorMessage.set(error.error?.message ?? 'No fue posible cargar actividades prioritarias.');
        },
      });
    } else {
      this.prioritarias.set([]);
    }

    this.notificationsApi.listMine({ page: 1, limit: 4 }).subscribe({
      next: (response) => this.notifications.set(response.items),
      error: (error: HttpErrorResponse) => {
        this.errorMessage.set(error.error?.message ?? 'No fue posible cargar notificaciones.');
      },
    });

    if (this.canViewShiftModule()) {
      this.shiftLogsApi.listMine({ page: 1, limit: 20 }).subscribe({
        next: (response) => this.shiftLogs.set(response.items),
        error: (error: HttpErrorResponse) => {
          this.errorMessage.set(error.error?.message ?? 'No fue posible cargar turnos.');
        },
      });
    } else {
      this.shiftLogs.set([]);
    }
  }

  startShift(): void {
    if (!this.canViewShiftModule()) {
      return;
    }

    this.loadingShift.set(true);
    this.errorMessage.set('');

    this.shiftLogsApi
      .startShift()
      .pipe(finalize(() => this.loadingShift.set(false)))
      .subscribe({
        next: () => this.loadDashboard(),
        error: (error: HttpErrorResponse) => {
          this.errorMessage.set(error.error?.message ?? 'No fue posible iniciar turno.');
        },
      });
  }

  finishShift(): void {
    if (!this.canViewShiftModule()) {
      return;
    }

    this.loadingShift.set(true);
    this.errorMessage.set('');

    this.shiftLogsApi
      .finishShift()
      .pipe(finalize(() => this.loadingShift.set(false)))
      .subscribe({
        next: () => this.loadDashboard(),
        error: (error: HttpErrorResponse) => {
          this.errorMessage.set(error.error?.message ?? 'No fue posible finalizar turno.');
        },
      });
  }

  canViewActivitiesModule(): boolean {
    return this.authService.hasAnyRole([
      RolUsuario.ADMINISTRADOR,
      RolUsuario.ANALISTA,
    ]);
  }

  canViewShiftModule(): boolean {
    return this.authService.hasAnyRole([
      RolUsuario.ADMINISTRADOR,
      RolUsuario.ANALISTA,
    ]);
  }
}

