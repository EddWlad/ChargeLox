import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsBoolean, IsOptional } from 'class-validator';

export class QueryNotificationsDto {
  @ApiPropertyOptional({ description: 'Filtrar por leída true/false.' })
  @IsOptional()
  @Transform(({ value }: { value: unknown }) => {
    if (value === undefined) return undefined;
    if (value === true || value === 'true') return true;
    if (value === false || value === 'false') return false;
    return undefined;
  })
  @IsBoolean()
  leida?: boolean;
}
