import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsOptional } from 'class-validator';

export class StartShiftDto {
  @ApiPropertyOptional({
    description: 'Fecha del turno en formato YYYY-MM-DD.',
  })
  @IsOptional()
  @IsDateString()
  fechaTurno?: string;
}
