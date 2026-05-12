import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { RolUsuario } from '../../common/enums';

export class UpdateUserDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(120)
  nombres?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(120)
  apellidos?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(150)
  email?: string;

  @ApiPropertyOptional({ enum: RolUsuario })
  @IsOptional()
  @IsEnum(RolUsuario)
  rol?: RolUsuario;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  activo?: boolean;

  @ApiPropertyOptional({
    description:
      'Nueva contraseña opcional para restablecimiento administrativo.',
  })
  @IsOptional()
  @IsString()
  @MinLength(6)
  @MaxLength(50)
  nuevaPassword?: string;

  @ApiPropertyOptional({
    description:
      'Confirmación opcional de la nueva contraseña para restablecimiento administrativo.',
  })
  @IsOptional()
  @IsString()
  @MinLength(6)
  @MaxLength(50)
  confirmarNuevaPassword?: string;
}
