import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsEnum, IsOptional, IsUUID } from 'class-validator';
import { PaginationDto } from '../../common/dto/pagination.dto';
import {
  EstadoActividadTecnica,
  Prioridad,
  TipoActividadTecnica,
} from '../../common/enums';

export class QueryTechnicalActivitiesDto extends PaginationDto {
  @ApiPropertyOptional({ enum: TipoActividadTecnica })
  @IsOptional()
  @IsEnum(TipoActividadTecnica)
  tipoActividad?: TipoActividadTecnica;

  @ApiPropertyOptional({ enum: EstadoActividadTecnica })
  @IsOptional()
  @IsEnum(EstadoActividadTecnica)
  estado?: EstadoActividadTecnica;

  @ApiPropertyOptional({ enum: Prioridad })
  @IsOptional()
  @IsEnum(Prioridad)
  prioridad?: Prioridad;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  tecnicoAsignadoId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  chargingPointId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  fechaDesde?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  fechaHasta?: string;
}
