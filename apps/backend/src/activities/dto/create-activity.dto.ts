import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';
import { EstadoActividad, Prioridad, TipoActividad } from '../../common/enums';

export class CreateActivityDto {
  @ApiProperty({ enum: TipoActividad })
  @IsEnum(TipoActividad)
  tipoActividad: TipoActividad;

  @ApiProperty({ enum: Prioridad })
  @IsEnum(Prioridad)
  prioridad: Prioridad;

  @ApiProperty()
  @IsString()
  descripcion: string;

  @ApiPropertyOptional({ enum: EstadoActividad })
  @IsOptional()
  @IsEnum(EstadoActividad)
  estado?: EstadoActividad;

  @ApiPropertyOptional({ description: 'Usuario relacionado (opcional).' })
  @IsOptional()
  @IsUUID()
  usuarioId?: string;

  @ApiPropertyOptional({ description: 'Turno relacionado (opcional).' })
  @IsOptional()
  @IsUUID()
  turnoId?: string;

  @ApiPropertyOptional({
    description: 'Punto de carga relacionado (opcional).',
  })
  @IsOptional()
  @IsUUID()
  chargingPointId?: string;
}
