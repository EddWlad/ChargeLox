import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';
import { EstadoActividad, Prioridad, TipoActividad } from '../../common/enums';

export class UpdateActivityDto {
  @ApiPropertyOptional({ enum: TipoActividad })
  @IsOptional()
  @IsEnum(TipoActividad)
  tipoActividad?: TipoActividad;

  @ApiPropertyOptional({ enum: Prioridad })
  @IsOptional()
  @IsEnum(Prioridad)
  prioridad?: Prioridad;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  descripcion?: string;

  @ApiPropertyOptional({ enum: EstadoActividad })
  @IsOptional()
  @IsEnum(EstadoActividad)
  estado?: EstadoActividad;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  usuarioId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  turnoId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  chargingPointId?: string;
}
