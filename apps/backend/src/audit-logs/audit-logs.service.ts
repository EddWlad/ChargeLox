import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AccionAuditoria } from '../common/enums';
import { AuthenticatedUser } from '../common/interfaces/authenticated-user.interface';
import { AuditLog } from '../database/entities';
import { QueryAuditLogsDto } from './dto/query-audit-logs.dto';

@Injectable()
export class AuditLogsService {
  constructor(
    @InjectRepository(AuditLog)
    private readonly auditLogsRepository: Repository<AuditLog>,
  ) {}

  async log(params: {
    entidad: string;
    entidadId: string;
    accion: AccionAuditoria;
    resumenCambio: string;
    actor?: AuthenticatedUser | null;
  }): Promise<void> {
    const entityIdSafe = params.entidadId?.trim() || 'UNKNOWN';

    const audit = this.auditLogsRepository.create({
      entidad: params.entidad,
      entidadId: entityIdSafe,
      accion: params.accion,
      resumenCambio: params.resumenCambio,
      usuarioId: params.actor?.id ?? null,
      usuarioEmail: params.actor?.email ?? null,
    });

    await this.auditLogsRepository.save(audit);
  }

  async list(query: QueryAuditLogsDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;

    const qb = this.auditLogsRepository
      .createQueryBuilder('a')
      .orderBy('a.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    if (query.entidad) {
      qb.andWhere('a.entidad = :entidad', { entidad: query.entidad });
    }

    if (query.accion) {
      qb.andWhere('a.accion = :accion', { accion: query.accion });
    }

    const [items, total] = await qb.getManyAndCount();

    return {
      items,
      page,
      limit,
      total,
    };
  }
}
