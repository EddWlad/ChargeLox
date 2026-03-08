import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import {
  EstadoConexion,
  EstadoPunto,
  Prioridad,
  TipoPunto,
} from '../../common/enums';

export class UpdateChargingPointDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(120)
  nombre?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(60)
  codigoAsignado?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(120)
  serial?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(120)
  puk?: string;

  @ApiPropertyOptional({ enum: Prioridad })
  @IsOptional()
  @IsEnum(Prioridad)
  prioridad?: Prioridad;

  @ApiPropertyOptional({ enum: EstadoPunto })
  @IsOptional()
  @IsEnum(EstadoPunto)
  estado?: EstadoPunto;

  @ApiPropertyOptional({ enum: EstadoConexion })
  @IsOptional()
  @IsEnum(EstadoConexion)
  estadoConexion?: EstadoConexion;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(50)
  puerto?: string;

  @ApiPropertyOptional({ enum: TipoPunto })
  @IsOptional()
  @IsEnum(TipoPunto)
  tipo?: TipoPunto;
}
