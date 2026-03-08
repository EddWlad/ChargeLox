import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';
import { EstadoActividad } from '../../common/enums';

export class ChangeActivityStatusDto {
  @ApiProperty({ enum: EstadoActividad })
  @IsEnum(EstadoActividad)
  estado: EstadoActividad;
}
