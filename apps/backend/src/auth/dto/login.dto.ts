import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MaxLength, MinLength } from 'class-validator';

export class LoginDto {
  @ApiProperty()
  @IsEmail()
  @MaxLength(150)
  email: string;

  @ApiProperty()
  @IsString()
  @MinLength(6)
  @MaxLength(50)
  password: string;
}
