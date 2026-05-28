import { ApiProperty } from '@nestjs/swagger';
import { GenericAssignDto } from '@snaptospec/utils';
import { Type } from 'class-transformer';
import { ValidateNested } from 'class-validator';

import { SpecElementDto } from './base.dto';

export class ExtractResultDto extends GenericAssignDto<ExtractResultDto> {
  @ValidateNested({ each: true })
  @Type(() => SpecElementDto)
  @ApiProperty({ type: [SpecElementDto], description: 'Extracted UI elements' })
  elements!: SpecElementDto[];
}
