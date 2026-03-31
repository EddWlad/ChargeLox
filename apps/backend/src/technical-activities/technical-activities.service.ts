import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import ExcelJS from 'exceljs';
import { existsSync } from 'fs';
import { unlink } from 'fs/promises';
import { join } from 'path';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import {
  AccionAuditoria,
  EstadoActividadTecnica,
  RolUsuario,
} from '../common/enums';
import { AuthenticatedUser } from '../common/interfaces/authenticated-user.interface';
import {
  ChargingPoint,
  TechnicalActivity,
  TechnicalActivityComment,
  TechnicalActivityEvidence,
  TechnicalActivityHistory,
  TechnicalEvidenceStorageProvider,
  User,
} from '../database/entities';
import { NotificationsService } from '../notifications/notifications.service';
import { ReportsService } from '../reports/reports.service';
import { CloudinaryService } from './cloudinary.service';
import { ChangeTechnicalActivityStatusDto } from './dto/change-technical-activity-status.dto';
import { CreateTechnicalActivityCommentDto } from './dto/create-technical-activity-comment.dto';
import { CreateTechnicalActivityDto } from './dto/create-technical-activity.dto';
import { QueryTechnicalActivitiesDto } from './dto/query-technical-activities.dto';
import { UpdateTechnicalActivityDto } from './dto/update-technical-activity.dto';

type StorageMode = 'auto' | 'local' | 'cloudinary';

@Injectable()
export class TechnicalActivitiesService {
  private readonly allowedMimeTypes = (
    process.env.ALLOWED_FILE_MIME_TYPES ??
    'image/jpeg,image/png,image/webp,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/plain'
  )
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);

  private readonly restrictedTechnicianFields: Array<
    keyof UpdateTechnicalActivityDto
  > = [
    'tipoActividad',
    'titulo',
    'descripcion',
    'prioridad',
    'tecnicoAsignadoId',
    'fechaProgramada',
    'fechaLimite',
    'ubicacion',
    'chargingPointId',
    'observacionesIniciales',
  ];

  constructor(
    @InjectRepository(TechnicalActivity)
    private readonly technicalActivitiesRepository: Repository<TechnicalActivity>,
    @InjectRepository(TechnicalActivityComment)
    private readonly technicalCommentsRepository: Repository<TechnicalActivityComment>,
    @InjectRepository(TechnicalActivityEvidence)
    private readonly technicalEvidencesRepository: Repository<TechnicalActivityEvidence>,
    @InjectRepository(TechnicalActivityHistory)
    private readonly technicalHistoryRepository: Repository<TechnicalActivityHistory>,
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    @InjectRepository(ChargingPoint)
    private readonly chargingPointsRepository: Repository<ChargingPoint>,
    private readonly notificationsService: NotificationsService,
    private readonly auditLogsService: AuditLogsService,
    private readonly reportsService: ReportsService,
    private readonly cloudinaryService: CloudinaryService,
  ) {}

  private isAdmin(actor: AuthenticatedUser): boolean {
    return actor.rol === RolUsuario.ADMINISTRADOR;
  }

  private isSupervisor(actor: AuthenticatedUser): boolean {
    return actor.rol === RolUsuario.SUPERVISOR;
  }

  private isTechnician(actor: AuthenticatedUser): boolean {
    return actor.rol === RolUsuario.TECNICO;
  }

  private isAnalyst(actor: AuthenticatedUser): boolean {
    return actor.rol === RolUsuario.ANALISTA;
  }

  private canCreateOrAssign(actor: AuthenticatedUser): boolean {
    return this.isAdmin(actor) || this.isSupervisor(actor);
  }

  private canListGlobal(actor: AuthenticatedUser): boolean {
    return this.isAdmin(actor) || this.isSupervisor(actor) || this.isAnalyst(actor);
  }

  private canComment(actor: AuthenticatedUser): boolean {
    return this.isAdmin(actor) || this.isSupervisor(actor) || this.isTechnician(actor);
  }

  private ensureCanView(activity: TechnicalActivity, actor: AuthenticatedUser): void {
    if (this.canListGlobal(actor)) {
      return;
    }

    if (this.isTechnician(actor) && activity.tecnicoAsignadoId === actor.id) {
      return;
    }

    throw new ForbiddenException('No tiene permisos para ver esta actividad técnica.');
  }

  private ensureCanEdit(activity: TechnicalActivity, actor: AuthenticatedUser): void {
    if (this.canCreateOrAssign(actor)) {
      return;
    }

    if (this.isTechnician(actor) && activity.tecnicoAsignadoId === actor.id) {
      return;
    }

    throw new ForbiddenException(
      'No tiene permisos para modificar esta actividad técnica.',
    );
  }

  private ensureCanUploadEvidence(
    activity: TechnicalActivity,
    actor: AuthenticatedUser,
  ): void {
    if (this.isAnalyst(actor)) {
      throw new ForbiddenException(
        'Los analistas no pueden subir evidencias técnicas.',
      );
    }

    this.ensureCanEdit(activity, actor);
  }

  private ensureCanCommentOnActivity(
    activity: TechnicalActivity,
    actor: AuthenticatedUser,
  ): void {
    if (!this.canComment(actor)) {
      throw new ForbiddenException(
        'No tiene permisos para comentar actividades técnicas.',
      );
    }

    this.ensureCanView(activity, actor);
  }

  private async getActiveTechnician(userId: string): Promise<User> {
    const user = await this.usersRepository.findOne({
      where: { id: userId, activo: true },
    });

    if (!user) {
      throw new BadRequestException('El técnico asignado no existe o está inactivo.');
    }

    if (user.rol !== RolUsuario.TECNICO) {
      throw new BadRequestException(
        'La actividad técnica solo puede asignarse a usuarios con rol TECNICO.',
      );
    }

    return user;
  }

  private async ensureChargingPointExists(
    chargingPointId: string | null | undefined,
  ): Promise<void> {
    if (!chargingPointId) {
      return;
    }

    const exists = await this.chargingPointsRepository.exist({
      where: { id: chargingPointId },
    });
    if (!exists) {
      throw new BadRequestException('El punto de carga relacionado no existe.');
    }
  }

  private getStorageMode(): StorageMode {
    const mode = (process.env.TECHNICAL_EVIDENCE_STORAGE ?? 'auto')
      .toLowerCase()
      .trim();

    if (mode === 'local' || mode === 'cloudinary' || mode === 'auto') {
      return mode;
    }

    return 'auto';
  }

  private buildBaseDetailsQuery(): SelectQueryBuilder<TechnicalActivity> {
    return this.technicalActivitiesRepository
      .createQueryBuilder('ta')
      .leftJoin('ta.tecnicoAsignado', 'tecnico')
      .leftJoin('ta.supervisorAsignador', 'supervisor')
      .leftJoin('ta.chargingPoint', 'cp')
      .addSelect([
        'tecnico.id',
        'tecnico.nombres',
        'tecnico.email',
        'tecnico.rol',
        'supervisor.id',
        'supervisor.nombres',
        'supervisor.email',
        'supervisor.rol',
        'cp.id',
        'cp.nombre',
        'cp.codigoAsignado',
      ]);
  }

  private sanitizeUserSummary(user: User | null | undefined) {
    if (!user) {
      return null;
    }

    return {
      id: user.id,
      nombres: user.nombres,
      email: user.email,
      rol: user.rol,
    };
  }

  private toActivityResponse(activity: TechnicalActivity) {
    return {
      ...activity,
      tecnicoAsignado: this.sanitizeUserSummary(activity.tecnicoAsignado),
      supervisorAsignador: this.sanitizeUserSummary(activity.supervisorAsignador),
      chargingPoint: activity.chargingPoint
        ? {
            id: activity.chargingPoint.id,
            nombre: activity.chargingPoint.nombre,
            codigoAsignado: activity.chargingPoint.codigoAsignado,
          }
        : null,
    };
  }

  private toEvidenceResponse(evidence: TechnicalActivityEvidence) {
    return {
      id: evidence.id,
      actividadTecnicaId: evidence.actividadTecnicaId,
      subidoPorId: evidence.subidoPorId,
      nombreOriginal: evidence.nombreOriginal,
      mimeType: evidence.mimeType,
      tamano: evidence.tamano,
      storageProvider: evidence.storageProvider,
      cloudinaryUrl: evidence.cloudinaryUrl,
      createdAt: evidence.createdAt,
      downloadUrl: `/technical-activities/evidences/file/${evidence.id}`,
    };
  }

  private async addHistory(params: {
    activityId: string;
    actor: AuthenticatedUser | null;
    accion: string;
    descripcion: string;
    estadoAnterior?: EstadoActividadTecnica | null;
    estadoNuevo?: EstadoActividadTecnica | null;
  }): Promise<void> {
    const created = this.technicalHistoryRepository.create({
      actividadTecnicaId: params.activityId,
      actorId: params.actor?.id ?? null,
      actorNombre: params.actor?.nombres ?? null,
      accion: params.accion,
      descripcion: params.descripcion,
      estadoAnterior: params.estadoAnterior ?? null,
      estadoNuevo: params.estadoNuevo ?? null,
    });

    await this.technicalHistoryRepository.save(created);
  }

  private validateStatusTransition(
    currentStatus: EstadoActividadTecnica,
    nextStatus: EstadoActividadTecnica,
    actor: AuthenticatedUser,
  ): void {
    if (currentStatus === nextStatus) {
      return;
    }

    if (this.canCreateOrAssign(actor)) {
      return;
    }

    if (!this.isTechnician(actor)) {
      throw new ForbiddenException(
        'No tiene permisos para cambiar el estado de esta actividad técnica.',
      );
    }

    const transitionsByCurrentState: Record<
      EstadoActividadTecnica,
      EstadoActividadTecnica[]
    > = {
      [EstadoActividadTecnica.ASIGNADA]: [
        EstadoActividadTecnica.EN_PROCESO,
        EstadoActividadTecnica.OBSERVADA,
      ],
      [EstadoActividadTecnica.EN_PROCESO]: [
        EstadoActividadTecnica.OBSERVADA,
        EstadoActividadTecnica.COMPLETADA,
      ],
      [EstadoActividadTecnica.OBSERVADA]: [
        EstadoActividadTecnica.EN_PROCESO,
        EstadoActividadTecnica.COMPLETADA,
      ],
      [EstadoActividadTecnica.COMPLETADA]: [],
      [EstadoActividadTecnica.CANCELADA]: [],
    };

    const allowedTransitions = transitionsByCurrentState[currentStatus] ?? [];
    if (!allowedTransitions.includes(nextStatus)) {
      throw new ForbiddenException(
        'El técnico no puede realizar ese cambio de estado en esta fase.',
      );
    }
  }

  private ensureValidDateRange(
    fechaDesde?: string,
    fechaHasta?: string,
  ): void {
    if (!fechaDesde || !fechaHasta) {
      return;
    }

    const from = new Date(fechaDesde);
    const to = new Date(fechaHasta);

    if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime())) {
      throw new BadRequestException('Rango de fechas inválido.');
    }

    if (from.getTime() > to.getTime()) {
      throw new BadRequestException(
        'La fecha desde no puede ser mayor que la fecha hasta.',
      );
    }
  }

  private async notifyAssignment(
    activity: TechnicalActivity,
    actor: AuthenticatedUser,
    title: string,
    message: string,
  ): Promise<void> {
    const adminRecipients = await this.usersRepository.find({
      where: { rol: RolUsuario.ADMINISTRADOR, activo: true },
      select: ['id'],
    });

    const recipients = [
      activity.tecnicoAsignadoId,
      ...adminRecipients.map((item) => item.id),
    ].filter((userId) => userId !== actor.id);

    await this.notificationsService.createForUsers({
      userIds: recipients,
      titulo: title,
      mensaje: message,
      tipo: 'TECHNICAL_ACTIVITY_ASSIGNED',
      referenciaId: activity.id,
    });
  }

  private async notifyStatusChanged(
    activity: TechnicalActivity,
    actor: AuthenticatedUser,
    previousStatus: EstadoActividadTecnica,
  ): Promise<void> {
    const adminRecipients = await this.usersRepository.find({
      where: { rol: RolUsuario.ADMINISTRADOR, activo: true },
      select: ['id'],
    });

    const recipients = [
      activity.supervisorAsignadorId,
      ...adminRecipients.map((item) => item.id),
    ].filter((userId) => userId !== actor.id);

    await this.notificationsService.createForUsers({
      userIds: recipients,
      titulo: 'Cambio de estado en actividad técnica',
      mensaje: `${actor.nombres} cambió el estado de ${previousStatus} a ${activity.estado}.`,
      tipo: 'TECHNICAL_ACTIVITY_STATUS_CHANGED',
      referenciaId: activity.id,
    });
  }

  private async notifyParticipants(
    activity: TechnicalActivity,
    actor: AuthenticatedUser,
    title: string,
    message: string,
    type: string,
  ): Promise<void> {
    const recipients = [
      activity.creadoPorId,
      activity.tecnicoAsignadoId,
      activity.supervisorAsignadorId,
    ].filter((userId) => userId !== actor.id);

    await this.notificationsService.createForUsers({
      userIds: recipients,
      titulo: title,
      mensaje: message,
      tipo: type,
      referenciaId: activity.id,
    });
  }

  async listAssignableTechnicians(actor: AuthenticatedUser) {
    if (!this.canListGlobal(actor)) {
      throw new ForbiddenException(
        'No tiene permisos para consultar técnicos asignables.',
      );
    }

    const users = await this.usersRepository.find({
      where: {
        rol: RolUsuario.TECNICO,
        activo: true,
      },
      order: { nombres: 'ASC' },
      select: ['id', 'nombres', 'email', 'rol'],
    });

    return users.map((user) => this.sanitizeUserSummary(user));
  }

  async create(dto: CreateTechnicalActivityDto, actor: AuthenticatedUser) {
    if (!this.canCreateOrAssign(actor)) {
      throw new ForbiddenException(
        'Solo administrador o supervisor pueden crear actividades técnicas.',
      );
    }

    await this.getActiveTechnician(dto.tecnicoAsignadoId);
    await this.ensureChargingPointExists(dto.chargingPointId);

    const created = this.technicalActivitiesRepository.create({
      tipoActividad: dto.tipoActividad,
      titulo: dto.titulo,
      descripcion: dto.descripcion?.trim() || '',
      prioridad: dto.prioridad,
      estado: dto.estado ?? EstadoActividadTecnica.ASIGNADA,
      creadoPorId: actor.id,
      creadoPorNombre: actor.nombres,
      tecnicoAsignadoId: dto.tecnicoAsignadoId,
      supervisorAsignadorId: actor.id,
      fechaProgramada: dto.fechaProgramada,
      fechaLimite: dto.fechaLimite ?? null,
      fechaEjecucion: dto.fechaEjecucion ?? null,
      fechaInstalacion: dto.fechaInstalacion ?? null,
      ubicacion: dto.ubicacion ?? null,
      chargingPointId: dto.chargingPointId ?? null,
      codigoAsignado: dto.codigoAsignado ?? null,
      serial: dto.serial ?? null,
      puk: dto.puk ?? null,
      marca: dto.marca ?? null,
      modelo: dto.modelo ?? null,
      estadoInicial: dto.estadoInicial ?? null,
      caracteristicasTecnicas: dto.caracteristicasTecnicas ?? null,
      diagnostico: dto.diagnostico ?? null,
      hallazgos: dto.hallazgos ?? null,
      accionesRealizadas: dto.accionesRealizadas ?? null,
      componentesIntervenidos: dto.componentesIntervenidos ?? null,
      recomendaciones: dto.recomendaciones ?? null,
      estadoFinal: dto.estadoFinal ?? null,
      observacionesIniciales: dto.observacionesIniciales ?? null,
      observacionesEjecucion: dto.observacionesEjecucion ?? null,
      observacionesCierre: dto.observacionesCierre ?? null,
    });

    const saved = await this.technicalActivitiesRepository.save(created);

    await this.addHistory({
      activityId: saved.id,
      actor,
      accion: 'CREATED',
      descripcion: 'Actividad técnica creada y asignada.',
      estadoNuevo: saved.estado,
    });

    await this.notifyAssignment(
      saved,
      actor,
      'Nueva actividad técnica asignada',
      `${actor.nombres} te asignó la actividad "${saved.titulo}".`,
    );

    await this.auditLogsService.log({
      entidad: 'TechnicalActivity',
      entidadId: saved.id,
      accion: AccionAuditoria.CREATE,
      resumenCambio: 'Creación de actividad técnica.',
      actor,
    });

    return this.findOne(saved.id, actor);
  }

  async list(actor: AuthenticatedUser, query: QueryTechnicalActivitiesDto) {
    if (!this.canListGlobal(actor)) {
      throw new ForbiddenException(
        'No tiene permisos para listar todas las actividades técnicas.',
      );
    }

    const page = query.page ?? 1;
    const limit = query.limit ?? 10;

    const qb = this.buildBaseDetailsQuery()
      .orderBy('ta.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    if (query.tipoActividad) {
      qb.andWhere('ta.tipoActividad = :tipoActividad', {
        tipoActividad: query.tipoActividad,
      });
    }

    if (query.estado) {
      qb.andWhere('ta.estado = :estado', {
        estado: query.estado,
      });
    }

    if (query.prioridad) {
      qb.andWhere('ta.prioridad = :prioridad', {
        prioridad: query.prioridad,
      });
    }

    if (query.tecnicoAsignadoId) {
      qb.andWhere('ta.tecnicoAsignadoId = :tecnicoAsignadoId', {
        tecnicoAsignadoId: query.tecnicoAsignadoId,
      });
    }

    if (query.chargingPointId) {
      qb.andWhere('ta.chargingPointId = :chargingPointId', {
        chargingPointId: query.chargingPointId,
      });
    }

    if (query.fechaDesde) {
      qb.andWhere('ta.fechaProgramada >= :fechaDesde', {
        fechaDesde: query.fechaDesde,
      });
    }

    if (query.fechaHasta) {
      qb.andWhere('ta.fechaProgramada <= :fechaHasta', {
        fechaHasta: query.fechaHasta,
      });
    }

    const [items, total] = await qb.getManyAndCount();

    return {
      items: items.map((item) => this.toActivityResponse(item)),
      page,
      limit,
      total,
    };
  }

  async listMine(actor: AuthenticatedUser, query: QueryTechnicalActivitiesDto) {
    if (!this.isTechnician(actor)) {
      throw new ForbiddenException(
        'Solo usuarios con rol TECNICO pueden usar este listado.',
      );
    }

    const page = query.page ?? 1;
    const limit = query.limit ?? 10;

    const qb = this.buildBaseDetailsQuery()
      .where('ta.tecnicoAsignadoId = :actorId', { actorId: actor.id })
      .orderBy('ta.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    if (query.tipoActividad) {
      qb.andWhere('ta.tipoActividad = :tipoActividad', {
        tipoActividad: query.tipoActividad,
      });
    }

    if (query.estado) {
      qb.andWhere('ta.estado = :estado', {
        estado: query.estado,
      });
    }

    if (query.prioridad) {
      qb.andWhere('ta.prioridad = :prioridad', {
        prioridad: query.prioridad,
      });
    }

    if (query.fechaDesde) {
      qb.andWhere('ta.fechaProgramada >= :fechaDesde', {
        fechaDesde: query.fechaDesde,
      });
    }

    if (query.fechaHasta) {
      qb.andWhere('ta.fechaProgramada <= :fechaHasta', {
        fechaHasta: query.fechaHasta,
      });
    }

    const [items, total] = await qb.getManyAndCount();

    return {
      items: items.map((item) => this.toActivityResponse(item)),
      page,
      limit,
      total,
    };
  }

  async buildExcel(
    query: QueryTechnicalActivitiesDto,
    actor: AuthenticatedUser,
  ): Promise<Buffer> {
    if (!this.canListGlobal(actor)) {
      throw new ForbiddenException(
        'No tiene permisos para exportar actividades técnicas.',
      );
    }

    this.ensureValidDateRange(query.fechaDesde, query.fechaHasta);

    const qb = this.buildBaseDetailsQuery().orderBy('ta.createdAt', 'DESC');

    if (query.tipoActividad) {
      qb.andWhere('ta.tipoActividad = :tipoActividad', {
        tipoActividad: query.tipoActividad,
      });
    }

    if (query.estado) {
      qb.andWhere('ta.estado = :estado', {
        estado: query.estado,
      });
    }

    if (query.prioridad) {
      qb.andWhere('ta.prioridad = :prioridad', {
        prioridad: query.prioridad,
      });
    }

    if (query.tecnicoAsignadoId) {
      qb.andWhere('ta.tecnicoAsignadoId = :tecnicoAsignadoId', {
        tecnicoAsignadoId: query.tecnicoAsignadoId,
      });
    }

    if (query.chargingPointId) {
      qb.andWhere('ta.chargingPointId = :chargingPointId', {
        chargingPointId: query.chargingPointId,
      });
    }

    if (query.fechaDesde) {
      qb.andWhere('ta.fechaProgramada >= :fechaDesde', {
        fechaDesde: query.fechaDesde,
      });
    }

    if (query.fechaHasta) {
      qb.andWhere('ta.fechaProgramada <= :fechaHasta', {
        fechaHasta: query.fechaHasta,
      });
    }

    const items = await qb.getMany();

    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'ChargeLox';
    workbook.created = new Date();

    const worksheet = workbook.addWorksheet('Actividades técnicas');
    worksheet.columns = [
      { header: 'titulo', key: 'titulo', width: 40 },
      { header: 'tipoActividad', key: 'tipoActividad', width: 26 },
      { header: 'estado', key: 'estado', width: 18 },
      { header: 'prioridad', key: 'prioridad', width: 16 },
      { header: 'tecnicoAsignado', key: 'tecnicoAsignado', width: 28 },
      { header: 'supervisorAsignador', key: 'supervisorAsignador', width: 28 },
      { header: 'fechaProgramada', key: 'fechaProgramada', width: 18 },
      { header: 'puntoRelacionado', key: 'puntoRelacionado', width: 32 },
      { header: 'createdAt', key: 'createdAt', width: 22 },
      { header: 'updatedAt', key: 'updatedAt', width: 22 },
    ];

    items.forEach((item) => {
      worksheet.addRow({
        titulo: item.titulo,
        tipoActividad: item.tipoActividad,
        estado: item.estado,
        prioridad: item.prioridad,
        tecnicoAsignado: item.tecnicoAsignado?.nombres ?? '-',
        supervisorAsignador: item.supervisorAsignador?.nombres ?? '-',
        fechaProgramada: item.fechaProgramada,
        puntoRelacionado: item.chargingPoint?.nombre ?? '-',
        createdAt: item.createdAt?.toISOString() ?? '',
        updatedAt: item.updatedAt?.toISOString() ?? '',
      });
    });

    const headerRow = worksheet.getRow(1);
    headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF1E7BE8' },
    };
    headerRow.alignment = { vertical: 'middle', horizontal: 'left' };

    worksheet.views = [{ state: 'frozen', ySplit: 1 }];

    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.isBuffer(buffer) ? buffer : Buffer.from(buffer);
  }

  async findOne(id: string, actor: AuthenticatedUser) {
    const activity = await this.buildBaseDetailsQuery()
      .where('ta.id = :id', { id })
      .getOne();

    if (!activity) {
      throw new NotFoundException('Actividad técnica no encontrada.');
    }

    this.ensureCanView(activity, actor);
    return this.toActivityResponse(activity);
  }

  async update(
    id: string,
    dto: UpdateTechnicalActivityDto,
    actor: AuthenticatedUser,
  ) {
    if (dto.estado !== undefined) {
      throw new BadRequestException(
        'Para cambiar estado use el endpoint /technical-activities/:id/status.',
      );
    }

    const activity = await this.technicalActivitiesRepository.findOne({
      where: { id },
    });
    if (!activity) {
      throw new NotFoundException('Actividad técnica no encontrada.');
    }

    this.ensureCanEdit(activity, actor);

    if (this.isTechnician(actor)) {
      const hasRestrictedField = this.restrictedTechnicianFields.some(
        (fieldName) => dto[fieldName] !== undefined,
      );

      if (hasRestrictedField) {
        throw new ForbiddenException(
          'El técnico solo puede actualizar datos de ejecución.',
        );
      }
    }

    if (dto.tecnicoAsignadoId) {
      await this.getActiveTechnician(dto.tecnicoAsignadoId);
    }

    if (dto.chargingPointId !== undefined) {
      await this.ensureChargingPointExists(dto.chargingPointId);
    }

    const previousTechnicianId = activity.tecnicoAsignadoId;

    Object.assign(activity, {
      ...dto,
      fechaLimite: dto.fechaLimite ?? activity.fechaLimite,
      fechaEjecucion: dto.fechaEjecucion ?? activity.fechaEjecucion,
      fechaInstalacion: dto.fechaInstalacion ?? activity.fechaInstalacion,
      chargingPointId: dto.chargingPointId ?? activity.chargingPointId,
    });

    const saved = await this.technicalActivitiesRepository.save(activity);

    await this.addHistory({
      activityId: saved.id,
      actor,
      accion: 'UPDATED',
      descripcion: 'Actividad técnica actualizada.',
    });

    if (
      dto.tecnicoAsignadoId &&
      dto.tecnicoAsignadoId !== previousTechnicianId &&
      dto.tecnicoAsignadoId !== actor.id
    ) {
      await this.notifyAssignment(
        saved,
        actor,
        'Actividad técnica reasignada',
        `${actor.nombres} te reasignó la actividad "${saved.titulo}".`,
      );
    }

    await this.auditLogsService.log({
      entidad: 'TechnicalActivity',
      entidadId: saved.id,
      accion: AccionAuditoria.UPDATE,
      resumenCambio: 'Actualización de actividad técnica.',
      actor,
    });

    return this.findOne(saved.id, actor);
  }

  async changeStatus(
    id: string,
    dto: ChangeTechnicalActivityStatusDto,
    actor: AuthenticatedUser,
  ) {
    const activity = await this.technicalActivitiesRepository.findOne({
      where: { id },
    });
    if (!activity) {
      throw new NotFoundException('Actividad técnica no encontrada.');
    }

    this.ensureCanEdit(activity, actor);
    this.validateStatusTransition(activity.estado, dto.estado, actor);

    const previousStatus = activity.estado;
    activity.estado = dto.estado;
    if (dto.observacionesEjecucion !== undefined) {
      activity.observacionesEjecucion = dto.observacionesEjecucion;
    }
    if (dto.observacionesCierre !== undefined) {
      activity.observacionesCierre = dto.observacionesCierre;
    }

    if (
      dto.estado === EstadoActividadTecnica.COMPLETADA &&
      !activity.fechaEjecucion
    ) {
      activity.fechaEjecucion = new Date().toISOString().slice(0, 10);
    }

    const saved = await this.technicalActivitiesRepository.save(activity);

    await this.addHistory({
      activityId: saved.id,
      actor,
      accion: 'STATUS_CHANGED',
      descripcion: `Estado actualizado de ${previousStatus} a ${saved.estado}.`,
      estadoAnterior: previousStatus,
      estadoNuevo: saved.estado,
    });

    await this.notifyStatusChanged(saved, actor, previousStatus);

    await this.auditLogsService.log({
      entidad: 'TechnicalActivity',
      entidadId: saved.id,
      accion: AccionAuditoria.UPDATE,
      resumenCambio: `Cambio de estado: ${previousStatus} -> ${saved.estado}.`,
      actor,
    });

    return this.findOne(saved.id, actor);
  }

  async addComment(
    activityId: string,
    dto: CreateTechnicalActivityCommentDto,
    actor: AuthenticatedUser,
  ) {
    const activity = await this.technicalActivitiesRepository.findOne({
      where: { id: activityId },
    });
    if (!activity) {
      throw new NotFoundException('Actividad técnica no encontrada.');
    }

    this.ensureCanCommentOnActivity(activity, actor);
    const previousStatus = activity.estado;

    if (dto.estadoNuevo) {
      this.validateStatusTransition(previousStatus, dto.estadoNuevo, actor);
      activity.estado = dto.estadoNuevo;
      await this.technicalActivitiesRepository.save(activity);
    }

    const comment = this.technicalCommentsRepository.create({
      actividadTecnicaId: activity.id,
      usuarioId: actor.id,
      nombreUsuario: actor.nombres,
      comentario: dto.comentario,
      estadoNuevo: dto.estadoNuevo ?? null,
    });
    const saved = await this.technicalCommentsRepository.save(comment);

    await this.addHistory({
      activityId: activity.id,
      actor,
      accion: 'COMMENT_ADDED',
      descripcion: 'Comentario agregado a la actividad técnica.',
      estadoAnterior:
        dto.estadoNuevo && previousStatus !== dto.estadoNuevo
          ? previousStatus
          : null,
      estadoNuevo: dto.estadoNuevo ?? null,
    });

    await this.notifyParticipants(
      activity,
      actor,
      'Nuevo comentario en actividad técnica',
      `${actor.nombres} comentó en la actividad "${activity.titulo}".`,
      'TECHNICAL_ACTIVITY_COMMENT_CREATED',
    );

    await this.auditLogsService.log({
      entidad: 'TechnicalActivityComment',
      entidadId: saved.id,
      accion: AccionAuditoria.CREATE,
      resumenCambio: 'Comentario creado en actividad técnica.',
      actor,
    });

    return saved;
  }

  async listComments(activityId: string, actor: AuthenticatedUser) {
    const activity = await this.technicalActivitiesRepository.findOne({
      where: { id: activityId },
    });
    if (!activity) {
      throw new NotFoundException('Actividad técnica no encontrada.');
    }

    this.ensureCanView(activity, actor);

    return this.technicalCommentsRepository.find({
      where: { actividadTecnicaId: activity.id },
      order: { createdAt: 'ASC' },
    });
  }

  async uploadEvidence(params: {
    activityId: string;
    file: Express.Multer.File;
    actor: AuthenticatedUser;
  }) {
    const activity = await this.technicalActivitiesRepository.findOne({
      where: { id: params.activityId },
    });
    if (!activity) {
      throw new NotFoundException('Actividad técnica no encontrada.');
    }

    this.ensureCanUploadEvidence(activity, params.actor);

    if (!this.allowedMimeTypes.includes(params.file.mimetype)) {
      throw new BadRequestException('Tipo de archivo no permitido.');
    }

    const maxSize = Number(process.env.MAX_FILE_SIZE_BYTES ?? 5_000_000);
    if (params.file.size > maxSize) {
      throw new BadRequestException('El archivo excede el tamaño permitido.');
    }

    const storageMode = this.getStorageMode();
    const uploadDir =
      process.env.TECHNICAL_EVIDENCE_UPLOAD_DIR ??
      'private_uploads/technical-evidences';
    const fullPath = join(process.cwd(), uploadDir, params.file.filename);

    let provider = TechnicalEvidenceStorageProvider.LOCAL;
    let localRoute: string | null = `${uploadDir}/${params.file.filename}`;
    let cloudinaryPublicId: string | null = null;
    let cloudinaryUrl: string | null = null;

    if (storageMode === 'cloudinary' && !this.cloudinaryService.isConfigured()) {
      throw new BadRequestException(
        'Cloudinary no está configurado. Complete CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY y CLOUDINARY_API_SECRET.',
      );
    }

    const canUseCloudinary =
      storageMode !== 'local' && this.cloudinaryService.isConfigured();

    if (canUseCloudinary) {
      try {
        const uploaded = await this.cloudinaryService.uploadLocalFile(fullPath);
        provider = TechnicalEvidenceStorageProvider.CLOUDINARY;
        cloudinaryPublicId = uploaded.publicId;
        cloudinaryUrl = uploaded.secureUrl;
        localRoute = null;

        if (existsSync(fullPath)) {
          await unlink(fullPath);
        }
      } catch (error) {
        if (storageMode === 'cloudinary') {
          throw new BadRequestException(
            'No fue posible subir la evidencia a Cloudinary.',
          );
        }
      }
    }

    const created = this.technicalEvidencesRepository.create({
      actividadTecnicaId: activity.id,
      subidoPorId: params.actor.id,
      nombreOriginal: params.file.originalname,
      nombreGuardado: params.file.filename,
      mimeType: params.file.mimetype,
      tamano: params.file.size,
      storageProvider: provider,
      rutaArchivo:
        provider === TechnicalEvidenceStorageProvider.LOCAL ? localRoute : null,
      cloudinaryPublicId,
      cloudinaryUrl,
    });

    const saved = await this.technicalEvidencesRepository.save(created);

    await this.addHistory({
      activityId: activity.id,
      actor: params.actor,
      accion: 'EVIDENCE_UPLOADED',
      descripcion: 'Evidencia técnica cargada en la actividad.',
    });

    await this.notifyParticipants(
      activity,
      params.actor,
      'Nueva evidencia en actividad técnica',
      `${params.actor.nombres} subió una evidencia en "${activity.titulo}".`,
      'TECHNICAL_ACTIVITY_EVIDENCE_CREATED',
    );

    await this.auditLogsService.log({
      entidad: 'TechnicalActivityEvidence',
      entidadId: saved.id,
      accion: AccionAuditoria.CREATE,
      resumenCambio: 'Evidencia cargada en actividad técnica.',
      actor: params.actor,
    });

    return this.toEvidenceResponse(saved);
  }

  async listEvidences(activityId: string, actor: AuthenticatedUser) {
    const activity = await this.technicalActivitiesRepository.findOne({
      where: { id: activityId },
    });
    if (!activity) {
      throw new NotFoundException('Actividad técnica no encontrada.');
    }

    this.ensureCanView(activity, actor);

    const evidences = await this.technicalEvidencesRepository.find({
      where: { actividadTecnicaId: activity.id },
      order: { createdAt: 'ASC' },
    });

    return evidences.map((item) => this.toEvidenceResponse(item));
  }

  async getEvidenceDownloadData(evidenceId: string, actor: AuthenticatedUser) {
    const evidence = await this.technicalEvidencesRepository.findOne({
      where: { id: evidenceId },
    });
    if (!evidence) {
      throw new NotFoundException('Evidencia no encontrada.');
    }

    const activity = await this.technicalActivitiesRepository.findOne({
      where: { id: evidence.actividadTecnicaId },
    });
    if (!activity) {
      throw new NotFoundException('Actividad técnica no encontrada.');
    }

    this.ensureCanView(activity, actor);

    if (
      evidence.storageProvider === TechnicalEvidenceStorageProvider.CLOUDINARY &&
      evidence.cloudinaryUrl
    ) {
      return {
        kind: 'cloudinary' as const,
        url: evidence.cloudinaryUrl,
      };
    }

    if (!evidence.rutaArchivo) {
      throw new NotFoundException('La evidencia local no está disponible.');
    }

    const fullPath = join(process.cwd(), evidence.rutaArchivo);
    if (!existsSync(fullPath)) {
      throw new NotFoundException('El archivo de evidencia no existe.');
    }

    return {
      kind: 'local' as const,
      fullPath,
      mimeType: evidence.mimeType,
      originalName: evidence.nombreOriginal,
    };
  }

  async listHistory(activityId: string, actor: AuthenticatedUser) {
    const activity = await this.technicalActivitiesRepository.findOne({
      where: { id: activityId },
    });
    if (!activity) {
      throw new NotFoundException('Actividad técnica no encontrada.');
    }

    this.ensureCanView(activity, actor);

    return this.technicalHistoryRepository.find({
      where: { actividadTecnicaId: activity.id },
      order: { createdAt: 'ASC' },
    });
  }

  async buildTechnicalActivityPdf(
    activityId: string,
    actor: AuthenticatedUser,
  ): Promise<Buffer> {
    const activity = (await this.findOne(
      activityId,
      actor,
    )) as unknown as Record<string, unknown>;

    const comments = await this.technicalCommentsRepository.find({
      where: { actividadTecnicaId: activityId },
      order: { createdAt: 'ASC' },
    });
    const evidences = await this.technicalEvidencesRepository.find({
      where: { actividadTecnicaId: activityId },
      order: { createdAt: 'ASC' },
    });

    return this.reportsService.buildTechnicalActivityPdf({
      activity,
      comments: comments as unknown as Array<Record<string, unknown>>,
      evidences: evidences as unknown as Array<Record<string, unknown>>,
    });
  }
}
