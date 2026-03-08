import { Controller, Get, Res } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Response } from 'express';
import { Public } from './common/decorators/public.decorator';

@ApiTags('Sistema')
@Controller()
export class AppController {
  @Public()
  @Get()
  @ApiOperation({ summary: 'Redirige al Swagger de la API.' })
  redirectToDocs(@Res() res: Response) {
    return res.redirect('/api/docs');
  }

  @Public()
  @Get('health')
  @ApiOperation({ summary: 'Estado general del backend.' })
  health() {
    return {
      status: 'ok',
      service: 'ChargeLox Backend',
      timestamp: new Date().toISOString(),
    };
  }
}
