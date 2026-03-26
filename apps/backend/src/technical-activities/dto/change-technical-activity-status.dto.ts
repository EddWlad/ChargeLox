import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { EstadoActividadTecnica } from '../../common/enums';

export class ChangeTechnicalActivityStatusDto {
  @ApiProperty({ enum: EstadoActividadTecnica })
  @IsEnum(EstadoActividadTecnica)
  estado: EstadoActividadTecnica;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  observacionesEjecucion?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  observacionesCierre?: string;
}
