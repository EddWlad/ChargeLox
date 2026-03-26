import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';
import {
  EstadoActividadTecnica,
  Prioridad,
  TipoActividadTecnica,
} from '../../common/enums';

export class CreateTechnicalActivityDto {
  @ApiProperty({ enum: TipoActividadTecnica })
  @IsEnum(TipoActividadTecnica)
  tipoActividad: TipoActividadTecnica;

  @ApiProperty()
  @IsString()
  @MaxLength(180)
  titulo: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  descripcion?: string;

  @ApiProperty({ enum: Prioridad })
  @IsEnum(Prioridad)
  prioridad: Prioridad;

  @ApiPropertyOptional({ enum: EstadoActividadTecnica })
  @IsOptional()
  @IsEnum(EstadoActividadTecnica)
  estado?: EstadoActividadTecnica;

  @ApiProperty({ description: 'Usuario con rol TECNICO asignado a la actividad.' })
  @IsUUID()
  tecnicoAsignadoId: string;

  @ApiProperty()
  @IsDateString()
  fechaProgramada: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  fechaLimite?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  fechaEjecucion?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  fechaInstalacion?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(200)
  ubicacion?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  chargingPointId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(120)
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

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(80)
  marca?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(120)
  modelo?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(80)
  estadoInicial?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  caracteristicasTecnicas?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  diagnostico?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  hallazgos?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  accionesRealizadas?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  componentesIntervenidos?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  recomendaciones?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(80)
  estadoFinal?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  observacionesIniciales?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  observacionesEjecucion?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  observacionesCierre?: string;
}
