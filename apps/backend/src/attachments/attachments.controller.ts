import {
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
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
import { Response } from 'express';
import { createReadStream } from 'fs';
import { join } from 'path';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { FileInterceptor } from '@nestjs/platform-express';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { AuthenticatedUser } from '../common/interfaces/authenticated-user.interface';
import { AttachmentsService } from './attachments.service';

@ApiTags('Adjuntos')
@ApiBearerAuth('access-token')
@Controller('attachments')
export class AttachmentsController {
  constructor(private readonly attachmentsService: AttachmentsService) {}

  @Post(':activityId/upload')
  @ApiOperation({ summary: 'Sube archivo adjunto a actividad.' })
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
        destination: process.env.ACTIVITIES_UPLOAD_DIR ?? 'uploads/activities',
        filename: (_req, file, cb) => {
          const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
          cb(null, `activity-${unique}${extname(file.originalname)}`);
        },
      }),
      limits: {
        fileSize: Number(process.env.MAX_FILE_SIZE_BYTES ?? 5_000_000),
      },
    }),
  )
  upload(
    @Param('activityId', new ParseUUIDPipe()) activityId: string,
    @UploadedFile() file: Express.Multer.File,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return this.attachmentsService.saveAttachment({
      activityId,
      file,
      actor,
    });
  }

  @Get(':activityId')
  @ApiOperation({ summary: 'Lista adjuntos de una actividad.' })
  listByActivity(
    @Param('activityId', new ParseUUIDPipe()) activityId: string,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return this.attachmentsService.listByActivity(activityId, actor);
  }

  @Get('file/:attachmentId')
  @ApiOperation({ summary: 'Descarga un archivo adjunto.' })
  async download(
    @Param('attachmentId', new ParseUUIDPipe()) attachmentId: string,
    @CurrentUser() actor: AuthenticatedUser,
    @Res() res: Response,
  ) {
    const attachment = await this.attachmentsService.findOne(
      attachmentId,
      actor,
    );
    const baseDir = process.env.ACTIVITIES_UPLOAD_DIR ?? 'uploads/activities';
    const fullPath = join(process.cwd(), baseDir, attachment.nombreGuardado);

    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${attachment.nombreOriginal}"`,
    );
    res.setHeader('Content-Type', attachment.mimeType);

    const fileStream = createReadStream(fullPath);
    fileStream.pipe(res);
  }
}
