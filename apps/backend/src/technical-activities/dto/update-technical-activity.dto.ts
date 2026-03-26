import { PartialType } from '@nestjs/swagger';
import { CreateTechnicalActivityDto } from './create-technical-activity.dto';

export class UpdateTechnicalActivityDto extends PartialType(
  CreateTechnicalActivityDto,
) {}
