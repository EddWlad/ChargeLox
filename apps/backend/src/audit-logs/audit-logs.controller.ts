import { Controller, Get, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Roles } from '../common/decorators/roles.decorator';
import { RolUsuario } from '../common/enums';
import { QueryAuditLogsDto } from './dto/query-audit-logs.dto';
import { AuditLogsService } from './audit-logs.service';

@ApiTags('Auditoría')
@ApiBearerAuth('access-token')
@Roles(RolUsuario.ADMINISTRADOR)
@Controller('audit-logs')
export class AuditLogsController {
  constructor(private readonly auditLogsService: AuditLogsService) {}

  @Get()
  @ApiOperation({ summary: 'Lista logs de auditoría (solo admin).' })
  list(@Query() query: QueryAuditLogsDto) {
    return this.auditLogsService.list(query);
  }
}
