import {
  Injectable,
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { extname } from 'path';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import { AccionAuditoria, RolUsuario } from '../common/enums';
import { AuthenticatedUser } from '../common/interfaces/authenticated-user.interface';
import { Activity, Attachment } from '../database/entities';

@Injectable()
export class AttachmentsService {
  private readonly allowedMimeTypes = (
    process.env.ALLOWED_FILE_MIME_TYPES ??
    'image/jpeg,image/png,image/webp,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/plain'
  )
    .split(',')
    .map((item) => item.trim());

  constructor(
    @InjectRepository(Attachment)
    private readonly attachmentsRepository: Repository<Attachment>,
    @InjectRepository(Activity)
    private readonly activitiesRepository: Repository<Activity>,
    private readonly auditLogsService: AuditLogsService,
  ) {}

  private async ensureActivityPermission(
    activityId: string,
    actor: AuthenticatedUser,
  ) {
    const activity = await this.activitiesRepository.findOne({
      where: { id: activityId },
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
        'No tiene permisos para adjuntar archivos a esta actividad.',
      );
    }

    return activity;
  }

  async saveAttachment(params: {
    activityId: string;
    file: Express.Multer.File;
    actor: AuthenticatedUser;
  }) {
    await this.ensureActivityPermission(params.activityId, params.actor);

    if (!this.allowedMimeTypes.includes(params.file.mimetype)) {
      throw new BadRequestException('Tipo de archivo no permitido.');
    }

    const maxSize = Number(process.env.MAX_FILE_SIZE_BYTES ?? 5_000_000);
    if (params.file.size > maxSize) {
      throw new BadRequestException('El archivo excede el tamaño permitido.');
    }

    const extension = extname(params.file.originalname)
      .replace('.', '')
      .toLowerCase();

    const created = this.attachmentsRepository.create({
      actividadId: params.activityId,
      nombreOriginal: params.file.originalname,
      nombreGuardado: params.file.filename,
      mimeType: params.file.mimetype,
      extension,
      tamano: params.file.size,
      rutaArchivo: `/uploads/activities/${params.file.filename}`,
      subidoPorId: params.actor.id,
    });

    const saved = await this.attachmentsRepository.save(created);

    await this.auditLogsService.log({
      entidad: 'Attachment',
      entidadId: saved.id,
      accion: AccionAuditoria.CREATE,
      resumenCambio: 'Archivo adjunto agregado a actividad.',
      actor: params.actor,
    });

    return saved;
  }

  async listByActivity(activityId: string, actor: AuthenticatedUser) {
    await this.ensureActivityPermission(activityId, actor);

    return this.attachmentsRepository.find({
      where: { actividadId: activityId },
      order: { createdAt: 'ASC' },
    });
  }

  async findOne(attachmentId: string, actor: AuthenticatedUser) {
    const attachment = await this.attachmentsRepository.findOne({
      where: { id: attachmentId },
    });

    if (!attachment) {
      throw new NotFoundException('Adjunto no encontrado.');
    }

    await this.ensureActivityPermission(attachment.actividadId, actor);
    return attachment;
  }
}
