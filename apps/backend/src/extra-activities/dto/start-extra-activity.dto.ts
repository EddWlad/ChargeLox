import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
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

export class StartExtraActivityDto {
  @ApiProperty({ enum: ExtraActivityType })
  @IsEnum(ExtraActivityType)
  type: ExtraActivityType;

  @ApiProperty({ minLength: 3, maxLength: 180 })
  @IsString()
  @MinLength(3)
  @MaxLength(180)
  title: string;

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

  @ApiProperty({ enum: ExtraActivityPriority })
  @IsEnum(ExtraActivityPriority)
  priority: ExtraActivityPriority;

  @ApiProperty({ enum: WorkTimeCategory })
  @IsEnum(WorkTimeCategory)
  workTimeCategory: WorkTimeCategory;

  @ApiPropertyOptional({ maxLength: 120 })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  externalReference?: string;
}
