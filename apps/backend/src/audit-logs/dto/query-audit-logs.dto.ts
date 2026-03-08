import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { AccionAuditoria } from '../../common/enums';

export class QueryAuditLogsDto extends PaginationDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  entidad?: string;

  @ApiPropertyOptional({ enum: AccionAuditoria })
  @IsOptional()
  @IsEnum(AccionAuditoria)
  accion?: AccionAuditoria;
}
