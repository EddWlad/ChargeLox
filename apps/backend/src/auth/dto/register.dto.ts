import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class RegisterDto {
  @ApiProperty()
  @IsString()
  @MaxLength(120)
  nombres: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(120)
  apellidos?: string;

  @ApiProperty()
  @IsEmail()
  @MaxLength(150)
  email: string;

  @ApiProperty({ minLength: 6 })
  @IsString()
  @MinLength(6)
  @MaxLength(50)
  password: string;
}
