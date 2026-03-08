import { CommonModule, DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { finalize } from 'rxjs';
import { Notification } from '../../core/models/domain.models';
import { NotificationsApiService } from '../../core/services/notifications-api.service';
import { NotificationsStateService } from '../../core/services/notifications-state.service';

import { enableAutoDismiss } from '../../core/utils/auto-dismiss.util';

@Component({
  selector: 'app-notifications-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, DatePipe],
  template: `
    <section class="section-stack">
      <article class="card">
        <header class="section-head compact">
          <h2>Filtros de notificaciones</h2>
          <p>Filtra por estado y marca lectura masiva.</p>
        </header>

        <form [formGroup]="filtersForm" (ngSubmit)="load()" class="filter-bar">
          <label>
            Estado
            <select formControlName="leida">
              <option value="">Todas</option>
              <option value="true">Leídas</option>
              <option value="false">No leídas</option>
            </select>
          </label>
          <button type="submit" class="btn btn-secondary" [disabled]="loading()">Filtrar</button>
          <button type="button" class="btn btn-primary" (click)="markSelectedRead()" [disabled]="loading() || selectedIds().length === 0">
            Marcar seleccionadas
          </button>
        </form>
      </article>

      <article class="card notification-list-card">
        <header class="section-head compact">
          <h3>Bandeja de notificaciones</h3>
          <p>Haz clic en una notificación para abrir el recurso asociado cuando aplique.</p>
        </header>

        <p class="status ok" *ngIf="successMessage()">{{ successMessage() }}</p>
        <p class="status error" *ngIf="errorMessage()">{{ errorMessage() }}</p>

        <ul class="list-clean notification-list">
          <li
            *ngFor="let item of notifications()"
            [class.notification-read]="item.leida"
            class="notification-card"
            (click)="openNotification(item)"
            tabindex="0"
            role="button"
            [attr.aria-label]="'Abrir notificación: ' + item.titulo"
            [title]="item.referenciaId ? 'Abrir actividad relacionada' : 'Notificación informativa'"
          >
            <label class="checkbox-line" (click)="$event.stopPropagation()">
              <input
                type="checkbox"
                [checked]="selectedSet().has(item.id)"
                (change)="toggleSelection(item.id, $event)"
              />
              <span>
                <strong>{{ item.titulo }}</strong>
                <p>{{ item.mensaje }}</p>
                <small>{{ item.createdAt | date: 'short' }} · {{ item.tipo }}</small>
              </span>
            </label>

            <div class="inline-actions" (click)="$event.stopPropagation()">
              <span *ngIf="item.referenciaId" class="pill" data-action="UPDATE">Con referencia</span>
              <button type="button" class="icon-btn" (click)="markRead(item.id)" [disabled]="item.leida || loading()" aria-label="Marcar leída" title="Marcar leída">
                <span class="material-symbols-outlined" aria-hidden="true">mark_email_read</span>
              </button>
            </div>
          </li>
          <li *ngIf="notifications().length === 0" class="muted">No hay notificaciones para el filtro actual.</li>
        </ul>
      </article>
    </section>
  `,
})
export class NotificationsPageComponent implements OnInit {
  private readonly fb = inject(FormBuilder);

  readonly notifications = signal<Notification[]>([]);
  readonly selectedSet = signal<Set<string>>(new Set<string>());

  readonly loading = signal(false);
  readonly errorMessage = signal('');
  readonly successMessage = signal('');

  readonly filtersForm = this.fb.nonNullable.group({
    leida: [''],
  });

  constructor(
    private readonly notificationsApi: NotificationsApiService,
    private readonly notificationsState: NotificationsStateService,
    private readonly router: Router,
  ) {
    enableAutoDismiss([this.errorMessage, this.successMessage]);
  }

  ngOnInit(): void {
    this.load();
  }

  selectedIds(): string[] {
    return [...this.selectedSet()];
  }

  load(): void {
    const value = this.filtersForm.getRawValue().leida;
    const leida = value === '' ? undefined : value === 'true';

    this.loading.set(true);
    this.errorMessage.set('');

    this.notificationsApi
      .listMine(leida)
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (notifications) => {
          this.notifications.set(notifications);
          this.notificationsState.setUnreadCountFromNotifications(notifications);
          this.selectedSet.set(new Set<string>());
        },
        error: (error: HttpErrorResponse) => {
          this.errorMessage.set(error.error?.message ?? 'No fue posible cargar notificaciones.');
        },
      });
  }

  openNotification(notification: Notification): void {
    if (!notification.leida) {
      this.markRead(notification.id, false);
    }

    if (notification.referenciaId) {
      void this.router.navigate(['/app/activities', notification.referenciaId]);
    }
  }

  toggleSelection(id: string, event: Event): void {
    const checked = (event.target as HTMLInputElement).checked;
    const next = new Set(this.selectedSet());

    if (checked) {
      next.add(id);
    } else {
      next.delete(id);
    }

    this.selectedSet.set(next);
  }

  markRead(id: string, reload = true): void {
    this.loading.set(true);
    this.errorMessage.set('');
    this.successMessage.set('');

    this.notificationsApi
      .markAsRead(id)
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: () => {
          if (reload) {
            this.successMessage.set('Notificación marcada como leída.');
            this.load();
          } else {
            const updated = this.notifications().map((item) =>
              item.id === id ? { ...item, leida: true } : item,
            );
            this.notifications.set(updated);
            this.notificationsState.setUnreadCountFromNotifications(updated);
          }
        },
        error: (error: HttpErrorResponse) => {
          this.errorMessage.set(error.error?.message ?? 'No fue posible marcar la notificación.');
        },
      });
  }

  markSelectedRead(): void {
    const ids = this.selectedIds();
    if (ids.length === 0) {
      return;
    }

    this.loading.set(true);
    this.errorMessage.set('');
    this.successMessage.set('');

    this.notificationsApi
      .markManyAsRead(ids)
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (result) => {
          this.successMessage.set(`Solicitadas: ${result.requested}, actualizadas: ${result.updated}.`);
          this.load();
        },
        error: (error: HttpErrorResponse) => {
          this.errorMessage.set(error.error?.message ?? 'No fue posible marcar notificaciones.');
        },
      });
  }
}





