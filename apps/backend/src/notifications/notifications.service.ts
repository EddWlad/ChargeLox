import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Notification } from '../database/entities';
import { QueryNotificationsDto } from './dto/query-notifications.dto';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectRepository(Notification)
    private readonly notificationsRepository: Repository<Notification>,
  ) {}

  async createForUsers(params: {
    userIds: string[];
    titulo: string;
    mensaje: string;
    tipo: string;
    referenciaId?: string;
  }): Promise<void> {
    const uniqueUserIds = [...new Set(params.userIds.filter(Boolean))];
    if (uniqueUserIds.length === 0) {
      return;
    }

    const notifications = uniqueUserIds.map((usuarioDestinoId) =>
      this.notificationsRepository.create({
        usuarioDestinoId,
        titulo: params.titulo,
        mensaje: params.mensaje,
        tipo: params.tipo,
        referenciaId: params.referenciaId ?? null,
      }),
    );

    await this.notificationsRepository.save(notifications);
  }

  async getMyNotifications(userId: string, query: QueryNotificationsDto) {
    const where = {
      usuarioDestinoId: userId,
      ...(query.leida === undefined ? {} : { leida: query.leida }),
    };
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;

    const [items, total] = await this.notificationsRepository.findAndCount({
      where,
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return {
      items,
      page,
      limit,
      total,
    };
  }

  async markAsRead(userId: string, notificationId: string) {
    const notification = await this.notificationsRepository.findOne({
      where: { id: notificationId },
    });

    if (!notification) {
      throw new NotFoundException('Notificación no encontrada.');
    }

    if (notification.usuarioDestinoId !== userId) {
      throw new ForbiddenException(
        'No tiene permisos para modificar esta notificación.',
      );
    }

    notification.leida = true;
    return this.notificationsRepository.save(notification);
  }

  async markManyAsRead(userId: string, notificationIds: string[]) {
    const uniqueIds = [...new Set(notificationIds)];
    if (uniqueIds.length === 0) {
      return {
        requested: 0,
        updated: 0,
      };
    }

    const result = await this.notificationsRepository.update(
      { id: In(uniqueIds), usuarioDestinoId: userId },
      { leida: true },
    );

    return {
      requested: uniqueIds.length,
      updated: result.affected ?? 0,
    };
  }
}
