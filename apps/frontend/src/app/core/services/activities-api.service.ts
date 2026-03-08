import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../config/api.config';
import {
  Activity,
  ActivityComment,
  ActivityQuery,
  Attachment,
  CreateActivityCommentRequest,
  CreateActivityRequest,
  EstadoActividad,
  PaginationResponse,
  UpdateActivityRequest,
} from '../models/domain.models';
import { buildHttpParams } from '../utils/http-params.util';

@Injectable({ providedIn: 'root' })
export class ActivitiesApiService {
  constructor(private readonly http: HttpClient) {}

  create(payload: CreateActivityRequest): Observable<Activity> {
    return this.http.post<Activity>(`${API_BASE_URL}/activities`, payload);
  }

  listMine(query: ActivityQuery): Observable<PaginationResponse<Activity>> {
    return this.http.get<PaginationResponse<Activity>>(`${API_BASE_URL}/activities/mine`, {
      params: buildHttpParams(query as Record<string, unknown>),
    });
  }

  listAll(query: ActivityQuery): Observable<PaginationResponse<Activity>> {
    return this.http.get<PaginationResponse<Activity>>(`${API_BASE_URL}/activities`, {
      params: buildHttpParams(query as Record<string, unknown>),
    });
  }

  listPrioritarias(): Observable<Activity[]> {
    return this.http.get<Activity[]>(`${API_BASE_URL}/activities/prioritarias`);
  }

  getById(id: string): Observable<Activity> {
    return this.http.get<Activity>(`${API_BASE_URL}/activities/${id}`);
  }

  update(id: string, payload: UpdateActivityRequest): Observable<Activity> {
    return this.http.patch<Activity>(`${API_BASE_URL}/activities/${id}`, payload);
  }

  changeStatus(id: string, estado: EstadoActividad): Observable<Activity> {
    return this.http.patch<Activity>(`${API_BASE_URL}/activities/${id}/status`, { estado });
  }

  remove(id: string): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${API_BASE_URL}/activities/${id}`);
  }

  downloadActivityPdf(id: string): Observable<Blob> {
    return this.http.get(`${API_BASE_URL}/activities/${id}/pdf`, {
      responseType: 'blob',
    });
  }

  addComment(activityId: string, payload: CreateActivityCommentRequest): Observable<ActivityComment> {
    return this.http.post<ActivityComment>(`${API_BASE_URL}/activity-comments/${activityId}`, payload);
  }

  listComments(activityId: string): Observable<ActivityComment[]> {
    return this.http.get<ActivityComment[]>(`${API_BASE_URL}/activity-comments/${activityId}`);
  }

  uploadAttachment(activityId: string, file: File): Observable<Attachment> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<Attachment>(`${API_BASE_URL}/attachments/${activityId}/upload`, formData);
  }

  listAttachments(activityId: string): Observable<Attachment[]> {
    return this.http.get<Attachment[]>(`${API_BASE_URL}/attachments/${activityId}`);
  }

  downloadAttachment(attachmentId: string): Observable<Blob> {
    return this.http.get(`${API_BASE_URL}/attachments/file/${attachmentId}`, {
      responseType: 'blob',
    });
  }
}
