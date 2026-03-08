import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import { AccionAuditoria, RolUsuario } from '../common/enums';
import { AuthenticatedUser } from '../common/interfaces/authenticated-user.interface';
import { Activity, ActivityComment } from '../database/entities';
import { NotificationsService } from '../notifications/notifications.service';
import { CreateActivityCommentDto } from './dto/create-activity-comment.dto';

@Injectable()
export class ActivityCommentsService {
  constructor(
    @InjectRepository(ActivityComment)
    private readonly commentsRepository: Repository<ActivityComment>,
    @InjectRepository(Activity)
    private readonly activitiesRepository: Repository<Activity>,
    private readonly notificationsService: NotificationsService,
    private readonly auditLogsService: AuditLogsService,
  ) {}

  private async findActivityOrFail(activityId: string): Promise<Activity> {
    const activity = await this.activitiesRepository.findOne({
      where: { id: activityId },
    });

    if (!activity) {
      throw new NotFoundException('Actividad no encontrada.');
    }

    return activity;
  }

  async addComment(
    activityId: string,
    dto: CreateActivityCommentDto,
    actor: AuthenticatedUser,
  ) {
    const activity = await this.findActivityOrFail(activityId);

    if (
      actor.rol !== RolUsuario.ADMINISTRADOR &&
      activity.creadoPorId !== actor.id &&
      activity.usuarioId !== actor.id
    ) {
      throw new ForbiddenException(
        'No tiene permisos para comentar esta actividad.',
      );
    }

    const created = this.commentsRepository.create({
      actividadId: activity.id,
      usuarioId: actor.id,
      nombreUsuario: actor.nombres,
      comentario: dto.comentario,
      estadoNuevo: dto.estadoNuevo ?? null,
      fechaComentario: new Date(),
    });

    const saved = await this.commentsRepository.save(created);

    if (dto.estadoNuevo) {
      activity.estado = dto.estadoNuevo;
      activity.fechaModificacion = new Date();
      await this.activitiesRepository.save(activity);
    }

    const recipients = [activity.creadoPorId, activity.usuarioId].filter(
      (recipientId): recipientId is string =>
        Boolean(recipientId) && recipientId !== actor.id,
    );

    await this.notificationsService.createForUsers({
      userIds: recipients,
      titulo: 'Nuevo comentario en actividad',
      mensaje: `${actor.nombres} comentó en una actividad.`,
      tipo: 'ACTIVITY_COMMENT_CREATED',
      referenciaId: activity.id,
    });

    await this.auditLogsService.log({
      entidad: 'ActivityComment',
      entidadId: saved.id,
      accion: AccionAuditoria.CREATE,
      resumenCambio: 'Nuevo comentario registrado en actividad.',
      actor,
    });

    return saved;
  }

  async listByActivity(activityId: string, actor: AuthenticatedUser) {
    const activity = await this.findActivityOrFail(activityId);

    if (
      actor.rol !== RolUsuario.ADMINISTRADOR &&
      activity.creadoPorId !== actor.id &&
      activity.usuarioId !== actor.id
    ) {
      throw new ForbiddenException(
        'No tiene permisos para consultar comentarios de esta actividad.',
      );
    }

    return this.commentsRepository.find({
      where: { actividadId: activity.id },
      order: { createdAt: 'ASC' },
    });
  }
}


