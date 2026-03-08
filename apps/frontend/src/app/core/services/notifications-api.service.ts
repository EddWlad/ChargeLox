import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../config/api.config';
import { Notification } from '../models/domain.models';
import { buildHttpParams } from '../utils/http-params.util';

@Injectable({ providedIn: 'root' })
export class NotificationsApiService {
  constructor(private readonly http: HttpClient) {}

  listMine(leida?: boolean): Observable<Notification[]> {
    return this.http.get<Notification[]>(`${API_BASE_URL}/notifications/me`, {
      params: buildHttpParams({ leida }),
    });
  }

  markAsRead(id: string): Observable<Notification> {
    return this.http.patch<Notification>(`${API_BASE_URL}/notifications/${id}/read`, {});
  }

  markManyAsRead(ids: string[]): Observable<{ requested: number; updated: number }> {
    return this.http.patch<{ requested: number; updated: number }>(`${API_BASE_URL}/notifications/me/read-many`, {
      ids,
    });
  }
}
