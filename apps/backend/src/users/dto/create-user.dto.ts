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

export class CreateUserDto {
  @ApiPropertyOptional()
  @IsString()
  @MaxLength(120)
  nombres: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(120)
  apellidos?: string;

  @ApiPropertyOptional()
  @IsString()
  @MaxLength(150)
  email: string;

  @ApiPropertyOptional()
  @IsString()
  @MinLength(6)
  @MaxLength(50)
  password: string;

  @ApiPropertyOptional({ enum: RolUsuario })
  @IsOptional()
  @IsEnum(RolUsuario)
  rol?: RolUsuario;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  activo?: boolean;
}
