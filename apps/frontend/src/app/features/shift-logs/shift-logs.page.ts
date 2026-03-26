import { CommonModule, DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { finalize } from 'rxjs';
import { RolUsuario, ShiftLog, User } from '../../core/models/domain.models';
import { AuthService } from '../../core/services/auth.service';
import { ShiftLogsApiService } from '../../core/services/shift-logs-api.service';
import { UsersApiService } from '../../core/services/users-api.service';

import { enableAutoDismiss } from '../../core/utils/auto-dismiss.util';

@Component({
  selector: 'app-shift-logs-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, DatePipe],
  template: `
    <section class="section-stack">
      <article class="card">
        <header class="section-head compact">
          <h2>Control de turno</h2>
          <p>Inicia/finaliza jornada y descarga tu historial en PDF.</p>
        </header>

        <div class="inline-actions">
          <button type="button" class="btn btn-primary" (click)="start()" [disabled]="loading() || hasOpenShift()">
            Iniciar turno
          </button>
          <button type="button" class="btn btn-danger" (click)="finish()" [disabled]="loading() || !hasOpenShift()">
            Finalizar turno
          </button>
          <button type="button" class="btn btn-secondary" (click)="downloadMinePdf()" [disabled]="loading()">
            Descargar PDF de mis turnos
          </button>
        </div>

        <p class="status ok" *ngIf="successMessage()">{{ successMessage() }}</p>
        <p class="status error" *ngIf="errorMessage()">{{ errorMessage() }}</p>
      </article>

      <article class="card">
        <header class="section-head compact">
          <h3>Historial propio</h3>
        </header>

        <div class="table-wrap">
          <table class="mobile-card-table">
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Inicio</th>
                <th>Fin</th>
                <th>Estado</th>
                <th>Total horas</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let item of mine()">
                <td data-label="Fecha">{{ item.fechaTurno }}</td>
                <td data-label="Inicio">{{ item.horaInicio | date: 'short' }}</td>
                <td data-label="Fin">{{ item.horaFin ? (item.horaFin | date: 'short') : '---' }}</td>
                <td data-label="Estado">
                  <span class="pill" [attr.data-shift]="item.estadoTurno">{{ item.estadoTurno }}</span>
                </td>
                <td data-label="Total horas">{{ item.totalHoras ?? '---' }}</td>
              </tr>
              <tr *ngIf="mine().length === 0">
                <td colspan="5" class="muted">No hay turnos registrados.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </article>

      <article class="card" *ngIf="isAdmin()">
        <header class="section-head compact">
          <h3>Historial global (admin)</h3>
        </header>

        <form [formGroup]="adminFilterForm" (ngSubmit)="loadAll()" class="filter-bar">
          <label>
            Usuario
            <select formControlName="usuarioId">
              <option value="">Todos</option>
              <option *ngFor="let user of users()" [value]="user.id">{{ user.nombres }} · {{ user.email }}</option>
            </select>
          </label>
          <button type="submit" class="btn btn-secondary" [disabled]="loading()">Filtrar</button>
        </form>

        <div class="table-wrap">
          <table class="mobile-card-table">
            <thead>
              <tr>
                <th>Usuario</th>
                <th>Fecha</th>
                <th>Inicio</th>
                <th>Fin</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let item of all()">
                <td data-label="Usuario">{{ userLabel(item.usuarioId) }}</td>
                <td data-label="Fecha">{{ item.fechaTurno }}</td>
                <td data-label="Inicio">{{ item.horaInicio | date: 'short' }}</td>
                <td data-label="Fin">{{ item.horaFin ? (item.horaFin | date: 'short') : '---' }}</td>
                <td data-label="Estado">
                  <span class="pill" [attr.data-shift]="item.estadoTurno">{{ item.estadoTurno }}</span>
                </td>
              </tr>
              <tr *ngIf="all().length === 0">
                <td colspan="5" class="muted">No hay resultados.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </article>
    </section>
  `,
})
export class ShiftLogsPageComponent implements OnInit {
  private readonly fb = inject(FormBuilder);

  readonly loading = signal(false);
  readonly errorMessage = signal('');
  readonly successMessage = signal('');

  readonly mine = signal<ShiftLog[]>([]);
  readonly all = signal<ShiftLog[]>([]);
  readonly users = signal<User[]>([]);

  readonly adminFilterForm = this.fb.nonNullable.group({
    usuarioId: [''],
  });

  constructor(
    private readonly shiftLogsApi: ShiftLogsApiService,
    private readonly usersApi: UsersApiService,
    private readonly authService: AuthService,
  ) {
    enableAutoDismiss([this.errorMessage, this.successMessage]);
  }

  ngOnInit(): void {
    this.loadMine();

    if (this.isAdmin()) {
      this.loadUsers();
      this.loadAll();
    }
  }

  isAdmin(): boolean {
    return this.authService.currentUser()?.rol === RolUsuario.ADMINISTRADOR;
  }

  hasOpenShift(): boolean {
    return this.mine().some((item) => item.estadoTurno === 'ABIERTO');
  }

  userLabel(userId: string): string {
    const user = this.users().find((item) => item.id === userId);
    if (!user) {
      return `Usuario ${userId.slice(0, 8)}...`;
    }

    return `${user.nombres}${user.apellidos ? ` ${user.apellidos}` : ''}`;
  }

  loadUsers(): void {
    this.usersApi.list({ page: 1, limit: 100 }).subscribe({
      next: (response) => this.users.set(response.items),
    });
  }

  loadMine(): void {
    this.shiftLogsApi.listMine({ page: 1, limit: 50 }).subscribe({
      next: (response) => this.mine.set(response.items),
      error: (error: HttpErrorResponse) => {
        this.errorMessage.set(error.error?.message ?? 'No fue posible cargar historial propio.');
      },
    });
  }

  loadAll(): void {
    if (!this.isAdmin()) {
      return;
    }

    const usuarioId = this.adminFilterForm.getRawValue().usuarioId.trim();

    this.shiftLogsApi
      .listAll({ page: 1, limit: 50, usuarioId: usuarioId || undefined })
      .subscribe({
        next: (response) => this.all.set(response.items),
        error: (error: HttpErrorResponse) => {
          this.errorMessage.set(error.error?.message ?? 'No fue posible cargar historial global.');
        },
      });
  }

  start(): void {
    this.loading.set(true);
    this.errorMessage.set('');
    this.successMessage.set('');

    this.shiftLogsApi
      .startShift()
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: () => {
          this.successMessage.set('Turno iniciado correctamente.');
          this.loadMine();
          if (this.isAdmin()) {
            this.loadAll();
          }
        },
        error: (error: HttpErrorResponse) => {
          this.errorMessage.set(error.error?.message ?? 'No fue posible iniciar turno.');
        },
      });
  }

  finish(): void {
    this.loading.set(true);
    this.errorMessage.set('');
    this.successMessage.set('');

    this.shiftLogsApi
      .finishShift()
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: () => {
          this.successMessage.set('Turno finalizado correctamente.');
          this.loadMine();
          if (this.isAdmin()) {
            this.loadAll();
          }
        },
        error: (error: HttpErrorResponse) => {
          this.errorMessage.set(error.error?.message ?? 'No fue posible finalizar turno.');
        },
      });
  }

  downloadMinePdf(): void {
    this.loading.set(true);

    this.shiftLogsApi
      .downloadMinePdf()
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (blob) => {
          const url = URL.createObjectURL(blob);
          window.open(url, '_blank', 'noopener');
          setTimeout(() => URL.revokeObjectURL(url), 5000);
        },
        error: (error: HttpErrorResponse) => {
          this.errorMessage.set(error.error?.message ?? 'No fue posible descargar el PDF.');
        },
      });
  }
}

