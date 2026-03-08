import { ApiProperty } from '@nestjs/swagger';
import { ArrayMinSize, IsArray, IsUUID } from 'class-validator';

export class MarkManyNotificationsDto {
  @ApiProperty({
    type: [String],
    example: [
      '00a909ac-8edf-44ca-97c6-1e60b42227b0',
      '11111111-1111-1111-1111-111111111111',
    ],
  })
  @IsArray()
  @ArrayMinSize(1)
  @IsUUID('4', { each: true })
  ids: string[];
}
