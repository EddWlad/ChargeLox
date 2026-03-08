import { CommonModule, DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { finalize } from 'rxjs';
import { AccionAuditoria, AuditLog } from '../../core/models/domain.models';
import { AuditLogsApiService } from '../../core/services/audit-logs-api.service';

import { enableAutoDismiss } from '../../core/utils/auto-dismiss.util';

@Component({
  selector: 'app-audit-logs-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, DatePipe],
  template: `
    <section class="section-stack">
      <article class="card">
        <header class="section-head compact">
          <h2>Log de auditoría</h2>
          <p>Trazabilidad de acciones CREATE/UPDATE/DELETE.</p>
        </header>

        <form [formGroup]="filtersForm" (ngSubmit)="load()" class="filter-bar">
          <label>
            Entidad
            <input type="text" formControlName="entidad" placeholder="User, ChargingPoint, Activity..." />
          </label>
          <label>
            Acción
            <select formControlName="accion">
              <option value="">Todas</option>
              <option *ngFor="let action of acciones" [value]="action">{{ action }}</option>
            </select>
          </label>
          <button type="submit" class="btn btn-secondary" [disabled]="loading()">Filtrar</button>
        </form>

        <p class="status error" *ngIf="errorMessage()">{{ errorMessage() }}</p>

        <div class="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Usuario</th>
                <th>Acción</th>
                <th>Entidad</th>
                <th>Referencia</th>
                <th>Resumen</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let item of items()">
                <td>{{ item.createdAt | date: 'short' }}</td>
                <td>{{ item.usuarioEmail ?? 'Sistema' }}</td>
                <td>
                  <span class="pill" [attr.data-action]="item.accion">{{ item.accion }}</span>
                </td>
                <td>{{ item.entidad }}</td>
                <td class="entity-ref-cell" [title]="item.entidadId">{{ formatEntityId(item.entidadId) }}</td>
                <td>{{ item.resumenCambio }}</td>
              </tr>
              <tr *ngIf="items().length === 0">
                <td colspan="6" class="muted">No hay registros de auditoría para el filtro actual.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </article>
    </section>
  `,
})
export class AuditLogsPageComponent implements OnInit {
  private readonly fb = inject(FormBuilder);

  readonly items = signal<AuditLog[]>([]);
  readonly loading = signal(false);
  readonly errorMessage = signal('');

  readonly acciones = Object.values(AccionAuditoria);

  readonly filtersForm = this.fb.nonNullable.group({
    entidad: [''],
    accion: [''],
  });

  constructor(private readonly auditLogsApi: AuditLogsApiService) {
    enableAutoDismiss([this.errorMessage]);
  }

  ngOnInit(): void {
    this.load();
  }

  formatEntityId(value: string): string {
    if (!value) return 'N/A';
    return value.length > 12 ? `${value.slice(0, 8)}...` : value;
  }

  load(): void {
    const raw = this.filtersForm.getRawValue();

    this.loading.set(true);
    this.errorMessage.set('');

    this.auditLogsApi
      .list({
        page: 1,
        limit: 100,
        entidad: raw.entidad.trim() || undefined,
        accion: (raw.accion || undefined) as AccionAuditoria | undefined,
      })
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (response) => this.items.set(response.items),
        error: (error: HttpErrorResponse) => {
          this.errorMessage.set(error.error?.message ?? 'No fue posible cargar el log de auditoría.');
        },
      });
  }
}

