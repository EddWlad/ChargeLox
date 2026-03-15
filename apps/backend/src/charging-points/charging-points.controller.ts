import {
  Body,
  Controller,
  Delete,
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
import { Response } from 'express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { FileInterceptor } from '@nestjs/platform-express';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Public } from '../common/decorators/public.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { RolUsuario } from '../common/enums';
import { AuthenticatedUser } from '../common/interfaces/authenticated-user.interface';
import { CreateChargingPointDto } from './dto/create-charging-point.dto';
import { QueryChargingPointsDto } from './dto/query-charging-points.dto';
import { UpdateChargingPointDto } from './dto/update-charging-point.dto';
import { ChargingPointsService } from './charging-points.service';

@ApiTags('Puntos de carga / Electrolineras')
@Controller('charging-points')
export class ChargingPointsController {
  constructor(private readonly chargingPointsService: ChargingPointsService) {}

  @Public()
  @Get('public')
  @ApiOperation({
    summary: 'Listado público paginado de puntos/electrolineras.',
  })
  listPublic(@Query() query: QueryChargingPointsDto) {
    return this.chargingPointsService.listPublic(query);
  }

  @Public()
  @Get('public/pdf')
  @ApiOperation({ summary: 'Genera PDF del listado público.' })
  async publicPdf(
    @Query() query: QueryChargingPointsDto,
    @Res() res: Response,
  ) {
    const pdf = await this.chargingPointsService.buildPublicListPdf(query);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      'attachment; filename="listado-publico-puntos.pdf"',
    );
    res.send(pdf);
  }

  @Public()
  @Get('public/:id')
  @ApiOperation({ summary: 'Detalle público de punto/electrolinera.' })
  getPublic(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.chargingPointsService.findPublicById(id);
  }

  @Public()
  @Get('public/:id/pdf')
  @ApiOperation({ summary: 'Genera PDF del detalle público.' })
  async publicDetailPdf(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Res() res: Response,
  ) {
    const pdf = await this.chargingPointsService.buildPublicDetailPdf(id);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      'attachment; filename="detalle-publico-punto.pdf"',
    );
    res.send(pdf);
  }

  @ApiBearerAuth('access-token')
  @Get()
  @ApiOperation({ summary: 'Listado privado (incluye datos sensibles).' })
  listPrivate(@Query() query: QueryChargingPointsDto) {
    return this.chargingPointsService.listPrivate(query);
  }

  @ApiBearerAuth('access-token')
  @Get('export/excel')
  @Roles(RolUsuario.ADMINISTRADOR)
  @ApiOperation({ summary: 'Exporta a Excel todos los puntos para administración.' })
  async exportExcel(@Res() res: Response) {
    const excel = await this.chargingPointsService.buildPrivateExcel();
    const date = new Date().toISOString().slice(0, 10);

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="charging-points-${date}.xlsx"`,
    );
    res.send(excel);
  }

  @ApiBearerAuth('access-token')
  @Get(':id')
  @ApiOperation({ summary: 'Detalle privado por id (incluye serial/PUK).' })
  getPrivate(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.chargingPointsService.findOneOrFail(id);
  }

  @ApiBearerAuth('access-token')
  @Post()
  @Roles(RolUsuario.ADMINISTRADOR, RolUsuario.ANALISTA)
  @ApiOperation({ summary: 'Crea punto/electrolinera (admin o analista).' })
  create(
    @Body() dto: CreateChargingPointDto,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return this.chargingPointsService.create(dto, actor);
  }

  @ApiBearerAuth('access-token')
  @Patch(':id')
  @Roles(RolUsuario.ADMINISTRADOR)
  @ApiOperation({ summary: 'Actualiza punto/electrolinera (admin).' })
  update(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateChargingPointDto,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return this.chargingPointsService.update(id, dto, actor);
  }

  @ApiBearerAuth('access-token')
  @Patch(':id/image')
  @Roles(RolUsuario.ADMINISTRADOR)
  @ApiOperation({ summary: 'Sube imagen de punto/electrolinera (admin).' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: { image: { type: 'string', format: 'binary' } },
      required: ['image'],
    },
  })
  @UseInterceptors(
    FileInterceptor('image', {
      storage: diskStorage({
        destination:
          process.env.CHARGING_POINTS_UPLOAD_DIR ?? 'uploads/charging-points',
        filename: (_req, file, cb) => {
          const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
          cb(null, `cp-${unique}${extname(file.originalname)}`);
        },
      }),
      limits: {
        fileSize: Number(process.env.MAX_FILE_SIZE_BYTES ?? 5_000_000),
      },
    }),
  )
  updateImage(
    @Param('id', new ParseUUIDPipe()) id: string,
    @UploadedFile() file: Express.Multer.File,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    const imageUrl = `/uploads/charging-points/${file.filename}`;
    return this.chargingPointsService.updateImage(id, imageUrl, actor);
  }

  @ApiBearerAuth('access-token')
  @Delete(':id')
  @Roles(RolUsuario.ADMINISTRADOR)
  @ApiOperation({ summary: 'Elimina punto/electrolinera (admin).' })
  async remove(
    @Param('id', new ParseUUIDPipe()) id: string,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    await this.chargingPointsService.remove(id, actor);
    return { message: 'Punto/electrolinera eliminado.' };
  }
}
