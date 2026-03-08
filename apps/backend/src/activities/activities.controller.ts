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
import { ActivitiesService } from './activities.service';
import { ChangeActivityStatusDto } from './dto/change-activity-status.dto';
import { CreateActivityDto } from './dto/create-activity.dto';
import { QueryActivitiesDto } from './dto/query-activities.dto';
import { UpdateActivityDto } from './dto/update-activity.dto';

@ApiTags('Actividades (Novedades y Seguimientos)')
@ApiBearerAuth('access-token')
@Controller('activities')
export class ActivitiesController {
  constructor(private readonly activitiesService: ActivitiesService) {}

  @Post()
  @ApiOperation({ summary: 'Crea una actividad (novedad o seguimiento).' })
  create(
    @Body() dto: CreateActivityDto,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return this.activitiesService.create(dto, actor);
  }

  @Get('mine')
  @ApiOperation({ summary: 'Lista actividades del usuario autenticado.' })
  listMine(
    @CurrentUser() actor: AuthenticatedUser,
    @Query() query: QueryActivitiesDto,
  ) {
    return this.activitiesService.listMine(actor, query);
  }

  @Get('prioritarias')
  @ApiOperation({ summary: 'Lista actividades de prioridad ALTA.' })
  listPrioritarias(@CurrentUser() actor: AuthenticatedUser) {
    return this.activitiesService.listPrioritarias(actor);
  }

  @Get()
  @Roles(RolUsuario.ADMINISTRADOR)
  @ApiOperation({ summary: 'Lista global de actividades (solo admin).' })
  listAll(
    @CurrentUser() actor: AuthenticatedUser,
    @Query() query: QueryActivitiesDto,
  ) {
    return this.activitiesService.listAll(actor, query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtiene detalle de actividad.' })
  findOne(
    @Param('id', new ParseUUIDPipe()) id: string,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return this.activitiesService.findOne(id, actor);
  }

  @Get(':id/pdf')
  @ApiOperation({
    summary: 'Genera PDF de actividad + comentarios + adjuntos.',
  })
  async pdf(
    @Param('id', new ParseUUIDPipe()) id: string,
    @CurrentUser() actor: AuthenticatedUser,
    @Res() res: Response,
  ) {
    const pdf = await this.activitiesService.buildActivityPdf(id, actor);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      'attachment; filename="actividad-detalle.pdf"',
    );
    res.send(pdf);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Actualiza una actividad.' })
  update(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateActivityDto,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return this.activitiesService.update(id, dto, actor);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Cambia estado de actividad.' })
  changeStatus(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: ChangeActivityStatusDto,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return this.activitiesService.changeStatus(id, dto, actor);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Elimina una actividad.' })
  async remove(
    @Param('id', new ParseUUIDPipe()) id: string,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    await this.activitiesService.remove(id, actor);
    return { message: 'Actividad eliminada.' };
  }
}
