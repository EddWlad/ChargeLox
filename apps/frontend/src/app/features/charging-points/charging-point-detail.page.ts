import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, signal, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import {
  ChargingPoint,
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
  selector: 'app-charging-point-detail-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
    <section class="section-stack">
      <article class="card" *ngIf="point() as cp">
        <header class="section-head compact">
          <h2>{{ cp.nombre }}</h2>
          <p>{{ cp.codigoAsignado }} · {{ cp.tipo }}</p>
        </header>

        <div class="grid cards-2">
          <div class="info-block">
            <p><strong>Serial:</strong> {{ cp.serial }}</p>
            <p><strong>PUK:</strong> {{ cp.puk }}</p>
            <p><strong>Estado:</strong> {{ cp.estado }}</p>
            <p><strong>Conexión:</strong> {{ cp.estadoConexion }}</p>
            <p><strong>Prioridad:</strong> {{ cp.prioridad }}</p>
            <p><strong>Puerto:</strong> {{ cp.puerto }}</p>
            <p><strong>Actualizado:</strong> {{ cp.updatedAt | date: 'short' }}</p>
          </div>

          <div class="info-block" *ngIf="cp.imagenUrl; else noImage">
            <img [src]="cp.imagenUrl" alt="Imagen del punto" class="station-image" />
          </div>
          <ng-template #noImage>
            <div class="info-block muted">No hay imagen registrada.</div>
          </ng-template>
        </div>

        <div class="inline-actions">
          <a routerLink="/app/charging-points" class="btn btn-secondary">Volver</a>
          <a [href]="publicPdfUrl" target="_blank" rel="noopener" class="btn btn-ghost">PDF público</a>
        </div>
      </article>

      <article class="card" *ngIf="isAdmin()">
        <header class="section-head compact">
          <h3>Editar punto</h3>
          <p>Actualización de datos e imagen (solo ADMINISTRADOR).</p>
        </header>

        <form [formGroup]="updateForm" (ngSubmit)="save()" class="form-grid grid-3">
          <label>
            Nombre
            <input type="text" formControlName="nombre" />
          </label>
          <label>
            Código
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

          <button type="submit" class="btn btn-primary" [disabled]="loading()">Guardar cambios</button>
        </form>

        <label class="btn btn-secondary file-btn">
          Subir imagen
          <input type="file" accept="image/*" (change)="onImageSelected($event)" />
        </label>
      </article>

      <p class="status ok" *ngIf="successMessage()">{{ successMessage() }}</p>
      <p class="status error" *ngIf="errorMessage()">{{ errorMessage() }}</p>
    </section>
  `,
})
export class ChargingPointDetailPageComponent {
  private readonly fb = inject(FormBuilder);
  readonly point = signal<ChargingPoint | null>(null);
  readonly loading = signal(false);
  readonly errorMessage = signal('');
  readonly successMessage = signal('');

  id = '';

  readonly estadoConexionOptions = Object.values(EstadoConexion);
  readonly estadoPuntoOptions = Object.values(EstadoPunto);
  readonly prioridadOptions = Object.values(Prioridad);
  readonly tipoPuntoOptions = Object.values(TipoPunto);

  readonly updateForm = this.fb.nonNullable.group({
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
    private readonly route: ActivatedRoute,
    private readonly chargingPointsApi: ChargingPointsApiService,
    private readonly authService: AuthService,
  ) {
    enableAutoDismiss([this.errorMessage, this.successMessage]);
  }

  get publicPdfUrl(): string {
    return this.chargingPointsApi.downloadPublicDetailPdf(this.id);
  }

  ngOnInit(): void {
    this.id = this.route.snapshot.paramMap.get('id') ?? '';
    this.load();
  }

  isAdmin(): boolean {
    return this.authService.currentUser()?.rol === RolUsuario.ADMINISTRADOR;
  }

  load(): void {
    if (!this.id) {
      this.errorMessage.set('ID de punto inválido.');
      return;
    }

    this.loading.set(true);
    this.errorMessage.set('');

    this.chargingPointsApi
      .getById(this.id)
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (point) => {
          this.point.set(point);
          this.updateForm.patchValue({
            nombre: point.nombre,
            codigoAsignado: point.codigoAsignado,
            serial: point.serial ?? '',
            puk: point.puk ?? '',
            prioridad: point.prioridad,
            estado: point.estado,
            estadoConexion: point.estadoConexion,
            puerto: point.puerto,
            tipo: point.tipo,
          });
        },
        error: (error: HttpErrorResponse) => {
          this.errorMessage.set(error.error?.message ?? 'No fue posible cargar el detalle.');
        },
      });
  }

  save(): void {
    if (!this.isAdmin() || this.updateForm.invalid || this.loading()) {
      this.updateForm.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    this.errorMessage.set('');
    this.successMessage.set('');

    this.chargingPointsApi
      .update(this.id, this.updateForm.getRawValue())
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (point) => {
          this.point.set(point);
          this.successMessage.set('Punto actualizado correctamente.');
        },
        error: (error: HttpErrorResponse) => {
          this.errorMessage.set(error.error?.message ?? 'No fue posible actualizar el punto.');
        },
      });
  }

  onImageSelected(event: Event): void {
    if (!this.isAdmin()) {
      return;
    }

    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file || this.loading()) {
      return;
    }

    this.loading.set(true);
    this.errorMessage.set('');
    this.successMessage.set('');

    this.chargingPointsApi
      .updateImage(this.id, file)
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (point) => {
          this.point.set(point);
          this.successMessage.set('Imagen actualizada correctamente.');
        },
        error: (error: HttpErrorResponse) => {
          this.errorMessage.set(error.error?.message ?? 'No fue posible subir la imagen.');
        },
      });
  }
}



