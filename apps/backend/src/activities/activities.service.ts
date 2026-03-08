import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import { AccionAuditoria, Prioridad, RolUsuario } from '../common/enums';
import { AuthenticatedUser } from '../common/interfaces/authenticated-user.interface';
import {
  Activity,
  ActivityComment,
  Attachment,
  User,
} from '../database/entities';
import { NotificationsService } from '../notifications/notifications.service';
import { ReportsService } from '../reports/reports.service';
import { ChangeActivityStatusDto } from './dto/change-activity-status.dto';
import { CreateActivityDto } from './dto/create-activity.dto';
import { QueryActivitiesDto } from './dto/query-activities.dto';
import { UpdateActivityDto } from './dto/update-activity.dto';

@Injectable()
export class ActivitiesService {
  constructor(
    @InjectRepository(Activity)
    private readonly activitiesRepository: Repository<Activity>,
    @InjectRepository(ActivityComment)
    private readonly commentsRepository: Repository<ActivityComment>,
    @InjectRepository(Attachment)
    private readonly attachmentsRepository: Repository<Attachment>,
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    private readonly notificationsService: NotificationsService,
    private readonly auditLogsService: AuditLogsService,
    private readonly reportsService: ReportsService,
  ) {}

  private ensurePermission(activity: Activity, actor: AuthenticatedUser): void {
    const isAdmin = actor.rol === RolUsuario.ADMINISTRADOR;
    if (
      !isAdmin &&
      activity.creadoPorId !== actor.id &&
      activity.usuarioId !== actor.id
    ) {
      throw new ForbiddenException(
        'No tiene permisos para modificar esta actividad.',
      );
    }
  }

  async create(dto: CreateActivityDto, actor: AuthenticatedUser) {
    const created = this.activitiesRepository.create({
      fechaNovedad: new Date(),
      fechaModificacion: new Date(),
      creadoPorId: actor.id,
      creadoPorNombre: actor.nombres,
      tipoActividad: dto.tipoActividad,
      prioridad: dto.prioridad,
      descripcion: dto.descripcion,
      estado: dto.estado,
      usuarioId: dto.usuarioId ?? null,
      turnoId: dto.turnoId ?? null,
      chargingPointId: dto.chargingPointId ?? null,
    });

    const saved = await this.activitiesRepository.save(created);

    const admins = await this.usersRepository.find({
      where: { rol: RolUsuario.ADMINISTRADOR, activo: true },
      select: ['id'],
    });

    await this.notificationsService.createForUsers({
      userIds: admins
        .map((admin) => admin.id)
        .filter((adminId) => adminId !== actor.id),
      titulo: 'Nueva actividad registrada',
      mensaje: `${actor.nombres} creó una ${saved.tipoActividad.toLowerCase()}.`,
      tipo: 'ACTIVITY_CREATED',
      referenciaId: saved.id,
    });

    if (saved.usuarioId && saved.usuarioId !== actor.id) {
      await this.notificationsService.createForUsers({
        userIds: [saved.usuarioId],
        titulo: 'Actividad asignada',
        mensaje: `${actor.nombres} te asignó una ${saved.tipoActividad.toLowerCase()}.`,
        tipo: 'ACTIVITY_ASSIGNED',
        referenciaId: saved.id,
      });
    }

    await this.auditLogsService.log({
      entidad: 'Activity',
      entidadId: saved.id,
      accion: AccionAuditoria.CREATE,
      resumenCambio: 'Creación de actividad.',
      actor,
    });

    return this.findOne(saved.id, actor);
  }

  async findOne(id: string, actor: AuthenticatedUser) {
    const activity = await this.activitiesRepository.findOne({
      where: { id },
      relations: {
        comentarios: true,
        adjuntos: true,
      },
    });

    if (!activity) {
      throw new NotFoundException('Actividad no encontrada.');
    }

    if (
      actor.rol !== RolUsuario.ADMINISTRADOR &&
      activity.creadoPorId !== actor.id &&
      activity.usuarioId !== actor.id
    ) {
      throw new ForbiddenException(
        'No tiene permisos para ver esta actividad.',
      );
    }

    return activity;
  }

  async listMine(actor: AuthenticatedUser, query: QueryActivitiesDto) {
    return this.listInternal({ actor, query, mineOnly: true });
  }

  async listAll(actor: AuthenticatedUser, query: QueryActivitiesDto) {
    return this.listInternal({ actor, query, mineOnly: false });
  }

  private async listInternal(params: {
    actor: AuthenticatedUser;
    query: QueryActivitiesDto;
    mineOnly: boolean;
  }) {
    const page = params.query.page ?? 1;
    const limit = params.query.limit ?? 10;

    const qb = this.activitiesRepository
      .createQueryBuilder('a')
      .orderBy('a.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    if (params.mineOnly || params.actor.rol !== RolUsuario.ADMINISTRADOR) {
      qb.andWhere('(a.creadoPorId = :actorId OR a.usuarioId = :actorId)', {
        actorId: params.actor.id,
      });
    }

    if (params.query.tipoActividad) {
      qb.andWhere('a.tipoActividad = :tipoActividad', {
        tipoActividad: params.query.tipoActividad,
      });
    }

    if (params.query.prioridad) {
      qb.andWhere('a.prioridad = :prioridad', {
        prioridad: params.query.prioridad,
      });
    }

    if (params.query.estado) {
      qb.andWhere('a.estado = :estado', { estado: params.query.estado });
    }

    const [items, total] = await qb.getManyAndCount();
    return { items, page, limit, total };
  }

  async listPrioritarias(actor: AuthenticatedUser) {
    const qb = this.activitiesRepository
      .createQueryBuilder('a')
      .where('a.prioridad = :prioridad', { prioridad: Prioridad.ALTA })
      .orderBy('a.createdAt', 'DESC')
      .take(50);

    if (actor.rol !== RolUsuario.ADMINISTRADOR) {
      qb.andWhere('(a.creadoPorId = :actorId OR a.usuarioId = :actorId)', {
        actorId: actor.id,
      });
    }

    return qb.getMany();
  }

  async update(id: string, dto: UpdateActivityDto, actor: AuthenticatedUser) {
    const activity = await this.activitiesRepository.findOne({ where: { id } });
    if (!activity) {
      throw new NotFoundException('Actividad no encontrada.');
    }

    this.ensurePermission(activity, actor);
    const previousAssignedUserId = activity.usuarioId;

    Object.assign(activity, {
      ...dto,
      fechaModificacion: new Date(),
      usuarioId: dto.usuarioId ?? activity.usuarioId,
      turnoId: dto.turnoId ?? activity.turnoId,
      chargingPointId: dto.chargingPointId ?? activity.chargingPointId,
    });

    const saved = await this.activitiesRepository.save(activity);

    if (
      saved.usuarioId &&
      saved.usuarioId !== previousAssignedUserId &&
      saved.usuarioId !== actor.id
    ) {
      await this.notificationsService.createForUsers({
        userIds: [saved.usuarioId],
        titulo: 'Actividad reasignada',
        mensaje: `${actor.nombres} te reasignó una ${saved.tipoActividad.toLowerCase()}.`,
        tipo: 'ACTIVITY_ASSIGNED',
        referenciaId: saved.id,
      });
    }

    await this.auditLogsService.log({
      entidad: 'Activity',
      entidadId: saved.id,
      accion: AccionAuditoria.UPDATE,
      resumenCambio: 'Actualización de actividad.',
      actor,
    });

    return this.findOne(saved.id, actor);
  }

  async changeStatus(
    id: string,
    dto: ChangeActivityStatusDto,
    actor: AuthenticatedUser,
  ) {
    return this.update(id, { estado: dto.estado }, actor);
  }

  async remove(id: string, actor: AuthenticatedUser): Promise<void> {
    const activity = await this.activitiesRepository.findOne({ where: { id } });
    if (!activity) {
      throw new NotFoundException('Actividad no encontrada.');
    }

    this.ensurePermission(activity, actor);

    await this.activitiesRepository.remove(activity);

    await this.auditLogsService.log({
      entidad: 'Activity',
      entidadId: id,
      accion: AccionAuditoria.DELETE,
      resumenCambio: 'Eliminación de actividad.',
      actor,
    });
  }

  async buildActivityPdf(
    id: string,
    actor: AuthenticatedUser,
  ): Promise<Buffer> {
    const activity = await this.findOne(id, actor);
    const chargingPointNombre =
      activity.chargingPointId !== null
        ? await this.activitiesRepository
            .createQueryBuilder('a')
            .leftJoin('a.chargingPoint', 'cp')
            .select('cp.nombre', 'nombre')
            .where('a.id = :id', { id })
            .getRawOne<{ nombre: string | null }>()
        : null;

    const comments = await this.commentsRepository.find({
      where: { actividadId: id },
      order: { createdAt: 'ASC' },
    });

    const attachments = await this.attachmentsRepository.find({
      where: { actividadId: id },
      order: { createdAt: 'ASC' },
    });

    return this.reportsService.buildActivityDetailPdf({
      activity: {
        ...(activity as unknown as Record<string, unknown>),
        chargingPointNombre: chargingPointNombre?.nombre ?? null,
      },
      comments: comments as unknown as Array<Record<string, unknown>>,
      attachments: attachments as unknown as Array<Record<string, unknown>>,
    });
  }
}




