import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { EstadoActividadTecnica } from '../../common/enums';

export class CreateTechnicalActivityCommentDto {
  @ApiProperty()
  @IsString()
  comentario: string;

  @ApiPropertyOptional({ enum: EstadoActividadTecnica })
  @IsOptional()
  @IsEnum(EstadoActividadTecnica)
  estadoNuevo?: EstadoActividadTecnica;
}
