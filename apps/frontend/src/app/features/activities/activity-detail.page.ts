import { CommonModule, DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, signal, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import {
  Activity,
  ActivityComment,
  Attachment,
  EstadoActividad,
} from '../../core/models/domain.models';
import { ActivitiesApiService } from '../../core/services/activities-api.service';

import { enableAutoDismiss } from '../../core/utils/auto-dismiss.util';

@Component({
  selector: 'app-activity-detail-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, DatePipe],
  template: `
    <section class="section-stack">
      <article class="card" *ngIf="activity() as item">
        <header class="section-head">
          <h2>Actividad #{{ item.id.slice(0, 8) }}</h2>
          <p>{{ item.tipoActividad }} · {{ item.prioridad }} · {{ item.estado }}</p>
        </header>

        <div class="grid cards-2">
          <div class="info-block">
            <p><strong>Creado por:</strong> {{ item.creadoPorNombre }}</p>
            <p><strong>Fecha novedad:</strong> {{ item.fechaNovedad | date: 'short' }}</p>
            <p><strong>Última modificación:</strong> {{ item.fechaModificacion | date: 'short' }}</p>
            <p><strong>Descripción:</strong></p>
            <p>{{ item.descripcion }}</p>
          </div>

          <div class="info-block">
            <form [formGroup]="statusForm" (ngSubmit)="changeStatus()" class="form-grid">
              <label>
                Cambiar estado
                <select formControlName="estado">
                  <option *ngFor="let value of estadoOptions" [value]="value">{{ value }}</option>
                </select>
              </label>
              <button type="submit" class="btn btn-secondary" [disabled]="loading()">Actualizar estado</button>
            </form>

            <button type="button" class="btn btn-primary" (click)="downloadPdf()" [disabled]="loading()">Descargar PDF</button>
          </div>
        </div>
      </article>

      <article class="card">
        <header class="section-head compact">
          <h3>Comentarios</h3>
        </header>

        <form [formGroup]="commentForm" (ngSubmit)="addComment()" class="form-grid">
          <label class="full-row">
            Comentario
            <textarea rows="3" formControlName="comentario"></textarea>
          </label>
          <label>
            Estado opcional
            <select formControlName="estadoNuevo">
              <option value="">Sin cambio</option>
              <option *ngFor="let value of estadoOptions" [value]="value">{{ value }}</option>
            </select>
          </label>
          <button type="submit" class="btn btn-primary" [disabled]="loading()">Publicar comentario</button>
        </form>

        <ul class="list-clean">
          <li *ngFor="let comment of comments()">
            <strong>{{ comment.nombreUsuario }}</strong>
            <p>{{ comment.comentario }}</p>
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
          <h3>Adjuntos</h3>
          <label class="btn btn-secondary file-btn">
            Subir archivo
            <input type="file" (change)="uploadAttachment($event)" />
          </label>
        </header>

        <ul class="list-clean">
          <li *ngFor="let attachment of attachments()" class="attachment-item">
            <div>
              <strong>{{ attachment.nombreOriginal }}</strong>
              <small>{{ attachment.mimeType }} · {{ formatSize(attachment.tamano) }}</small>
            </div>
            <button type="button" class="btn btn-ghost" (click)="downloadAttachment(attachment)">Descargar</button>
          </li>
          <li *ngIf="attachments().length === 0" class="muted">No hay adjuntos en esta actividad.</li>
        </ul>
      </article>

      <p class="status ok" *ngIf="successMessage()">{{ successMessage() }}</p>
      <p class="status error" *ngIf="errorMessage()">{{ errorMessage() }}</p>
      <a routerLink="/app/activities" class="btn btn-secondary">Volver a actividades</a>
    </section>
  `,
})
export class ActivityDetailPageComponent {
  private readonly fb = inject(FormBuilder);
  readonly activity = signal<Activity | null>(null);
  readonly comments = signal<ActivityComment[]>([]);
  readonly attachments = signal<Attachment[]>([]);

  readonly loading = signal(false);
  readonly errorMessage = signal('');
  readonly successMessage = signal('');

  readonly estadoOptions = Object.values(EstadoActividad);

  readonly statusForm = this.fb.nonNullable.group({
    estado: [EstadoActividad.EN_REVISION, [Validators.required]],
  });

  readonly commentForm = this.fb.nonNullable.group({
    comentario: ['', [Validators.required]],
    estadoNuevo: [''],
  });

  private activityId = '';

  constructor(
    private readonly route: ActivatedRoute,
    private readonly activitiesApi: ActivitiesApiService,
  ) {
    enableAutoDismiss([this.errorMessage, this.successMessage]);
  }

  ngOnInit(): void {
    this.activityId = this.route.snapshot.paramMap.get('id') ?? '';

    if (!this.activityId) {
      this.errorMessage.set('ID de actividad inválido.');
      return;
    }

    this.loadAll();
  }

  loadAll(): void {
    this.loadActivity();
    this.loadComments();
    this.loadAttachments();
  }

  loadActivity(): void {
    this.loading.set(true);
    this.errorMessage.set('');

    this.activitiesApi
      .getById(this.activityId)
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (activity) => {
          this.activity.set(activity);
          this.statusForm.patchValue({ estado: activity.estado });
        },
        error: (error: HttpErrorResponse) => {
          this.errorMessage.set(error.error?.message ?? 'No fue posible cargar el detalle de la actividad.');
        },
      });
  }

  loadComments(): void {
    this.activitiesApi.listComments(this.activityId).subscribe({
      next: (comments) => this.comments.set(comments),
      error: (error: HttpErrorResponse) => {
        this.errorMessage.set(error.error?.message ?? 'No fue posible cargar comentarios.');
      },
    });
  }

  loadAttachments(): void {
    this.activitiesApi.listAttachments(this.activityId).subscribe({
      next: (attachments) => this.attachments.set(attachments),
      error: (error: HttpErrorResponse) => {
        this.errorMessage.set(error.error?.message ?? 'No fue posible cargar adjuntos.');
      },
    });
  }

  changeStatus(): void {
    if (this.statusForm.invalid || this.loading()) {
      return;
    }

    const estado = this.statusForm.getRawValue().estado;

    this.loading.set(true);
    this.errorMessage.set('');
    this.successMessage.set('');

    this.activitiesApi
      .changeStatus(this.activityId, estado)
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (activity) => {
          this.activity.set(activity);
          this.successMessage.set('Estado actualizado correctamente.');
        },
        error: (error: HttpErrorResponse) => {
          this.errorMessage.set(error.error?.message ?? 'No fue posible actualizar estado.');
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
      estadoNuevo: (raw.estadoNuevo || undefined) as EstadoActividad | undefined,
    };

    this.loading.set(true);
    this.errorMessage.set('');
    this.successMessage.set('');

    this.activitiesApi
      .addComment(this.activityId, payload)
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: () => {
          this.successMessage.set('Comentario registrado correctamente.');
          this.commentForm.patchValue({ comentario: '', estadoNuevo: '' });
          this.loadAll();
        },
        error: (error: HttpErrorResponse) => {
          this.errorMessage.set(error.error?.message ?? 'No fue posible guardar el comentario.');
        },
      });
  }

  uploadAttachment(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];

    if (!file || this.loading()) {
      return;
    }

    this.loading.set(true);
    this.errorMessage.set('');
    this.successMessage.set('');

    this.activitiesApi
      .uploadAttachment(this.activityId, file)
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: () => {
          this.successMessage.set('Adjunto subido correctamente.');
          this.loadAttachments();
        },
        error: (error: HttpErrorResponse) => {
          this.errorMessage.set(error.error?.message ?? 'No fue posible subir adjunto.');
        },
      });
  }

  downloadAttachment(attachment: Attachment): void {
    this.activitiesApi.downloadAttachment(attachment.id).subscribe({
      next: (blob) => {
        const url = URL.createObjectURL(blob);
        window.open(url, '_blank', 'noopener');
        setTimeout(() => URL.revokeObjectURL(url), 5000);
      },
      error: (error: HttpErrorResponse) => {
        this.errorMessage.set(error.error?.message ?? 'No fue posible descargar el adjunto.');
      },
    });
  }

  downloadPdf(): void {
    this.activitiesApi.downloadActivityPdf(this.activityId).subscribe({
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

  formatSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }
}



