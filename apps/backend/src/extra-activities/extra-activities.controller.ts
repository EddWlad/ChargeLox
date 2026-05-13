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
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Response } from 'express';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { RolUsuario } from '../common/enums';
import { AuthenticatedUser } from '../common/interfaces/authenticated-user.interface';
import { CancelExtraActivityDto } from './dto/cancel-extra-activity.dto';
import { FinishExtraActivityDto } from './dto/finish-extra-activity.dto';
import { QueryExtraActivitiesDto } from './dto/query-extra-activities.dto';
import { StartExtraActivityDto } from './dto/start-extra-activity.dto';
import { UpdateExtraActivityDto } from './dto/update-extra-activity.dto';
import { ExtraActivitiesService } from './extra-activities.service';

@ApiTags('Actividades Extraordinarias')
@ApiBearerAuth('access-token')
@Roles(RolUsuario.ADMINISTRADOR, RolUsuario.ANALISTA)
@Controller('extra-activities')
export class ExtraActivitiesController {
  constructor(private readonly extraActivitiesService: ExtraActivitiesService) {}

  @Post('start')
  @ApiOperation({ summary: 'Inicia una actividad extraordinaria del usuario autenticado.' })
  start(
    @Body() dto: StartExtraActivityDto,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return this.extraActivitiesService.start(dto, actor);
  }

  @Get('me/active')
  @ApiOperation({ summary: 'Obtiene la actividad extraordinaria activa del usuario autenticado.' })
  getMyActive(@CurrentUser() actor: AuthenticatedUser) {
    return this.extraActivitiesService.getMyActive(actor);
  }

  @Get('summary/me')
  @ApiOperation({ summary: 'Resumen del usuario autenticado en actividades extraordinarias.' })
  summaryMe(@CurrentUser() actor: AuthenticatedUser) {
    return this.extraActivitiesService.summaryMe(actor);
  }

  @Get('summary')
  @Roles(RolUsuario.ADMINISTRADOR)
  @ApiOperation({ summary: 'Resumen global de actividades extraordinarias (solo admin).' })
  summary(@CurrentUser() actor: AuthenticatedUser) {
    return this.extraActivitiesService.summaryGlobal(actor);
  }

  @Get('lookups/analysts')
  @ApiOperation({ summary: 'Listado de analistas activos para filtros administrativos.' })
  listAnalysts(@CurrentUser() actor: AuthenticatedUser) {
    return this.extraActivitiesService.listAnalysts(actor);
  }

  @Get('export/excel')
  @ApiOperation({ summary: 'Exporta actividades extraordinarias en Excel.' })
  async exportExcel(
    @Query() query: QueryExtraActivitiesDto,
    @CurrentUser() actor: AuthenticatedUser,
    @Res() res: Response,
  ) {
    const excel = await this.extraActivitiesService.buildExcel(query, actor);
    const date = new Date().toISOString().slice(0, 10);

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="extra-activities-${date}.xlsx"`,
    );
    res.send(excel);
  }

  @Get()
  @ApiOperation({ summary: 'Lista actividades extraordinarias con filtros y paginación.' })
  list(
    @Query() query: QueryExtraActivitiesDto,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return this.extraActivitiesService.list(query, actor);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtiene detalle de una actividad extraordinaria.' })
  findOne(
    @Param('id', new ParseUUIDPipe()) id: string,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return this.extraActivitiesService.findOne(id, actor);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Actualiza campos permitidos de una actividad extraordinaria.' })
  update(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateExtraActivityDto,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return this.extraActivitiesService.update(id, dto, actor);
  }

  @Patch(':id/finish')
  @ApiOperation({ summary: 'Finaliza una actividad extraordinaria en progreso.' })
  finish(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: FinishExtraActivityDto,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return this.extraActivitiesService.finish(id, dto, actor);
  }

  @Patch(':id/cancel')
  @ApiOperation({ summary: 'Cancela una actividad extraordinaria en progreso.' })
  cancel(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: CancelExtraActivityDto,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return this.extraActivitiesService.cancel(id, dto, actor);
  }

  @Delete(':id')
  @Roles(RolUsuario.ADMINISTRADOR)
  @ApiOperation({ summary: 'Elimina una actividad extraordinaria (solo admin).' })
  remove(
    @Param('id', new ParseUUIDPipe()) id: string,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return this.extraActivitiesService.remove(id, actor);
  }
}
