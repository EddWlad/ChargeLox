import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit, computed, signal } from '@angular/core';
import {
  NavigationEnd,
  Router,
  RouterLink,
  RouterLinkActive,
  RouterOutlet,
} from '@angular/router';
import { Subscription } from 'rxjs';
import { API_BASE_URL } from '../core/config/api.config';
import { RolUsuario } from '../core/models/domain.models';
import { AuthService } from '../core/services/auth.service';
import { NotificationsStateService } from '../core/services/notifications-state.service';

interface NavItem {
  label: string;
  path: string;
  icon: string;
  roles?: RolUsuario[];
}

@Component({
  selector: 'app-private-shell',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    <div class="private-layout">
      <aside class="sidebar" [class.open]="menuOpen()" aria-label="Menú principal">
        <div class="sidebar-brand">
          <span class="brand-mark" aria-hidden="true">
            <span class="brand-mark-dot"></span>
            <span class="brand-mark-line"></span>
            <span class="brand-mark-bolt">⚡</span>
          </span>
          <div>
            <strong>ChargeLox</strong>
            <small>{{ userRoleLabel() }}</small>
          </div>
        </div>

        <nav class="sidebar-nav">
          <a
            *ngFor="let item of visibleItems()"
            [routerLink]="item.path"
            routerLinkActive="active"
            [routerLinkActiveOptions]="{ exact: item.path.endsWith('dashboard') }"
            (click)="closeMenu()"
          >
            <span class="material-symbols-outlined nav-icon" aria-hidden="true">{{ item.icon }}</span>
            <span class="nav-label">{{ item.label }}</span>
            <span
              *ngIf="item.path === '/app/notifications' && notificationsState.hasUnread()"
              class="nav-alert-badge"
              [attr.aria-label]="notificationsState.unreadCount() + ' notificaciones no leídas'"
              title="Notificaciones no leídas"
            >
              {{ notificationsState.unreadCount() > 99 ? '99+' : notificationsState.unreadCount() }}
            </span>
          </a>
        </nav>

        <button type="button" class="btn btn-secondary sidebar-logout" (click)="logout()">
          <span class="material-symbols-outlined" aria-hidden="true">logout</span>
          Cerrar sesión
        </button>
      </aside>

      <button
        *ngIf="menuOpen()"
        type="button"
        class="sidebar-overlay"
        (click)="closeMenu()"
        aria-label="Cerrar menú"
      ></button>

      <div class="content-wrap">
        <header class="topbar">
          <button
            type="button"
            class="menu-btn"
            (click)="toggleMenu()"
            aria-label="Abrir menú"
            title="Abrir menú"
          >
            <span class="material-symbols-outlined">menu</span>
          </button>

          <div>
            <h1>{{ pageTitle() }}</h1>
            <p>{{ pageSubtitle() }}</p>
          </div>

          <div class="topbar-user" *ngIf="authService.currentUser() as user">
            <div class="topbar-user-avatar">
              <img
                *ngIf="displayAvatarUrl(user.avatarUrl) as avatarUrl; else initialsFallback"
                [src]="avatarUrl"
                [alt]="'Avatar de ' + user.nombres"
                (error)="onAvatarError()"
              />
              <ng-template #initialsFallback>
                <span>{{ initials(user.nombres, user.apellidos) }}</span>
              </ng-template>
            </div>
            <div>
              <strong>{{ user.nombres }}</strong>
              <small>{{ user.email }}</small>
              <small class="clock">Hora local {{ currentTime() }}</small>
            </div>
          </div>
        </header>

        <section class="app-content">
          <router-outlet />
        </section>
      </div>
    </div>
  `,
})
export class PrivateShellComponent implements OnInit, OnDestroy {
  readonly menuOpen = signal(false);
  readonly currentTime = signal(this.buildTimeLabel());
  readonly avatarLoadFailed = signal(false);

  private readonly clockInterval = setInterval(() => {
    this.currentTime.set(this.buildTimeLabel());
  }, 1000);

  private notificationsInterval: ReturnType<typeof setInterval> | null = null;
  private routerEventsSub: Subscription | null = null;

  readonly navItems: NavItem[] = [
    { label: 'Dashboard', path: '/app/dashboard', icon: 'dashboard' },
    { label: 'Puntos de Carga', path: '/app/charging-points', icon: 'ev_station' },
    {
      label: 'Turnos',
      path: '/app/shift-logs',
      icon: 'schedule',
      roles: [RolUsuario.ADMINISTRADOR, RolUsuario.ANALISTA],
    },
    {
      label: 'Actividades',
      path: '/app/activities',
      icon: 'assignment',
      roles: [RolUsuario.ADMINISTRADOR, RolUsuario.ANALISTA],
    },
    {
      label: 'Actividades Extra',
      path: '/app/extra-activities',
      icon: 'pending_actions',
      roles: [RolUsuario.ADMINISTRADOR, RolUsuario.ANALISTA],
    },
    {
      label: 'Operación técnica',
      path: '/app/technical-activities',
      icon: 'engineering',
      roles: [
        RolUsuario.ADMINISTRADOR,
        RolUsuario.SUPERVISOR,
        RolUsuario.TECNICO,
        RolUsuario.GESTOR_DE_VISITAS,
        RolUsuario.ANALISTA,
      ],
    },
    { label: 'Notificaciones', path: '/app/notifications', icon: 'notifications' },
    { label: 'Mi Perfil', path: '/app/profile', icon: 'person' },
    {
      label: 'Usuarios',
      path: '/app/users',
      icon: 'group',
      roles: [RolUsuario.ADMINISTRADOR],
    },
    {
      label: 'Auditoría',
      path: '/app/audit-logs',
      icon: 'admin_panel_settings',
      roles: [RolUsuario.ADMINISTRADOR],
    },
  ];

  readonly visibleItems = computed(() => {
    const userRole = this.authService.currentUser()?.rol;
    return this.navItems.filter(
      (item) => !item.roles || (userRole ? item.roles.includes(userRole) : false),
    );
  });

  constructor(
    public readonly authService: AuthService,
    public readonly notificationsState: NotificationsStateService,
    private readonly router: Router,
  ) {}

  ngOnInit(): void {
    this.notificationsState.refreshUnreadCount();

    this.notificationsInterval = setInterval(() => {
      this.notificationsState.refreshUnreadCount();
    }, 20000);

    this.routerEventsSub = this.router.events.subscribe((event) => {
      if (event instanceof NavigationEnd) {
        this.avatarLoadFailed.set(false);
        this.notificationsState.refreshUnreadCount();
      }
    });
  }

  ngOnDestroy(): void {
    clearInterval(this.clockInterval);

    if (this.notificationsInterval) {
      clearInterval(this.notificationsInterval);
      this.notificationsInterval = null;
    }

    this.routerEventsSub?.unsubscribe();
  }

  toggleMenu(): void {
    this.menuOpen.update((value) => !value);
  }

  closeMenu(): void {
    this.menuOpen.set(false);
  }

  logout(): void {
    this.notificationsState.reset();
    this.authService.clearSession();
  }

  userRoleLabel(): string {
    const role = this.authService.currentUser()?.rol;
    if (role === RolUsuario.ADMINISTRADOR) return 'Panel Administrador';
    if (role === RolUsuario.SUPERVISOR) return 'Panel Supervisor';
    if (role === RolUsuario.TECNICO) return 'Panel Técnico';
    if (role === RolUsuario.GESTOR_DE_VISITAS) return 'Panel Gestor de visitas';
    return 'Panel Analista';
  }

  pageTitle(): string {
    const route = this.router.url;

    if (route.includes('/charging-points')) return 'Puntos de carga y electrolineras';
    if (route.includes('/shift-logs')) return 'Turnos de monitoreo';
    if (route.includes('/extra-activities')) return 'Actividades Extraordinarias';
    if (route.includes('/activities')) return 'Novedades y seguimientos';
    if (route.includes('/technical-activities')) return 'Operación técnica de campo';
    if (route.includes('/notifications')) return 'Notificaciones';
    if (route.includes('/profile')) return 'Perfil de usuario';
    if (route.includes('/users')) return 'Gestión de usuarios';
    if (route.includes('/audit-logs')) return 'Log de auditoría';

    return 'Centro de control';
  }

  pageSubtitle(): string {
    return 'Monitoreo operativo de la red ChargeLox';
  }

  initials(nombres: string, apellidos?: string | null): string {
    const first = nombres?.trim().charAt(0) ?? 'C';
    const second = apellidos?.trim().charAt(0) ?? '';
    return `${first}${second}`.toUpperCase();
  }

  resolveAssetUrl(path: string | null): string | null {
    if (!path) return null;
    if (path.startsWith('http://') || path.startsWith('https://')) return path;
    const apiOrigin = API_BASE_URL.startsWith('http')
      ? new URL(API_BASE_URL).origin
      : window.location.origin;
    return `${apiOrigin}${path.startsWith('/') ? path : `/${path}`}`;
  }

  displayAvatarUrl(path: string | null): string | null {
    if (this.avatarLoadFailed()) return null;
    return this.resolveAssetUrl(path);
  }

  onAvatarError(): void {
    this.avatarLoadFailed.set(true);
  }

  private buildTimeLabel(): string {
    return new Date().toLocaleTimeString('es-EC', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  }
}
