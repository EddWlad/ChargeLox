import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { EstadoConexion, Prioridad } from '../../common/enums';

export class QueryChargingPointsDto extends PaginationDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : undefined,
  )
  search?: string;

  @ApiPropertyOptional({ enum: EstadoConexion })
  @IsOptional()
  @IsEnum(EstadoConexion)
  estadoConexion?: EstadoConexion;

  @ApiPropertyOptional({ enum: Prioridad })
  @IsOptional()
  @IsEnum(Prioridad)
  prioridad?: Prioridad;
}
