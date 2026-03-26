import { Injectable, computed, signal } from '@angular/core';
import { Notification } from '../models/domain.models';
import { NotificationsApiService } from './notifications-api.service';

@Injectable({ providedIn: 'root' })
export class NotificationsStateService {
  readonly unreadCount = signal(0);
  readonly hasUnread = computed(() => this.unreadCount() > 0);

  constructor(private readonly notificationsApi: NotificationsApiService) {}

  refreshUnreadCount(): void {
    this.notificationsApi.listMine({ leida: false, page: 1, limit: 1 }).subscribe({
      next: (response) => this.unreadCount.set(response.total),
      error: () => {
        // Fail silently to avoid noisy UI when a background refresh fails.
      },
    });
  }

  setUnreadCountFromNotifications(items: Notification[]): void {
    this.unreadCount.set(items.filter((item) => !item.leida).length);
  }

  reset(): void {
    this.unreadCount.set(0);
  }
}
