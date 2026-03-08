import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { ChargingPoint } from '../../core/models/domain.models';
import { ChargingPointsApiService } from '../../core/services/charging-points-api.service';

import { enableAutoDismiss } from '../../core/utils/auto-dismiss.util';

@Component({
  selector: 'app-public-charging-point-detail-page',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <section class="container section-stack">
      <article class="card" *ngIf="point() as cp">
        <header class="section-head">
          <h2>{{ cp.nombre }}</h2>
          <p>Código {{ cp.codigoAsignado }} · {{ cp.tipo }}</p>
        </header>

        <div class="grid cards-2">
          <div class="info-block">
            <p><strong>Prioridad:</strong> {{ cp.prioridad }}</p>
            <p><strong>Estado:</strong> {{ cp.estado }}</p>
            <p><strong>Conexión:</strong> {{ cp.estadoConexion }}</p>
            <p><strong>Puerto:</strong> {{ cp.puerto }}</p>
          </div>
          <div class="info-block station-image-panel" *ngIf="cp.imagenUrl; else noImage">
            <img [src]="cp.imagenUrl" alt="Imagen de estación" class="station-image station-image-detail" />
          </div>
          <ng-template #noImage>
            <div class="info-block muted">No hay imagen pública disponible.</div>
          </ng-template>
        </div>

        <div class="inline-actions">
          <a routerLink="/" class="btn btn-secondary">Volver al listado</a>
          <a [href]="pdfUrl" target="_blank" rel="noopener" class="btn btn-primary">Descargar PDF</a>
        </div>
      </article>

      <p class="status error" *ngIf="errorMessage()">{{ errorMessage() }}</p>
    </section>
  `,
})
export class PublicChargingPointDetailPageComponent implements OnInit {
  readonly point = signal<ChargingPoint | null>(null);
  readonly errorMessage = signal('');
  readonly loading = signal(false);

  id = '';

  constructor(
    private readonly route: ActivatedRoute,
    private readonly chargingPointsApi: ChargingPointsApiService,
  ) {
    enableAutoDismiss([this.errorMessage]);
  }

  get pdfUrl(): string {
    return this.chargingPointsApi.downloadPublicDetailPdf(this.id);
  }

  ngOnInit(): void {
    this.id = this.route.snapshot.paramMap.get('id') ?? '';
    if (!this.id) {
      this.errorMessage.set('ID de punto inválido.');
      return;
    }

    this.loading.set(true);
    this.chargingPointsApi
      .getPublicById(this.id)
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (point) => this.point.set(point),
        error: (error: HttpErrorResponse) => {
          this.errorMessage.set(error.error?.message ?? 'No fue posible cargar el detalle público.');
        },
      });
  }
}


