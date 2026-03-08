import { CommonModule } from '@angular/common';
import { Component, OnInit, signal, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { finalize } from 'rxjs';
import {
  ChargingPoint,
  ChargingPointQuery,
  EstadoConexion,
  Prioridad,
} from '../../core/models/domain.models';
import { ChargingPointsApiService } from '../../core/services/charging-points-api.service';

import { enableAutoDismiss } from '../../core/utils/auto-dismiss.util';

@Component({
  selector: 'app-public-home-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
    <section class="container section-stack public-home">
      <article class="hero card">
        <div>
          <span class="badge">Red en Vivo</span>
          <h2>Red de Monitoreo <span>ChargeLox</span></h2>
          <p>
            Consulta la disponibilidad pública de puntos de carga y electrolineras KIA/JAC.
          </p>
          <div class="hero-actions">
            <button type="button" class="btn btn-primary" (click)="load()" [disabled]="loading()">Ver puntos</button>
            <a class="btn btn-secondary" [href]="publicListPdfUrl" target="_blank" rel="noopener">Descargar PDF</a>
          </div>
        </div>
        <div class="hero-image" aria-hidden="true"></div>
      </article>

      <form class="filter-bar card" [formGroup]="filtersForm" (ngSubmit)="load()">
        <label>
          Búsqueda
          <input type="text" formControlName="search" placeholder="Nombre o código" />
        </label>

        <label>
          Estado de conexión
          <select formControlName="estadoConexion">
            <option value="">Todos</option>
            <option *ngFor="let item of estadoConexionOptions" [value]="item">{{ item }}</option>
          </select>
        </label>

        <label>
          Prioridad
          <select formControlName="prioridad">
            <option value="">Todas</option>
            <option *ngFor="let item of prioridadOptions" [value]="item">{{ item }}</option>
          </select>
        </label>

        <button type="submit" class="btn btn-primary" [disabled]="loading()">Filtrar</button>
      </form>

      <p class="status error" *ngIf="errorMessage()">{{ errorMessage() }}</p>

      <section class="grid cards-3">
        <article class="card station-card" *ngFor="let point of items()">
          <header>
            <h3>{{ point.nombre }}</h3>
            <span class="pill" [attr.data-priority]="point.prioridad">{{ point.prioridad }}</span>
          </header>

          <p><strong>Código:</strong> {{ point.codigoAsignado }}</p>
          <p><strong>Conexión:</strong> {{ point.estadoConexion }}</p>
          <p><strong>Estado:</strong> {{ point.estado }}</p>
          <p><strong>Puerto:</strong> {{ point.puerto }}</p>

          <div class="inline-actions">
            <a class="btn btn-secondary" [routerLink]="['/puntos-publicos', point.id]">Ver detalle</a>
            <a class="btn btn-ghost" [href]="detailPdfUrl(point.id)" target="_blank" rel="noopener">PDF</a>
          </div>
        </article>
      </section>

      <footer class="pagination" *ngIf="items().length > 0">
        <button type="button" class="btn btn-secondary" (click)="prevPage()" [disabled]="query.page === 1 || loading()">Anterior</button>
        <span>Página {{ query.page }} · Total {{ total() }}</span>
        <button type="button" class="btn btn-secondary" (click)="nextPage()" [disabled]="isLastPage() || loading()">Siguiente</button>
      </footer>
    </section>
  `,
})
export class PublicHomePageComponent {
  private readonly fb = inject(FormBuilder);
  readonly items = signal<ChargingPoint[]>([]);
  readonly total = signal(0);
  readonly loading = signal(false);
  readonly errorMessage = signal('');

  readonly estadoConexionOptions = Object.values(EstadoConexion);
  readonly prioridadOptions = Object.values(Prioridad);

  readonly filtersForm = this.fb.nonNullable.group({
    search: [''],
    estadoConexion: [''],
    prioridad: [''],
  });

  query: ChargingPointQuery = {
    page: 1,
    limit: 9,
  };

  get publicListPdfUrl(): string {
    return this.chargingPointsApi.downloadPublicListPdf();
  }

  constructor(
    private readonly chargingPointsApi: ChargingPointsApiService,
  ) {
    enableAutoDismiss([this.errorMessage]);
  }

  ngOnInit(): void {
    this.load();
  }

  load(resetPage = false): void {
    if (resetPage) {
      this.query.page = 1;
    }

    const formValue = this.filtersForm.getRawValue();
    this.query = {
      ...this.query,
      search: formValue.search.trim(),
      estadoConexion: formValue.estadoConexion as EstadoConexion | '',
      prioridad: formValue.prioridad as Prioridad | '',
    };

    this.loading.set(true);
    this.errorMessage.set('');

    this.chargingPointsApi
      .listPublic(this.query)
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (response) => {
          this.items.set(response.items);
          this.total.set(response.total);
        },
        error: (error: HttpErrorResponse) => {
          this.errorMessage.set(error.error?.message ?? 'No fue posible cargar puntos públicos.');
        },
      });
  }

  detailPdfUrl(id: string): string {
    return this.chargingPointsApi.downloadPublicDetailPdf(id);
  }

  prevPage(): void {
    if ((this.query.page ?? 1) <= 1) {
      return;
    }
    this.query.page = (this.query.page ?? 1) - 1;
    this.load();
  }

  nextPage(): void {
    if (this.isLastPage()) {
      return;
    }
    this.query.page = (this.query.page ?? 1) + 1;
    this.load();
  }

  isLastPage(): boolean {
    const page = this.query.page ?? 1;
    const limit = this.query.limit ?? 9;
    return page * limit >= this.total();
  }
}



