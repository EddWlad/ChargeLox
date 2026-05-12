import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  Res,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { createReadStream } from 'fs';
import { extname } from 'path';
import { Response } from 'express';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { RolUsuario } from '../common/enums';
import { AuthenticatedUser } from '../common/interfaces/authenticated-user.interface';
import { ChangeTechnicalActivityStatusDto } from './dto/change-technical-activity-status.dto';
import { CreateTechnicalActivityCommentDto } from './dto/create-technical-activity-comment.dto';
import { CreateTechnicalActivityDto } from './dto/create-technical-activity.dto';
import { QueryTechnicalActivitiesDto } from './dto/query-technical-activities.dto';
import { UpdateTechnicalActivityDto } from './dto/update-technical-activity.dto';
import { TechnicalActivitiesService } from './technical-activities.service';

@ApiTags('Actividades Técnicas')
@ApiBearerAuth('access-token')
@Controller('technical-activities')
export class TechnicalActivitiesController {
  constructor(
    private readonly technicalActivitiesService: TechnicalActivitiesService,
  ) {}

  @Post()
  @Roles(
    RolUsuario.ADMINISTRADOR,
    RolUsuario.SUPERVISOR,
    RolUsuario.ANALISTA,
  )
  @ApiOperation({ summary: 'Crea y asigna una actividad técnica.' })
  create(
    @Body() dto: CreateTechnicalActivityDto,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return this.technicalActivitiesService.create(dto, actor);
  }

  @Get('lookups/technicians')
  @Roles(
    RolUsuario.ADMINISTRADOR,
    RolUsuario.SUPERVISOR,
    RolUsuario.GESTOR_DE_VISITAS,
    RolUsuario.ANALISTA,
  )
  @ApiOperation({
    summary:
      'Lista usuarios activos con rol TECNICO para asignación de actividades.',
  })
  listAssignableTechnicians(@CurrentUser() actor: AuthenticatedUser) {
    return this.technicalActivitiesService.listAssignableTechnicians(actor);
  }

  @Get()
  @Roles(
    RolUsuario.ADMINISTRADOR,
    RolUsuario.SUPERVISOR,
    RolUsuario.GESTOR_DE_VISITAS,
    RolUsuario.ANALISTA,
  )
  @ApiOperation({
    summary:
      'Lista global de actividades técnicas (admin/supervisor/analista lectura).',
  })
  list(
    @Query() query: QueryTechnicalActivitiesDto,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return this.technicalActivitiesService.list(actor, query);
  }

  @Get('mine')
  @Roles(RolUsuario.TECNICO)
  @ApiOperation({ summary: 'Lista actividades técnicas del técnico autenticado.' })
  listMine(
    @Query() query: QueryTechnicalActivitiesDto,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return this.technicalActivitiesService.listMine(actor, query);
  }

  @Get('export/excel')
  @Roles(
    RolUsuario.ADMINISTRADOR,
    RolUsuario.SUPERVISOR,
    RolUsuario.GESTOR_DE_VISITAS,
    RolUsuario.ANALISTA,
  )
  @ApiOperation({
    summary:
      'Exporta Excel de actividades técnicas (supervisor/admin) con filtro opcional por fecha programada.',
  })
  async exportExcel(
    @Query() query: QueryTechnicalActivitiesDto,
    @CurrentUser() actor: AuthenticatedUser,
    @Res() res: Response,
  ) {
    const excel = await this.technicalActivitiesService.buildExcel(query, actor);
    const date = new Date().toISOString().slice(0, 10);

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="technical-activities-${date}.xlsx"`,
    );
    res.send(excel);
  }

  @Get('evidences/file/:evidenceId')
  @ApiOperation({ summary: 'Descarga/visualiza evidencia técnica por id.' })
  async downloadEvidence(
    @Param('evidenceId', new ParseUUIDPipe()) evidenceId: string,
    @CurrentUser() actor: AuthenticatedUser,
    @Res() res: Response,
  ) {
    const data = await this.technicalActivitiesService.getEvidenceDownloadData(
      evidenceId,
      actor,
    );

    if (data.kind === 'cloudinary') {
      return res.redirect(data.url);
    }

    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${data.originalName}"`,
    );
    res.setHeader('Content-Type', data.mimeType);
    const stream = createReadStream(data.fullPath);
    stream.pipe(res);
    return;
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtiene detalle de actividad técnica.' })
  findOne(
    @Param('id', new ParseUUIDPipe()) id: string,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return this.technicalActivitiesService.findOne(id, actor);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Actualiza una actividad técnica.' })
  update(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateTechnicalActivityDto,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return this.technicalActivitiesService.update(id, dto, actor);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Cambia estado de actividad técnica.' })
  changeStatus(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: ChangeTechnicalActivityStatusDto,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return this.technicalActivitiesService.changeStatus(id, dto, actor);
  }

  @Post(':id/comments')
  @ApiOperation({ summary: 'Agrega comentario de seguimiento técnico.' })
  addComment(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: CreateTechnicalActivityCommentDto,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return this.technicalActivitiesService.addComment(id, dto, actor);
  }

  @Get(':id/comments')
  @ApiOperation({ summary: 'Lista comentarios de una actividad técnica.' })
  listComments(
    @Param('id', new ParseUUIDPipe()) id: string,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return this.technicalActivitiesService.listComments(id, actor);
  }

  @Post(':id/evidences/upload')
  @ApiOperation({ summary: 'Sube evidencia (foto/documento) a actividad técnica.' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary' },
      },
      required: ['file'],
    },
  })
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination:
          process.env.TECHNICAL_EVIDENCE_UPLOAD_DIR ??
          'private_uploads/technical-evidences',
        filename: (_req, file, cb) => {
          const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
          cb(null, `technical-${unique}${extname(file.originalname)}`);
        },
      }),
      limits: {
        fileSize: Number(process.env.MAX_FILE_SIZE_BYTES ?? 5_000_000),
      },
    }),
  )
  uploadEvidence(
    @Param('id', new ParseUUIDPipe()) id: string,
    @UploadedFile() file: Express.Multer.File,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return this.technicalActivitiesService.uploadEvidence({
      activityId: id,
      file,
      actor,
    });
  }

  @Post(':id/access-permit/upload')
  @Roles(RolUsuario.ADMINISTRADOR, RolUsuario.GESTOR_DE_VISITAS)
  @ApiOperation({
    summary:
      'Adjunta documento de permiso de acceso para habilitar actividad técnica.',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary' },
      },
      required: ['file'],
    },
  })
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination:
          process.env.ACCESS_PERMITS_UPLOAD_DIR ??
          'private_uploads/access-permits',
        filename: (_req, file, cb) => {
          const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
          cb(null, `access-permit-${unique}${extname(file.originalname)}`);
        },
      }),
      limits: {
        fileSize: Number(process.env.MAX_FILE_SIZE_BYTES ?? 5_000_000),
      },
    }),
  )
  uploadAccessPermit(
    @Param('id', new ParseUUIDPipe()) id: string,
    @UploadedFile() file: Express.Multer.File,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return this.technicalActivitiesService.uploadAccessPermit({
      activityId: id,
      file,
      actor,
    });
  }

  @Get(':id/access-permit')
  @ApiOperation({
    summary: 'Obtiene metadata del permiso de acceso de una actividad técnica.',
  })
  getAccessPermitMetadata(
    @Param('id', new ParseUUIDPipe()) id: string,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return this.technicalActivitiesService.getAccessPermitMetadata(id, actor);
  }

  @Get(':id/access-permit/file')
  @ApiOperation({ summary: 'Descarga/visualiza archivo de permiso de acceso.' })
  async downloadAccessPermit(
    @Param('id', new ParseUUIDPipe()) id: string,
    @CurrentUser() actor: AuthenticatedUser,
    @Res() res: Response,
  ) {
    const data = await this.technicalActivitiesService.getAccessPermitDownloadData(
      id,
      actor,
    );

    if (data.kind === 'cloudinary') {
      return res.redirect(data.url);
    }

    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${data.fileName}"`,
    );
    res.setHeader('Content-Type', data.mimeType);
    createReadStream(data.fullPath).pipe(res);
    return;
  }

  @Get(':id/evidences')
  @ApiOperation({ summary: 'Lista evidencias de una actividad técnica.' })
  listEvidences(
    @Param('id', new ParseUUIDPipe()) id: string,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return this.technicalActivitiesService.listEvidences(id, actor);
  }

  @Get(':id/history')
  @ApiOperation({ summary: 'Lista historial de cambios de la actividad técnica.' })
  listHistory(
    @Param('id', new ParseUUIDPipe()) id: string,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return this.technicalActivitiesService.listHistory(id, actor);
  }

  @Get(':id/pdf')
  @ApiOperation({ summary: 'Genera PDF técnico completo de la actividad.' })
  async buildPdf(
    @Param('id', new ParseUUIDPipe()) id: string,
    @CurrentUser() actor: AuthenticatedUser,
    @Res() res: Response,
  ) {
    const pdf = await this.technicalActivitiesService.buildTechnicalActivityPdf(
      id,
      actor,
    );

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      'attachment; filename="actividad-tecnica.pdf"',
    );
    res.send(pdf);
  }
}
