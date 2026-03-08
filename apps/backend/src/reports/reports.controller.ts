import { Controller, Get } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

@ApiTags('Reportes')
@ApiBearerAuth('access-token')
@Controller('reports')
export class ReportsController {
  @Get('health')
  @ApiOperation({ summary: 'Verifica que el módulo de reportes esté activo.' })
  health() {
    return { status: 'ok' };
  }
}
