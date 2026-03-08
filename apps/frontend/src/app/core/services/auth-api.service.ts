import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import {
  AuthResponse,
  LoginRequest,
  RegisterRequest,
  RegisterResponse,
  User,
} from '../models/domain.models';
import { API_BASE_URL } from '../config/api.config';

@Injectable({ providedIn: 'root' })
export class AuthApiService {
  constructor(private readonly http: HttpClient) {}

  login(payload: LoginRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${API_BASE_URL}/auth/login`, payload);
  }

  register(payload: RegisterRequest): Observable<RegisterResponse> {
    return this.http.post<RegisterResponse>(`${API_BASE_URL}/auth/register`, payload);
  }

  me(): Observable<User> {
    return this.http.get<User>(`${API_BASE_URL}/auth/me`);
  }
}
