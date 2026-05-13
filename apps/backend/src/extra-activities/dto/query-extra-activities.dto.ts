import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';
import { PaginationDto } from '../../common/dto/pagination.dto';
import {
  ExtraActivityPriority,
  ExtraActivityStatus,
  ExtraActivityType,
  WorkTimeCategory,
} from '../../common/enums';

export class QueryExtraActivitiesDto extends PaginationDto {
  @ApiPropertyOptional({ enum: ExtraActivityType })
  @IsOptional()
  @IsEnum(ExtraActivityType)
  type?: ExtraActivityType;

  @ApiPropertyOptional({ enum: ExtraActivityStatus })
  @IsOptional()
  @IsEnum(ExtraActivityStatus)
  status?: ExtraActivityStatus;

  @ApiPropertyOptional({ enum: WorkTimeCategory })
  @IsOptional()
  @IsEnum(WorkTimeCategory)
  workTimeCategory?: WorkTimeCategory;

  @ApiPropertyOptional({ enum: ExtraActivityPriority })
  @IsOptional()
  @IsEnum(ExtraActivityPriority)
  priority?: ExtraActivityPriority;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  userId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  dateFrom?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  dateTo?: string;

  @ApiPropertyOptional({ maxLength: 120 })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  externalReference?: string;
}
