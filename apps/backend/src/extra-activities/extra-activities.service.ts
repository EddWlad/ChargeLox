import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import ExcelJS from 'exceljs';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import {
  AccionAuditoria,
  ExtraActivityPriority,
  ExtraActivityStatus,
  ExtraActivityType,
  RolUsuario,
  WorkTimeCategory,
} from '../common/enums';
import { AuthenticatedUser } from '../common/interfaces/authenticated-user.interface';
import { ExtraActivity, User } from '../database/entities';
import { CancelExtraActivityDto } from './dto/cancel-extra-activity.dto';
import { FinishExtraActivityDto } from './dto/finish-extra-activity.dto';
import { QueryExtraActivitiesDto } from './dto/query-extra-activities.dto';
import { StartExtraActivityDto } from './dto/start-extra-activity.dto';
import { UpdateExtraActivityDto } from './dto/update-extra-activity.dto';

const OUTSIDE_SHIFT_CATEGORIES: WorkTimeCategory[] = [
  WorkTimeCategory.OUTSIDE_SHIFT,
  WorkTimeCategory.WEEKEND_OR_HOLIDAY,
  WorkTimeCategory.EMERGENCY,
  WorkTimeCategory.MIXED,
];

@Injectable()
export class ExtraActivitiesService {
  constructor(
    @InjectRepository(ExtraActivity)
    private readonly extraActivitiesRepository: Repository<ExtraActivity>,
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    private readonly auditLogsService: AuditLogsService,
  ) {}

  private isAdmin(actor: AuthenticatedUser): boolean {
    return actor.rol === RolUsuario.ADMINISTRADOR;
  }

  private isAnalyst(actor: AuthenticatedUser): boolean {
    return actor.rol === RolUsuario.ANALISTA;
  }

  private ensureCanUseModule(actor: AuthenticatedUser): void {
    if (this.isAdmin(actor) || this.isAnalyst(actor)) {
      return;
    }

    throw new ForbiddenException(
      'No tiene permisos para acceder al módulo de actividades extra.',
    );
  }

  private normalizeOptional(value?: string | null): string | null {
    const normalized = value?.trim();
    return normalized ? normalized : null;
  }

  private validateDateRange(dateFrom?: string, dateTo?: string): void {
    if (!dateFrom || !dateTo) {
      return;
    }

    const from = new Date(dateFrom);
    const to = new Date(dateTo);
    if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime())) {
      throw new BadRequestException('Rango de fechas inválido.');
    }

    if (from.getTime() > to.getTime()) {
      throw new BadRequestException(
        'La fecha desde no puede ser mayor que la fecha hasta.',
      );
    }
  }

  private minutesToHours(minutes: number): number {
    return Number((minutes / 60).toFixed(2));
  }

  private calculateDurationMinutes(startedAt: Date, endedAt: Date): number {
    const minutes = Math.round((endedAt.getTime() - startedAt.getTime()) / 60000);
    return Math.max(0, minutes);
  }

  private ensureCanViewActivity(
    activity: Pick<ExtraActivity, 'userId'>,
    actor: AuthenticatedUser,
  ): void {
    if (this.isAdmin(actor) || activity.userId === actor.id) {
      return;
    }

    throw new ForbiddenException(
      'No tiene permisos para ver esta actividad extraordinaria.',
    );
  }

  private ensureCanUpdateActivity(
    activity: Pick<ExtraActivity, 'userId'>,
    actor: AuthenticatedUser,
  ): void {
    if (this.isAdmin(actor) || activity.userId === actor.id) {
      return;
    }

    throw new ForbiddenException(
      'No tiene permisos para modificar esta actividad extraordinaria.',
    );
  }

  private ensureCanDelete(actor: AuthenticatedUser): void {
    if (this.isAdmin(actor)) {
      return;
    }

    throw new ForbiddenException(
      'Solo el administrador puede eliminar actividades extraordinarias.',
    );
  }

  private buildBaseQuery(): SelectQueryBuilder<ExtraActivity> {
    return this.extraActivitiesRepository
      .createQueryBuilder('ea')
      .leftJoin('ea.user', 'u')
      .addSelect(['u.id', 'u.nombres', 'u.apellidos', 'u.email', 'u.rol']);
  }

  private applyFilters(
    qb: SelectQueryBuilder<ExtraActivity>,
    query: QueryExtraActivitiesDto,
    actor: AuthenticatedUser,
  ): void {
    if (!this.isAdmin(actor)) {
      qb.andWhere('ea.userId = :userId', { userId: actor.id });
    } else if (query.userId) {
      qb.andWhere('ea.userId = :userId', { userId: query.userId });
    }

    if (query.type) {
      qb.andWhere('ea.type = :type', { type: query.type });
    }
    if (query.status) {
      qb.andWhere('ea.status = :status', { status: query.status });
    }
    if (query.workTimeCategory) {
      qb.andWhere('ea.workTimeCategory = :workTimeCategory', {
        workTimeCategory: query.workTimeCategory,
      });
    }
    if (query.priority) {
      qb.andWhere('ea.priority = :priority', { priority: query.priority });
    }
    if (query.dateFrom) {
      qb.andWhere(`"ea"."started_at"::date >= :dateFrom`, {
        dateFrom: query.dateFrom,
      });
    }
    if (query.dateTo) {
      qb.andWhere(`"ea"."started_at"::date <= :dateTo`, {
        dateTo: query.dateTo,
      });
    }
    if (query.externalReference) {
      qb.andWhere('ea.externalReference ILIKE :externalReference', {
        externalReference: `%${query.externalReference}%`,
      });
    }
  }

  private toResponse(activity: ExtraActivity) {
    return {
      ...activity,
      user: activity.user
        ? {
            id: activity.user.id,
            nombres: activity.user.nombres,
            apellidos: activity.user.apellidos,
            email: activity.user.email,
            rol: activity.user.rol,
          }
        : null,
    };
  }

  async listAnalysts(actor: AuthenticatedUser) {
    this.ensureCanUseModule(actor);
    const users = await this.usersRepository.find({
      where: { rol: RolUsuario.ANALISTA, activo: true },
      select: ['id', 'nombres', 'apellidos', 'email', 'rol'],
      order: { nombres: 'ASC' },
    });

    return users;
  }

  async start(dto: StartExtraActivityDto, actor: AuthenticatedUser) {
    this.ensureCanUseModule(actor);

    const active = await this.extraActivitiesRepository.findOne({
      where: {
        userId: actor.id,
        status: ExtraActivityStatus.IN_PROGRESS,
      },
    });
    if (active) {
      throw new BadRequestException(
        'Ya tienes una actividad extra en progreso. Finalízala antes de iniciar otra.',
      );
    }

    const created = this.extraActivitiesRepository.create({
      userId: actor.id,
      type: dto.type,
      title: dto.title.trim(),
      description: this.normalizeOptional(dto.description),
      moduleName: this.normalizeOptional(dto.moduleName),
      priority: dto.priority,
      workTimeCategory: dto.workTimeCategory,
      externalReference: this.normalizeOptional(dto.externalReference),
      status: ExtraActivityStatus.IN_PROGRESS,
      startedAt: new Date(),
      endedAt: null,
      durationMinutes: null,
      resultDescription: null,
      evidenceUrl: null,
      evidenceFileName: null,
      evidenceMimeType: null,
    });

    const saved = await this.extraActivitiesRepository.save(created);

    await this.auditLogsService.log({
      entidad: 'ExtraActivity',
      entidadId: saved.id,
      accion: AccionAuditoria.CREATE,
      resumenCambio: 'Inicio de actividad extraordinaria.',
      actor,
    });

    return this.findOne(saved.id, actor);
  }

  async getMyActive(actor: AuthenticatedUser) {
    this.ensureCanUseModule(actor);
    const activity = await this.buildBaseQuery()
      .where('ea.userId = :userId', { userId: actor.id })
      .andWhere('ea.status = :status', { status: ExtraActivityStatus.IN_PROGRESS })
      .orderBy('ea.startedAt', 'DESC')
      .getOne();

    return activity ? this.toResponse(activity) : null;
  }

  async finish(
    id: string,
    dto: FinishExtraActivityDto,
    actor: AuthenticatedUser,
  ) {
    this.ensureCanUseModule(actor);

    const activity = await this.extraActivitiesRepository.findOne({ where: { id } });
    if (!activity) {
      throw new NotFoundException('Actividad extraordinaria no encontrada.');
    }

    this.ensureCanUpdateActivity(activity, actor);
    if (activity.status !== ExtraActivityStatus.IN_PROGRESS) {
      throw new BadRequestException(
        'Solo se pueden finalizar actividades en progreso.',
      );
    }

    const finishedAt = new Date();
    activity.endedAt = finishedAt;
    activity.durationMinutes = this.calculateDurationMinutes(
      activity.startedAt,
      finishedAt,
    );
    activity.status = ExtraActivityStatus.FINISHED;
    if (dto.resultDescription !== undefined) {
      activity.resultDescription = this.normalizeOptional(dto.resultDescription);
    }

    const saved = await this.extraActivitiesRepository.save(activity);
    await this.auditLogsService.log({
      entidad: 'ExtraActivity',
      entidadId: saved.id,
      accion: AccionAuditoria.UPDATE,
      resumenCambio: 'Actividad extraordinaria finalizada.',
      actor,
    });

    return this.findOne(saved.id, actor);
  }

  async cancel(
    id: string,
    dto: CancelExtraActivityDto,
    actor: AuthenticatedUser,
  ) {
    this.ensureCanUseModule(actor);

    const activity = await this.extraActivitiesRepository.findOne({ where: { id } });
    if (!activity) {
      throw new NotFoundException('Actividad extraordinaria no encontrada.');
    }

    this.ensureCanUpdateActivity(activity, actor);
    if (activity.status !== ExtraActivityStatus.IN_PROGRESS) {
      throw new BadRequestException(
        'Solo se pueden cancelar actividades en progreso.',
      );
    }

    const cancelledAt = new Date();
    activity.endedAt = cancelledAt;
    activity.durationMinutes = this.calculateDurationMinutes(
      activity.startedAt,
      cancelledAt,
    );
    activity.status = ExtraActivityStatus.CANCELLED;
    if (dto.reason !== undefined) {
      activity.resultDescription = this.normalizeOptional(dto.reason);
    }

    const saved = await this.extraActivitiesRepository.save(activity);
    await this.auditLogsService.log({
      entidad: 'ExtraActivity',
      entidadId: saved.id,
      accion: AccionAuditoria.UPDATE,
      resumenCambio: 'Actividad extraordinaria cancelada.',
      actor,
    });

    return this.findOne(saved.id, actor);
  }

  async update(id: string, dto: UpdateExtraActivityDto, actor: AuthenticatedUser) {
    this.ensureCanUseModule(actor);

    const activity = await this.extraActivitiesRepository.findOne({ where: { id } });
    if (!activity) {
      throw new NotFoundException('Actividad extraordinaria no encontrada.');
    }

    this.ensureCanUpdateActivity(activity, actor);

    Object.assign(activity, {
      type: dto.type ?? activity.type,
      title: dto.title?.trim() ?? activity.title,
      description:
        dto.description !== undefined
          ? this.normalizeOptional(dto.description)
          : activity.description,
      moduleName:
        dto.moduleName !== undefined
          ? this.normalizeOptional(dto.moduleName)
          : activity.moduleName,
      priority: dto.priority ?? activity.priority,
      workTimeCategory: dto.workTimeCategory ?? activity.workTimeCategory,
      externalReference:
        dto.externalReference !== undefined
          ? this.normalizeOptional(dto.externalReference)
          : activity.externalReference,
      resultDescription:
        dto.resultDescription !== undefined
          ? this.normalizeOptional(dto.resultDescription)
          : activity.resultDescription,
    });

    const saved = await this.extraActivitiesRepository.save(activity);
    await this.auditLogsService.log({
      entidad: 'ExtraActivity',
      entidadId: saved.id,
      accion: AccionAuditoria.UPDATE,
      resumenCambio: 'Actividad extraordinaria actualizada.',
      actor,
    });

    return this.findOne(saved.id, actor);
  }

  async remove(id: string, actor: AuthenticatedUser) {
    this.ensureCanUseModule(actor);
    this.ensureCanDelete(actor);

    const activity = await this.extraActivitiesRepository.findOne({ where: { id } });
    if (!activity) {
      throw new NotFoundException('Actividad extraordinaria no encontrada.');
    }

    await this.extraActivitiesRepository.delete({ id });
    await this.auditLogsService.log({
      entidad: 'ExtraActivity',
      entidadId: id,
      accion: AccionAuditoria.DELETE,
      resumenCambio: 'Actividad extraordinaria eliminada por administrador.',
      actor,
    });

    return { message: 'Actividad extraordinaria eliminada.' };
  }

  async list(query: QueryExtraActivitiesDto, actor: AuthenticatedUser) {
    this.ensureCanUseModule(actor);
    this.validateDateRange(query.dateFrom, query.dateTo);

    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const qb = this.buildBaseQuery().orderBy('ea.startedAt', 'DESC');
    this.applyFilters(qb, query, actor);
    qb.skip((page - 1) * limit).take(limit);

    const [items, total] = await qb.getManyAndCount();
    return {
      items: items.map((item) => this.toResponse(item)),
      page,
      limit,
      total,
    };
  }

  async findOne(id: string, actor: AuthenticatedUser) {
    this.ensureCanUseModule(actor);

    const activity = await this.buildBaseQuery()
      .where('ea.id = :id', { id })
      .getOne();
    if (!activity) {
      throw new NotFoundException('Actividad extraordinaria no encontrada.');
    }

    this.ensureCanViewActivity(activity, actor);
    return this.toResponse(activity);
  }

  async summaryMe(actor: AuthenticatedUser) {
    this.ensureCanUseModule(actor);

    const raw = await this.extraActivitiesRepository
      .createQueryBuilder('ea')
      .select(
        `
          COALESCE(SUM(CASE
            WHEN ea.status = :finished
              AND "ea"."started_at"::date = CURRENT_DATE
            THEN COALESCE(ea.durationMinutes, 0)
            ELSE 0
          END), 0)
        `,
        'minutes_today',
      )
      .addSelect(
        `
          COALESCE(SUM(CASE
            WHEN ea.status = :finished
              AND date_trunc('month', "ea"."started_at") = date_trunc('month', now())
            THEN COALESCE(ea.durationMinutes, 0)
            ELSE 0
          END), 0)
        `,
        'minutes_month',
      )
      .addSelect(
        `
          COALESCE(SUM(CASE
            WHEN ea.status = :finished
              AND ea.workTimeCategory IN (:...outsideCategories)
              AND date_trunc('month', "ea"."started_at") = date_trunc('month', now())
            THEN COALESCE(ea.durationMinutes, 0)
            ELSE 0
          END), 0)
        `,
        'minutes_outside_shift',
      )
      .addSelect(
        `
          COALESCE(SUM(CASE
            WHEN ea.status = :finished THEN 1
            ELSE 0
          END), 0)
        `,
        'finished_count',
      )
      .where('ea.userId = :userId', { userId: actor.id })
      .setParameters({
        finished: ExtraActivityStatus.FINISHED,
        outsideCategories: OUTSIDE_SHIFT_CATEGORIES,
      })
      .getRawOne<{
        minutes_today: string;
        minutes_month: string;
        minutes_outside_shift: string;
        finished_count: string;
      }>();

    const minutesToday = Number(raw?.minutes_today ?? 0);
    const minutesMonth = Number(raw?.minutes_month ?? 0);
    const minutesOutsideShift = Number(raw?.minutes_outside_shift ?? 0);
    const finishedCount = Number(raw?.finished_count ?? 0);
    const activeActivity = await this.getMyActive(actor);

    return {
      minutesToday,
      hoursToday: this.minutesToHours(minutesToday),
      minutesMonth,
      hoursMonth: this.minutesToHours(minutesMonth),
      minutesOutsideShift,
      hoursOutsideShift: this.minutesToHours(minutesOutsideShift),
      finishedCount,
      activeActivity,
    };
  }

  async summaryGlobal(actor: AuthenticatedUser) {
    this.ensureCanUseModule(actor);
    if (!this.isAdmin(actor)) {
      throw new ForbiddenException(
        'Solo el administrador puede ver el resumen global.',
      );
    }

    const totals = await this.extraActivitiesRepository
      .createQueryBuilder('ea')
      .select(
        `
          COALESCE(SUM(CASE
            WHEN ea.status = :finished
              AND date_trunc('month', "ea"."started_at") = date_trunc('month', now())
            THEN COALESCE(ea.durationMinutes, 0)
            ELSE 0
          END), 0)
        `,
        'minutes_month',
      )
      .addSelect(
        `
          COALESCE(SUM(CASE
            WHEN ea.status = :finished
              AND ea.workTimeCategory IN (:...outsideCategories)
              AND date_trunc('month', "ea"."started_at") = date_trunc('month', now())
            THEN COALESCE(ea.durationMinutes, 0)
            ELSE 0
          END), 0)
        `,
        'minutes_outside_shift',
      )
      .addSelect(
        `
          COALESCE(SUM(CASE
            WHEN ea.status = :finished THEN 1
            ELSE 0
          END), 0)
        `,
        'finished_count',
      )
      .addSelect(
        `
          COALESCE(SUM(CASE
            WHEN ea.status = :inProgress THEN 1
            ELSE 0
          END), 0)
        `,
        'in_progress_count',
      )
      .setParameters({
        finished: ExtraActivityStatus.FINISHED,
        inProgress: ExtraActivityStatus.IN_PROGRESS,
        outsideCategories: OUTSIDE_SHIFT_CATEGORIES,
      })
      .getRawOne<{
        minutes_month: string;
        minutes_outside_shift: string;
        finished_count: string;
        in_progress_count: string;
      }>();

    const rows = await this.extraActivitiesRepository
      .createQueryBuilder('ea')
      .innerJoin('ea.user', 'u')
      .select('u.id', 'user_id')
      .addSelect('u.nombres', 'user_nombres')
      .addSelect('u.apellidos', 'user_apellidos')
      .addSelect('u.email', 'user_email')
      .addSelect(
        `
          COALESCE(SUM(CASE
            WHEN ea.status = :finished
              AND date_trunc('month', "ea"."started_at") = date_trunc('month', now())
            THEN COALESCE(ea.durationMinutes, 0)
            ELSE 0
          END), 0)
        `,
        'minutes_month',
      )
      .addSelect(
        `
          COALESCE(SUM(CASE
            WHEN ea.status = :finished THEN 1
            ELSE 0
          END), 0)
        `,
        'finished_count',
      )
      .groupBy('u.id')
      .addGroupBy('u.nombres')
      .addGroupBy('u.apellidos')
      .addGroupBy('u.email')
      .orderBy('u.nombres', 'ASC')
      .setParameters({
        finished: ExtraActivityStatus.FINISHED,
      })
      .getRawMany<{
        user_id: string;
        user_nombres: string;
        user_apellidos: string | null;
        user_email: string;
        minutes_month: string;
        finished_count: string;
      }>();

    const minutesMonth = Number(totals?.minutes_month ?? 0);
    const minutesOutsideShift = Number(totals?.minutes_outside_shift ?? 0);
    const finishedCount = Number(totals?.finished_count ?? 0);
    const inProgressCount = Number(totals?.in_progress_count ?? 0);

    return {
      minutesMonth,
      hoursMonth: this.minutesToHours(minutesMonth),
      minutesOutsideShift,
      hoursOutsideShift: this.minutesToHours(minutesOutsideShift),
      finishedCount,
      inProgressCount,
      byUser: rows.map((row) => {
        const minutes = Number(row.minutes_month ?? 0);
        return {
          user: {
            id: row.user_id,
            nombres: row.user_nombres,
            apellidos: row.user_apellidos,
            email: row.user_email,
          },
          minutesMonth: minutes,
          hoursMonth: this.minutesToHours(minutes),
          finishedCount: Number(row.finished_count ?? 0),
        };
      }),
    };
  }

  async buildExcel(
    query: QueryExtraActivitiesDto,
    actor: AuthenticatedUser,
  ): Promise<Buffer> {
    this.ensureCanUseModule(actor);
    this.validateDateRange(query.dateFrom, query.dateTo);

    const qb = this.buildBaseQuery().orderBy('ea.startedAt', 'DESC');
    this.applyFilters(qb, query, actor);
    const items = await qb.getMany();

    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'ChargeLox';
    workbook.created = new Date();

    const worksheet = workbook.addWorksheet('Actividades Extra');
    worksheet.columns = [
      { header: 'fecha', key: 'fecha', width: 18 },
      { header: 'analista', key: 'analista', width: 32 },
      { header: 'tipo', key: 'tipo', width: 26 },
      { header: 'titulo', key: 'titulo', width: 40 },
      { header: 'modulo', key: 'modulo', width: 24 },
      { header: 'referenciaAzure', key: 'referenciaAzure', width: 20 },
      { header: 'jornada', key: 'jornada', width: 24 },
      { header: 'prioridad', key: 'prioridad', width: 14 },
      { header: 'horaInicio', key: 'horaInicio', width: 24 },
      { header: 'horaFin', key: 'horaFin', width: 24 },
      { header: 'duracionMinutos', key: 'duracionMinutos', width: 16 },
      { header: 'estado', key: 'estado', width: 16 },
      { header: 'descripcion', key: 'descripcion', width: 46 },
      { header: 'resultado', key: 'resultado', width: 46 },
    ];

    items.forEach((item) => {
      const analystName = item.user
        ? `${item.user.nombres}${item.user.apellidos ? ` ${item.user.apellidos}` : ''}`
        : '-';

      worksheet.addRow({
        fecha: item.startedAt.toISOString().slice(0, 10),
        analista: analystName,
        tipo: item.type,
        titulo: item.title,
        modulo: item.moduleName ?? '-',
        referenciaAzure: item.externalReference ?? '-',
        jornada: item.workTimeCategory,
        prioridad: item.priority,
        horaInicio: item.startedAt.toISOString(),
        horaFin: item.endedAt ? item.endedAt.toISOString() : '-',
        duracionMinutos: item.durationMinutes ?? 0,
        estado: item.status,
        descripcion: item.description ?? '-',
        resultado: item.resultDescription ?? '-',
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
}
