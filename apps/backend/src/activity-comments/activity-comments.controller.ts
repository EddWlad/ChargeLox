import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { AuthenticatedUser } from '../common/interfaces/authenticated-user.interface';
import { ActivityCommentsService } from './activity-comments.service';
import { CreateActivityCommentDto } from './dto/create-activity-comment.dto';

@ApiTags('Comentarios de actividades')
@ApiBearerAuth('access-token')
@Controller('activity-comments')
export class ActivityCommentsController {
  constructor(
    private readonly activityCommentsService: ActivityCommentsService,
  ) {}

  @Post(':activityId')
  @ApiOperation({ summary: 'Agrega comentario a actividad.' })
  addComment(
    @Param('activityId', new ParseUUIDPipe()) activityId: string,
    @Body() dto: CreateActivityCommentDto,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return this.activityCommentsService.addComment(activityId, dto, actor);
  }

  @Get(':activityId')
  @ApiOperation({ summary: 'Lista comentarios por actividad.' })
  listByActivity(
    @Param('activityId', new ParseUUIDPipe()) activityId: string,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return this.activityCommentsService.listByActivity(activityId, actor);
  }
}
