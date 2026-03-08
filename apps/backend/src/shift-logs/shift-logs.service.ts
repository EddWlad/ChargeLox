import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AccionAuditoria, EstadoTurno } from '../common/enums';
import { AuthenticatedUser } from '../common/interfaces/authenticated-user.interface';
import { ShiftLog } from '../database/entities';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import { ReportsService } from '../reports/reports.service';
import { QueryShiftLogsDto } from './dto/query-shift-logs.dto';
import { StartShiftDto } from './dto/start-shift.dto';

@Injectable()
export class ShiftLogsService {
  constructor(
    @InjectRepository(ShiftLog)
    private readonly shiftLogsRepository: Repository<ShiftLog>,
    private readonly auditLogsService: AuditLogsService,
    private readonly reportsService: ReportsService,
  ) {}

  private calculateTotalHours(start: Date, end: Date): number {
    const ms = end.getTime() - start.getTime();
    const hours = ms / (1000 * 60 * 60);
    return Number(hours.toFixed(2));
  }

  async startShift(user: AuthenticatedUser, dto: StartShiftDto) {
    const opened = await this.shiftLogsRepository.findOne({
      where: { usuarioId: user.id, estadoTurno: EstadoTurno.ABIERTO },
    });

    if (opened) {
      throw new BadRequestException(
        'No puede iniciar turno porque ya tiene uno abierto.',
      );
    }

    const now = new Date();
    const shift = this.shiftLogsRepository.create({
      usuarioId: user.id,
      fechaTurno: dto.fechaTurno ?? now.toISOString().slice(0, 10),
      horaInicio: now,
      estadoTurno: EstadoTurno.ABIERTO,
    });

    const saved = await this.shiftLogsRepository.save(shift);

    await this.auditLogsService.log({
      entidad: 'ShiftLog',
      entidadId: saved.id,
      accion: AccionAuditoria.CREATE,
      resumenCambio: 'Inicio de turno de monitoreo.',
      actor: user,
    });

    return saved;
  }

  async finishShift(user: AuthenticatedUser) {
    const opened = await this.shiftLogsRepository.findOne({
      where: { usuarioId: user.id, estadoTurno: EstadoTurno.ABIERTO },
      order: { createdAt: 'DESC' },
    });

    if (!opened) {
      throw new BadRequestException(
        'No existe un turno abierto para finalizar.',
      );
    }

    const endDate = new Date();
    opened.horaFin = endDate;
    opened.estadoTurno = EstadoTurno.CERRADO;
    opened.totalHoras = this.calculateTotalHours(opened.horaInicio, endDate);

    const saved = await this.shiftLogsRepository.save(opened);

    await this.auditLogsService.log({
      entidad: 'ShiftLog',
      entidadId: saved.id,
      accion: AccionAuditoria.UPDATE,
      resumenCambio: 'Cierre de turno de monitoreo.',
      actor: user,
    });

    return saved;
  }

  async listMine(userId: string, query: QueryShiftLogsDto) {
    return this.listInternal({
      page: query.page,
      limit: query.limit,
      usuarioId: userId,
    });
  }

  async listAll(query: QueryShiftLogsDto) {
    return this.listInternal({
      page: query.page,
      limit: query.limit,
      usuarioId: query.usuarioId,
    });
  }

  private async listInternal(params: {
    page?: number;
    limit?: number;
    usuarioId?: string;
  }) {
    const page = params.page ?? 1;
    const limit = params.limit ?? 10;

    const qb = this.shiftLogsRepository
      .createQueryBuilder('s')
      .orderBy('s.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    if (params.usuarioId) {
      qb.andWhere('s.usuarioId = :usuarioId', { usuarioId: params.usuarioId });
    }

    const [items, total] = await qb.getManyAndCount();
    return { items, page, limit, total };
  }

  async buildMyHistoryPdf(userId: string): Promise<Buffer> {
    const data = await this.listInternal({
      page: 1,
      limit: 1000,
      usuarioId: userId,
    });
    const serialized = data.items.map((item) => ({
      ...item,
      horaInicio: item.horaInicio.toISOString(),
      horaFin: item.horaFin ? item.horaFin.toISOString() : null,
    }));

    return this.reportsService.buildShiftHistoryPdf(
      serialized as Array<Record<string, unknown>>,
    );
  }
}
