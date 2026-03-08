import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';
import { RolUsuario } from '../../common/enums';

export class ChangeRoleDto {
  @ApiProperty({ enum: RolUsuario })
  @IsEnum(RolUsuario)
  rol: RolUsuario;
}
