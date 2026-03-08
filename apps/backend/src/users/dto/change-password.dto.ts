import { ApiProperty } from '@nestjs/swagger';
import { IsString, MaxLength, MinLength } from 'class-validator';

export class ChangePasswordDto {
  @ApiProperty()
  @IsString()
  @MinLength(6)
  @MaxLength(50)
  passwordActual: string;

  @ApiProperty()
  @IsString()
  @MinLength(6)
  @MaxLength(50)
  nuevaPassword: string;
}
