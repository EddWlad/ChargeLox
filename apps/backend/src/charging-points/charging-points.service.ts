import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import { AccionAuditoria } from '../common/enums';
import { AuthenticatedUser } from '../common/interfaces/authenticated-user.interface';
import { ChargingPoint } from '../database/entities';
import { ReportsService } from '../reports/reports.service';
import ExcelJS from 'exceljs';
import { CreateChargingPointDto } from './dto/create-charging-point.dto';
import { QueryChargingPointsDto } from './dto/query-charging-points.dto';
import { UpdateChargingPointDto } from './dto/update-charging-point.dto';

@Injectable()
export class ChargingPointsService {
  constructor(
    @InjectRepository(ChargingPoint)
    private readonly chargingPointsRepository: Repository<ChargingPoint>,
    private readonly auditLogsService: AuditLogsService,
    private readonly reportsService: ReportsService,
  ) {}

  private publicProjection(chargingPoint: ChargingPoint) {
    const safe: Partial<ChargingPoint> = { ...chargingPoint };
    delete safe.serial;
    delete safe.puk;
    return safe;
  }

  async create(dto: CreateChargingPointDto, actor: AuthenticatedUser) {
    const existing = await this.chargingPointsRepository.findOne({
      where: { codigoAsignado: dto.codigoAsignado },
    });

    if (existing) {
      throw new ConflictException('El código asignado ya existe.');
    }

    const created = this.chargingPointsRepository.create({
      ...dto,
      tipo: dto.tipo,
      imagenUrl: null,
    });

    const saved = await this.chargingPointsRepository.save(created);

    await this.auditLogsService.log({
      entidad: 'ChargingPoint',
      entidadId: saved.id,
      accion: AccionAuditoria.CREATE,
      resumenCambio: 'Creación de punto de carga/electrolinera.',
      actor,
    });

    return saved;
  }

  async listPublic(query: QueryChargingPointsDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;

    const qb = this.chargingPointsRepository
      .createQueryBuilder('cp')
      .orderBy('cp.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    if (query.search) {
      qb.andWhere(
        '(cp.nombre ILIKE :search OR cp.codigoAsignado ILIKE :search)',
        {
          search: `%${query.search}%`,
        },
      );
    }

    if (query.estadoConexion) {
      qb.andWhere('cp.estadoConexion = :estadoConexion', {
        estadoConexion: query.estadoConexion,
      });
    }

    if (query.prioridad) {
      qb.andWhere('cp.prioridad = :prioridad', { prioridad: query.prioridad });
    }

    const [items, total] = await qb.getManyAndCount();

    return {
      items: items.map((item) => this.publicProjection(item)),
      page,
      limit,
      total,
    };
  }

  async listPrivate(query: QueryChargingPointsDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;

    const qb = this.chargingPointsRepository
      .createQueryBuilder('cp')
      .orderBy('cp.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    if (query.search) {
      qb.andWhere(
        '(cp.nombre ILIKE :search OR cp.codigoAsignado ILIKE :search)',
        {
          search: `%${query.search}%`,
        },
      );
    }

    if (query.estadoConexion) {
      qb.andWhere('cp.estadoConexion = :estadoConexion', {
        estadoConexion: query.estadoConexion,
      });
    }

    if (query.prioridad) {
      qb.andWhere('cp.prioridad = :prioridad', { prioridad: query.prioridad });
    }

    const [items, total] = await qb.getManyAndCount();

    return {
      items,
      page,
      limit,
      total,
    };
  }

  async findOneOrFail(id: string): Promise<ChargingPoint> {
    const cp = await this.chargingPointsRepository.findOne({ where: { id } });
    if (!cp) {
      throw new NotFoundException(
        'Punto de carga/electrolinera no encontrado.',
      );
    }
    return cp;
  }

  async findPublicById(id: string) {
    const cp = await this.findOneOrFail(id);
    return this.publicProjection(cp);
  }

  async update(
    id: string,
    dto: UpdateChargingPointDto,
    actor: AuthenticatedUser,
  ) {
    const cp = await this.findOneOrFail(id);

    if (dto.codigoAsignado && dto.codigoAsignado !== cp.codigoAsignado) {
      const existing = await this.chargingPointsRepository.findOne({
        where: { codigoAsignado: dto.codigoAsignado },
      });
      if (existing) {
        throw new ConflictException('El código asignado ya existe.');
      }
    }

    Object.assign(cp, dto);
    const saved = await this.chargingPointsRepository.save(cp);

    await this.auditLogsService.log({
      entidad: 'ChargingPoint',
      entidadId: cp.id,
      accion: AccionAuditoria.UPDATE,
      resumenCambio: 'Actualización de punto de carga/electrolinera.',
      actor,
    });

    return saved;
  }

  async updateImage(id: string, imageUrl: string, actor: AuthenticatedUser) {
    const cp = await this.findOneOrFail(id);
    cp.imagenUrl = imageUrl;
    const saved = await this.chargingPointsRepository.save(cp);

    await this.auditLogsService.log({
      entidad: 'ChargingPoint',
      entidadId: cp.id,
      accion: AccionAuditoria.UPDATE,
      resumenCambio:
        'Actualización de imagen del punto de carga/electrolinera.',
      actor,
    });

    return saved;
  }

  async remove(id: string, actor: AuthenticatedUser): Promise<void> {
    const cp = await this.findOneOrFail(id);
    const chargingPointId = cp.id;

    await this.chargingPointsRepository.delete(chargingPointId);

    await this.auditLogsService.log({
      entidad: 'ChargingPoint',
      entidadId: chargingPointId,
      accion: AccionAuditoria.DELETE,
      resumenCambio: 'Eliminación de punto de carga/electrolinera.',
      actor,
    });
  }

  async buildPrivateExcel(): Promise<Buffer> {
    const items = await this.chargingPointsRepository.find({
      select: ['nombre', 'codigoAsignado', 'serial', 'puk', 'estadoConexion'],
      order: { createdAt: 'DESC' },
    });

    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'ChargeLox';
    workbook.created = new Date();

    const worksheet = workbook.addWorksheet('Puntos de carga');
    worksheet.columns = [
      { header: 'nombre', key: 'nombre', width: 32 },
      { header: 'codigoAsignado', key: 'codigoAsignado', width: 24 },
      { header: 'serial', key: 'serial', width: 30 },
      { header: 'puk', key: 'puk', width: 30 },
      { header: 'estadoConexion', key: 'estadoConexion', width: 20 },
    ];

    items.forEach((item) => {
      worksheet.addRow({
        nombre: item.nombre,
        codigoAsignado: item.codigoAsignado,
        serial: item.serial,
        puk: item.puk,
        estadoConexion: item.estadoConexion,
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
  async buildPublicListPdf(query: QueryChargingPointsDto): Promise<Buffer> {
    const data = await this.listPublic({ ...query, page: 1, limit: 1000 });
    return this.reportsService.buildChargingPointsListPdf(
      data.items as Array<Record<string, unknown>>,
    );
  }

  async buildPublicDetailPdf(id: string): Promise<Buffer> {
    const item = await this.findPublicById(id);
    return this.reportsService.buildChargingPointDetailPdf(
      item as Record<string, unknown>,
    );
  }
}

