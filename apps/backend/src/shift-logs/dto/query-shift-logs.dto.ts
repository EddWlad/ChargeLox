import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsUUID } from 'class-validator';
import { PaginationDto } from '../../common/dto/pagination.dto';

export class QueryShiftLogsDto extends PaginationDto {
  @ApiPropertyOptional({ description: 'Filtra por usuario (solo admin).' })
  @IsOptional()
  @IsUUID()
  usuarioId?: string;
}
