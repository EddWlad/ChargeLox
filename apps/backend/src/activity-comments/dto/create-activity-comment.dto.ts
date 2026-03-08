import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { EstadoActividad } from '../../common/enums';

export class CreateActivityCommentDto {
  @ApiProperty()
  @IsString()
  comentario: string;

  @ApiPropertyOptional({ enum: EstadoActividad })
  @IsOptional()
  @IsEnum(EstadoActividad)
  estadoNuevo?: EstadoActividad;
}
