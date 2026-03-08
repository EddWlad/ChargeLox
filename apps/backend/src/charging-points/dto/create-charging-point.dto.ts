import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import {
  EstadoConexion,
  EstadoPunto,
  Prioridad,
  TipoPunto,
} from '../../common/enums';

export class CreateChargingPointDto {
  @ApiProperty()
  @IsString()
  @MaxLength(120)
  nombre: string;

  @ApiProperty()
  @IsString()
  @MaxLength(60)
  codigoAsignado: string;

  @ApiProperty()
  @IsString()
  @MaxLength(120)
  serial: string;

  @ApiProperty()
  @IsString()
  @MaxLength(120)
  puk: string;

  @ApiProperty({ enum: Prioridad })
  @IsEnum(Prioridad)
  prioridad: Prioridad;

  @ApiProperty({ enum: EstadoPunto })
  @IsEnum(EstadoPunto)
  estado: EstadoPunto;

  @ApiProperty({ enum: EstadoConexion })
  @IsEnum(EstadoConexion)
  estadoConexion: EstadoConexion;

  @ApiProperty()
  @IsString()
  @MaxLength(50)
  puerto: string;

  @ApiPropertyOptional({ enum: TipoPunto })
  @IsOptional()
  @IsEnum(TipoPunto)
  tipo?: TipoPunto;
}
