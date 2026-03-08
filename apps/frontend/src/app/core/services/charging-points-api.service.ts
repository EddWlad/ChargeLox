import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../config/api.config';
import {
  ChargingPoint,
  ChargingPointQuery,
  CreateChargingPointRequest,
  PaginationResponse,
  UpdateChargingPointRequest,
} from '../models/domain.models';
import { buildHttpParams } from '../utils/http-params.util';

@Injectable({ providedIn: 'root' })
export class ChargingPointsApiService {
  constructor(private readonly http: HttpClient) {}

  listPublic(query: ChargingPointQuery): Observable<PaginationResponse<ChargingPoint>> {
    return this.http.get<PaginationResponse<ChargingPoint>>(`${API_BASE_URL}/charging-points/public`, {
      params: buildHttpParams(query as Record<string, unknown>),
    });
  }

  listPrivate(query: ChargingPointQuery): Observable<PaginationResponse<ChargingPoint>> {
    return this.http.get<PaginationResponse<ChargingPoint>>(`${API_BASE_URL}/charging-points`, {
      params: buildHttpParams(query as Record<string, unknown>),
    });
  }

  getPublicById(id: string): Observable<ChargingPoint> {
    return this.http.get<ChargingPoint>(`${API_BASE_URL}/charging-points/public/${id}`);
  }

  getById(id: string): Observable<ChargingPoint> {
    return this.http.get<ChargingPoint>(`${API_BASE_URL}/charging-points/${id}`);
  }

  create(payload: CreateChargingPointRequest): Observable<ChargingPoint> {
    return this.http.post<ChargingPoint>(`${API_BASE_URL}/charging-points`, payload);
  }

  update(id: string, payload: UpdateChargingPointRequest): Observable<ChargingPoint> {
    return this.http.patch<ChargingPoint>(`${API_BASE_URL}/charging-points/${id}`, payload);
  }

  updateImage(id: string, file: File): Observable<ChargingPoint> {
    const formData = new FormData();
    formData.append('image', file);
    return this.http.patch<ChargingPoint>(`${API_BASE_URL}/charging-points/${id}/image`, formData);
  }

  remove(id: string): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${API_BASE_URL}/charging-points/${id}`);
  }

  downloadPublicListPdf(): string {
    return `${API_BASE_URL}/charging-points/public/pdf`;
  }

  downloadPublicDetailPdf(id: string): string {
    return `${API_BASE_URL}/charging-points/public/${id}/pdf`;
  }
}
