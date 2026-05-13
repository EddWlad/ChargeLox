import { Routes } from '@angular/router';
import { ActivitiesPageComponent } from './features/activities/activities.page';
import { ActivityDetailPageComponent } from './features/activities/activity-detail.page';
import { AuditLogsPageComponent } from './features/admin/audit-logs.page';
import { UsersAdminPageComponent } from './features/admin/users-admin.page';
import { LoginPageComponent } from './features/auth/login.page';
import { ChargingPointDetailPageComponent } from './features/charging-points/charging-point-detail.page';
import { ChargingPointsPageComponent } from './features/charging-points/charging-points.page';
import { DashboardPageComponent } from './features/dashboard/dashboard.page';
import { NotificationsPageComponent } from './features/notifications/notifications.page';
import { ExtraActivitiesPageComponent } from './features/extra-activities/extra-activities.page';
import {
  PublicChargingPointDetailPageComponent,
} from './features/public-home/public-charging-point-detail.page';
import { PublicHomePageComponent } from './features/public-home/public-home.page';
import { ProfilePageComponent } from './features/profile/profile.page';
import { ShiftLogsPageComponent } from './features/shift-logs/shift-logs.page';
import { TechnicalActivityDetailPageComponent } from './features/technical-activities/technical-activity-detail.page';
import { TechnicalActivitiesPageComponent } from './features/technical-activities/technical-activities.page';
import { authGuard } from './core/guards/auth.guard';
import { roleGuard } from './core/guards/role.guard';
import { RolUsuario } from './core/models/domain.models';
import { PrivateShellComponent } from './layouts/private-shell.component';
import { PublicShellComponent } from './layouts/public-shell.component';

export const routes: Routes = [
  {
    path: '',
    component: PublicShellComponent,
    children: [
      { path: '', component: PublicHomePageComponent },
      { path: 'login', component: LoginPageComponent },
      {
        path: 'puntos-publicos/:id',
        component: PublicChargingPointDetailPageComponent,
      },
    ],
  },
  {
    path: 'app',
    component: PrivateShellComponent,
    canActivate: [authGuard],
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
      { path: 'dashboard', component: DashboardPageComponent },
      { path: 'profile', component: ProfilePageComponent },
      { path: 'charging-points', component: ChargingPointsPageComponent },
      {
        path: 'charging-points/:id',
        component: ChargingPointDetailPageComponent,
      },
      {
        path: 'shift-logs',
        component: ShiftLogsPageComponent,
        canActivate: [roleGuard],
        data: { roles: [RolUsuario.ADMINISTRADOR, RolUsuario.ANALISTA] },
      },
      {
        path: 'activities',
        component: ActivitiesPageComponent,
        canActivate: [roleGuard],
        data: { roles: [RolUsuario.ADMINISTRADOR, RolUsuario.ANALISTA] },
      },
      {
        path: 'activities/:id',
        component: ActivityDetailPageComponent,
        canActivate: [roleGuard],
        data: { roles: [RolUsuario.ADMINISTRADOR, RolUsuario.ANALISTA] },
      },
      {
        path: 'extra-activities',
        component: ExtraActivitiesPageComponent,
        canActivate: [roleGuard],
        data: { roles: [RolUsuario.ADMINISTRADOR, RolUsuario.ANALISTA] },
      },
      {
        path: 'technical-activities',
        component: TechnicalActivitiesPageComponent,
        canActivate: [roleGuard],
        data: {
          roles: [
            RolUsuario.ADMINISTRADOR,
            RolUsuario.SUPERVISOR,
            RolUsuario.TECNICO,
            RolUsuario.GESTOR_DE_VISITAS,
            RolUsuario.ANALISTA,
          ],
        },
      },
      {
        path: 'technical-activities/:id',
        component: TechnicalActivityDetailPageComponent,
        canActivate: [roleGuard],
        data: {
          roles: [
            RolUsuario.ADMINISTRADOR,
            RolUsuario.SUPERVISOR,
            RolUsuario.TECNICO,
            RolUsuario.GESTOR_DE_VISITAS,
            RolUsuario.ANALISTA,
          ],
        },
      },
      { path: 'notifications', component: NotificationsPageComponent },
      {
        path: 'users',
        component: UsersAdminPageComponent,
        canActivate: [roleGuard],
        data: { roles: [RolUsuario.ADMINISTRADOR] },
      },
      {
        path: 'audit-logs',
        component: AuditLogsPageComponent,
        canActivate: [roleGuard],
        data: { roles: [RolUsuario.ADMINISTRADOR] },
      },
    ],
  },
  { path: '**', redirectTo: '' },
];
