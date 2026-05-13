import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import {
  ExtraActivityPriority,
  ExtraActivityType,
  WorkTimeCategory,
} from '../../common/enums';

export class UpdateExtraActivityDto {
  @ApiPropertyOptional({ enum: ExtraActivityType })
  @IsOptional()
  @IsEnum(ExtraActivityType)
  type?: ExtraActivityType;

  @ApiPropertyOptional({ minLength: 3, maxLength: 180 })
  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(180)
  title?: string;

  @ApiPropertyOptional({ maxLength: 5000 })
  @IsOptional()
  @IsString()
  @MaxLength(5000)
  description?: string;

  @ApiPropertyOptional({ maxLength: 150 })
  @IsOptional()
  @IsString()
  @MaxLength(150)
  moduleName?: string;

  @ApiPropertyOptional({ enum: ExtraActivityPriority })
  @IsOptional()
  @IsEnum(ExtraActivityPriority)
  priority?: ExtraActivityPriority;

  @ApiPropertyOptional({ enum: WorkTimeCategory })
  @IsOptional()
  @IsEnum(WorkTimeCategory)
  workTimeCategory?: WorkTimeCategory;

  @ApiPropertyOptional({ maxLength: 120 })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  externalReference?: string;

  @ApiPropertyOptional({ maxLength: 5000 })
  @IsOptional()
  @IsString()
  @MaxLength(5000)
  resultDescription?: string;
}
