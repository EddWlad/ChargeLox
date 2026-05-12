import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../config/api.config';
import {
  PaginationResponse,
  RolUsuario,
  User,
} from '../models/domain.models';
import { buildHttpParams } from '../utils/http-params.util';

export interface CreateUserRequest {
  nombres: string;
  apellidos?: string;
  email: string;
  password: string;
  rol?: RolUsuario;
  activo?: boolean;
}

export interface UpdateUserRequest {
  nombres?: string;
  apellidos?: string;
  email?: string;
  rol?: RolUsuario;
  activo?: boolean;
  nuevaPassword?: string;
  confirmarNuevaPassword?: string;
}

export interface UpdateProfileRequest {
  nombres?: string;
  apellidos?: string;
  email?: string;
}

@Injectable({ providedIn: 'root' })
export class UsersApiService {
  constructor(private readonly http: HttpClient) {}

  getMe(): Observable<User> {
    return this.http.get<User>(`${API_BASE_URL}/users/me`);
  }

  updateMe(payload: UpdateProfileRequest): Observable<User> {
    return this.http.patch<User>(`${API_BASE_URL}/users/me`, payload);
  }

  changeMyPassword(payload: { passwordActual: string; nuevaPassword: string }): Observable<{ message: string }> {
    return this.http.patch<{ message: string }>(`${API_BASE_URL}/users/me/password`, payload);
  }

  updateMyAvatar(file: File): Observable<User> {
    const formData = new FormData();
    formData.append('avatar', file);
    return this.http.patch<User>(`${API_BASE_URL}/users/me/avatar`, formData);
  }

  list(query: { page?: number; limit?: number; search?: string }): Observable<PaginationResponse<User>> {
    return this.http.get<PaginationResponse<User>>(`${API_BASE_URL}/users`, {
      params: buildHttpParams(query as Record<string, unknown>),
    });
  }

  getById(id: string): Observable<User> {
    return this.http.get<User>(`${API_BASE_URL}/users/${id}`);
  }

  create(payload: CreateUserRequest): Observable<User> {
    return this.http.post<User>(`${API_BASE_URL}/users`, payload);
  }

  update(id: string, payload: UpdateUserRequest): Observable<User> {
    return this.http.patch<User>(`${API_BASE_URL}/users/${id}`, payload);
  }

  updateRole(id: string, rol: RolUsuario): Observable<User> {
    return this.http.patch<User>(`${API_BASE_URL}/users/${id}/role`, { rol });
  }

  remove(id: string): Observable<{ action: 'deleted' | 'deactivated'; message: string }> {
    return this.http.delete<{ action: 'deleted' | 'deactivated'; message: string }>(`${API_BASE_URL}/users/${id}`);
  }
}
