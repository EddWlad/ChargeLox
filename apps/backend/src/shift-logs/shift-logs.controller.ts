import { Body, Controller, Get, Patch, Post, Query, Res } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Response } from 'express';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { RolUsuario } from '../common/enums';
import { AuthenticatedUser } from '../common/interfaces/authenticated-user.interface';
import { QueryShiftLogsDto } from './dto/query-shift-logs.dto';
import { StartShiftDto } from './dto/start-shift.dto';
import { ShiftLogsService } from './shift-logs.service';

@ApiTags('Turnos de monitoreo')
@ApiBearerAuth('access-token')
@Controller('shift-logs')
export class ShiftLogsController {
  constructor(private readonly shiftLogsService: ShiftLogsService) {}

  @Post('start')
  @ApiOperation({ summary: 'Inicia turno del usuario autenticado.' })
  start(@CurrentUser() user: AuthenticatedUser, @Body() dto: StartShiftDto) {
    return this.shiftLogsService.startShift(user, dto);
  }

  @Patch('finish')
  @ApiOperation({ summary: 'Finaliza turno abierto del usuario autenticado.' })
  finish(@CurrentUser() user: AuthenticatedUser) {
    return this.shiftLogsService.finishShift(user);
  }

  @Get('me')
  @ApiOperation({ summary: 'Historial de turnos del usuario autenticado.' })
  listMine(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: QueryShiftLogsDto,
  ) {
    return this.shiftLogsService.listMine(user.id, query);
  }

  @Get('me/pdf')
  @ApiOperation({
    summary: 'Genera PDF del historial de turnos del usuario autenticado.',
  })
  async myPdf(@CurrentUser() user: AuthenticatedUser, @Res() res: Response) {
    const pdf = await this.shiftLogsService.buildMyHistoryPdf(user.id);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      'attachment; filename="historial-turnos.pdf"',
    );
    res.send(pdf);
  }

  @Get()
  @Roles(RolUsuario.ADMINISTRADOR)
  @ApiOperation({ summary: 'Historial global de turnos (solo admin).' })
  listAll(@Query() query: QueryShiftLogsDto) {
    return this.shiftLogsService.listAll(query);
  }
}
