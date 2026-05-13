import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../config/api.config';
import {
  CancelExtraActivityRequest,
  ExtraActivity,
  ExtraActivityQuery,
  ExtraActivitySummaryGlobal,
  ExtraActivitySummaryMe,
  FinishExtraActivityRequest,
  PaginationResponse,
  StartExtraActivityRequest,
  UpdateExtraActivityRequest,
  User,
} from '../models/domain.models';
import { buildHttpParams } from '../utils/http-params.util';

@Injectable({ providedIn: 'root' })
export class ExtraActivitiesApiService {
  constructor(private readonly http: HttpClient) {}

  start(payload: StartExtraActivityRequest): Observable<ExtraActivity> {
    return this.http.post<ExtraActivity>(`${API_BASE_URL}/extra-activities/start`, payload);
  }

  getMyActive(): Observable<ExtraActivity | null> {
    return this.http.get<ExtraActivity | null>(`${API_BASE_URL}/extra-activities/me/active`);
  }

  list(query: ExtraActivityQuery): Observable<PaginationResponse<ExtraActivity>> {
    return this.http.get<PaginationResponse<ExtraActivity>>(
      `${API_BASE_URL}/extra-activities`,
      {
        params: buildHttpParams(query as Record<string, unknown>),
      },
    );
  }

  getById(id: string): Observable<ExtraActivity> {
    return this.http.get<ExtraActivity>(`${API_BASE_URL}/extra-activities/${id}`);
  }

  update(id: string, payload: UpdateExtraActivityRequest): Observable<ExtraActivity> {
    return this.http.patch<ExtraActivity>(
      `${API_BASE_URL}/extra-activities/${id}`,
      payload,
    );
  }

  finish(id: string, payload: FinishExtraActivityRequest): Observable<ExtraActivity> {
    return this.http.patch<ExtraActivity>(
      `${API_BASE_URL}/extra-activities/${id}/finish`,
      payload,
    );
  }

  cancel(id: string, payload?: CancelExtraActivityRequest): Observable<ExtraActivity> {
    return this.http.patch<ExtraActivity>(
      `${API_BASE_URL}/extra-activities/${id}/cancel`,
      payload ?? {},
    );
  }

  remove(id: string): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${API_BASE_URL}/extra-activities/${id}`);
  }

  summaryMe(): Observable<ExtraActivitySummaryMe> {
    return this.http.get<ExtraActivitySummaryMe>(`${API_BASE_URL}/extra-activities/summary/me`);
  }

  summaryGlobal(): Observable<ExtraActivitySummaryGlobal> {
    return this.http.get<ExtraActivitySummaryGlobal>(`${API_BASE_URL}/extra-activities/summary`);
  }

  listAnalysts(): Observable<Array<Pick<User, 'id' | 'nombres' | 'apellidos' | 'email' | 'rol'>>> {
    return this.http.get<
      Array<Pick<User, 'id' | 'nombres' | 'apellidos' | 'email' | 'rol'>>
    >(`${API_BASE_URL}/extra-activities/lookups/analysts`);
  }

  downloadExcel(query: ExtraActivityQuery): Observable<Blob> {
    return this.http.get(`${API_BASE_URL}/extra-activities/export/excel`, {
      params: buildHttpParams(query as Record<string, unknown>),
      responseType: 'blob',
    });
  }
}
