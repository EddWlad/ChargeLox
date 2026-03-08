import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { AuthenticatedUser } from '../common/interfaces/authenticated-user.interface';
import { MarkManyNotificationsDto } from './dto/mark-many-notifications.dto';
import { QueryNotificationsDto } from './dto/query-notifications.dto';
import { NotificationsService } from './notifications.service';

@ApiTags('Notificaciones')
@ApiBearerAuth('access-token')
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get('me')
  @ApiOperation({ summary: 'Lista notificaciones del usuario autenticado.' })
  listMine(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: QueryNotificationsDto,
  ) {
    return this.notificationsService.getMyNotifications(user.id, query);
  }

  @Patch(':id/read')
  @ApiOperation({ summary: 'Marca una notificación como leída.' })
  markRead(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', new ParseUUIDPipe()) id: string,
  ) {
    return this.notificationsService.markAsRead(user.id, id);
  }

  @Patch('me/read-many')
  @ApiOperation({ summary: 'Marca varias notificaciones como leídas.' })
  markMany(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: MarkManyNotificationsDto,
  ) {
    return this.notificationsService.markManyAsRead(user.id, dto.ids);
  }
}
