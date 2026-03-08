import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { EstadoActividad, Prioridad, TipoActividad } from '../../common/enums';

export class QueryActivitiesDto extends PaginationDto {
  @ApiPropertyOptional({ enum: TipoActividad })
  @IsOptional()
  @IsEnum(TipoActividad)
  tipoActividad?: TipoActividad;

  @ApiPropertyOptional({ enum: Prioridad })
  @IsOptional()
  @IsEnum(Prioridad)
  prioridad?: Prioridad;

  @ApiPropertyOptional({ enum: EstadoActividad })
  @IsOptional()
  @IsEnum(EstadoActividad)
  estado?: EstadoActividad;
}
