import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../config/api.config';
import {
  CreateTechnicalActivityCommentRequest,
  CreateTechnicalActivityRequest,
  EstadoActividadTecnica,
  PaginationResponse,
  TechnicalActivity,
  TechnicalActivityComment,
  TechnicalActivityEvidence,
  TechnicalActivityHistory,
  TechnicalActivityQuery,
  UpdateTechnicalActivityRequest,
  User,
} from '../models/domain.models';
import { buildHttpParams } from '../utils/http-params.util';

@Injectable({ providedIn: 'root' })
export class TechnicalActivitiesApiService {
  constructor(private readonly http: HttpClient) {}

  list(
    query: TechnicalActivityQuery,
  ): Observable<PaginationResponse<TechnicalActivity>> {
    return this.http.get<PaginationResponse<TechnicalActivity>>(
      `${API_BASE_URL}/technical-activities`,
      {
        params: buildHttpParams(query as Record<string, unknown>),
      },
    );
  }

  listMine(
    query: TechnicalActivityQuery,
  ): Observable<PaginationResponse<TechnicalActivity>> {
    return this.http.get<PaginationResponse<TechnicalActivity>>(
      `${API_BASE_URL}/technical-activities/mine`,
      {
        params: buildHttpParams(query as Record<string, unknown>),
      },
    );
  }

  listAssignableTechnicians(): Observable<
    Array<Pick<User, 'id' | 'nombres' | 'email' | 'rol'>>
  > {
    return this.http.get<Array<Pick<User, 'id' | 'nombres' | 'email' | 'rol'>>>(
      `${API_BASE_URL}/technical-activities/lookups/technicians`,
    );
  }

  getById(id: string): Observable<TechnicalActivity> {
    return this.http.get<TechnicalActivity>(
      `${API_BASE_URL}/technical-activities/${id}`,
    );
  }

  create(payload: CreateTechnicalActivityRequest): Observable<TechnicalActivity> {
    return this.http.post<TechnicalActivity>(
      `${API_BASE_URL}/technical-activities`,
      payload,
    );
  }

  update(
    id: string,
    payload: UpdateTechnicalActivityRequest,
  ): Observable<TechnicalActivity> {
    return this.http.patch<TechnicalActivity>(
      `${API_BASE_URL}/technical-activities/${id}`,
      payload,
    );
  }

  changeStatus(
    id: string,
    payload: {
      estado: EstadoActividadTecnica;
      observacionesEjecucion?: string;
      observacionesCierre?: string;
    },
  ): Observable<TechnicalActivity> {
    return this.http.patch<TechnicalActivity>(
      `${API_BASE_URL}/technical-activities/${id}/status`,
      payload,
    );
  }

  listComments(activityId: string): Observable<TechnicalActivityComment[]> {
    return this.http.get<TechnicalActivityComment[]>(
      `${API_BASE_URL}/technical-activities/${activityId}/comments`,
    );
  }

  addComment(
    activityId: string,
    payload: CreateTechnicalActivityCommentRequest,
  ): Observable<TechnicalActivityComment> {
    return this.http.post<TechnicalActivityComment>(
      `${API_BASE_URL}/technical-activities/${activityId}/comments`,
      payload,
    );
  }

  listEvidences(activityId: string): Observable<TechnicalActivityEvidence[]> {
    return this.http.get<TechnicalActivityEvidence[]>(
      `${API_BASE_URL}/technical-activities/${activityId}/evidences`,
    );
  }

  uploadEvidence(
    activityId: string,
    file: File,
  ): Observable<TechnicalActivityEvidence> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<TechnicalActivityEvidence>(
      `${API_BASE_URL}/technical-activities/${activityId}/evidences/upload`,
      formData,
    );
  }

  downloadEvidence(evidenceId: string): Observable<Blob> {
    return this.http.get(
      `${API_BASE_URL}/technical-activities/evidences/file/${evidenceId}`,
      {
        responseType: 'blob',
      },
    );
  }

  listHistory(activityId: string): Observable<TechnicalActivityHistory[]> {
    return this.http.get<TechnicalActivityHistory[]>(
      `${API_BASE_URL}/technical-activities/${activityId}/history`,
    );
  }

  downloadPdf(activityId: string): Observable<Blob> {
    return this.http.get(`${API_BASE_URL}/technical-activities/${activityId}/pdf`, {
      responseType: 'blob',
    });
  }

  downloadExcel(filters?: {
    fechaDesde?: string;
    fechaHasta?: string;
  }): Observable<Blob> {
    return this.http.get(`${API_BASE_URL}/technical-activities/export/excel`, {
      params: buildHttpParams((filters ?? {}) as Record<string, unknown>),
      responseType: 'blob',
    });
  }
}
