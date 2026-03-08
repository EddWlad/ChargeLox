import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../config/api.config';
import { PaginationResponse, ShiftLog, ShiftLogQuery } from '../models/domain.models';
import { buildHttpParams } from '../utils/http-params.util';

@Injectable({ providedIn: 'root' })
export class ShiftLogsApiService {
  constructor(private readonly http: HttpClient) {}

  startShift(fechaTurno?: string): Observable<ShiftLog> {
    const payload = fechaTurno ? { fechaTurno } : {};
    return this.http.post<ShiftLog>(`${API_BASE_URL}/shift-logs/start`, payload);
  }

  finishShift(): Observable<ShiftLog> {
    return this.http.patch<ShiftLog>(`${API_BASE_URL}/shift-logs/finish`, {});
  }

  listMine(query: ShiftLogQuery): Observable<PaginationResponse<ShiftLog>> {
    return this.http.get<PaginationResponse<ShiftLog>>(`${API_BASE_URL}/shift-logs/me`, {
      params: buildHttpParams(query as Record<string, unknown>),
    });
  }

  listAll(query: ShiftLogQuery): Observable<PaginationResponse<ShiftLog>> {
    return this.http.get<PaginationResponse<ShiftLog>>(`${API_BASE_URL}/shift-logs`, {
      params: buildHttpParams(query as Record<string, unknown>),
    });
  }

  downloadMinePdf(): Observable<Blob> {
    return this.http.get(`${API_BASE_URL}/shift-logs/me/pdf`, {
      responseType: 'blob',
    });
  }
}
