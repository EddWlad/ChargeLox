import { Injectable, computed, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, map, tap } from 'rxjs';
import { LoginRequest, RegisterRequest, User } from '../models/domain.models';
import { AuthApiService } from './auth-api.service';

const TOKEN_KEY = 'chargelox_access_token';
const USER_KEY = 'chargelox_user';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly accessTokenSignal = signal<string | null>(null);
  private readonly currentUserSignal = signal<User | null>(null);

  readonly accessToken = computed(() => this.accessTokenSignal());
  readonly currentUser = computed(() => this.currentUserSignal());
  readonly isAuthenticated = computed(() => !!this.accessTokenSignal());

  constructor(
    private readonly authApi: AuthApiService,
    private readonly router: Router,
  ) {
    this.restoreSession();
  }

  login(payload: LoginRequest): Observable<User> {
    return this.authApi.login(payload).pipe(
      tap((response) => this.setSession(response.accessToken, response.user)),
      map((response) => response.user),
    );
  }

  register(payload: RegisterRequest): Observable<User> {
    return this.authApi.register(payload).pipe(map((response) => response.user));
  }

  refreshMe(): Observable<User> {
    return this.authApi.me().pipe(
      tap((user) => {
        this.currentUserSignal.set(user);
        localStorage.setItem(USER_KEY, JSON.stringify(user));
      }),
    );
  }

  hasRole(role: string): boolean {
    return this.currentUserSignal()?.rol === role;
  }

  hasAnyRole(roles: string[]): boolean {
    const userRole = this.currentUserSignal()?.rol;
    return !!userRole && roles.includes(userRole);
  }

  setSession(token: string, user: User): void {
    this.accessTokenSignal.set(token);
    this.currentUserSignal.set(user);
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  }

  clearSession(redirect = true): void {
    this.accessTokenSignal.set(null);
    this.currentUserSignal.set(null);
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);

    if (redirect) {
      void this.router.navigate(['/login']);
    }
  }

  updateCurrentUser(user: User): void {
    this.currentUserSignal.set(user);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  }

  private restoreSession(): void {
    const token = localStorage.getItem(TOKEN_KEY);
    const rawUser = localStorage.getItem(USER_KEY);

    if (!token || !rawUser) {
      return;
    }

    try {
      const parsedUser = JSON.parse(rawUser) as User;
      this.accessTokenSignal.set(token);
      this.currentUserSignal.set(parsedUser);
    } catch {
      this.clearSession(false);
    }
  }
}
