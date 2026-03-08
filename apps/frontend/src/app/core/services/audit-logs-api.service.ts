import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../config/api.config';
import { AuditLog, AuditLogQuery, PaginationResponse } from '../models/domain.models';
import { buildHttpParams } from '../utils/http-params.util';

@Injectable({ providedIn: 'root' })
export class AuditLogsApiService {
  constructor(private readonly http: HttpClient) {}

  list(query: AuditLogQuery): Observable<PaginationResponse<AuditLog>> {
    return this.http.get<PaginationResponse<AuditLog>>(`${API_BASE_URL}/audit-logs`, {
      params: buildHttpParams(query as Record<string, unknown>),
    });
  }
}
