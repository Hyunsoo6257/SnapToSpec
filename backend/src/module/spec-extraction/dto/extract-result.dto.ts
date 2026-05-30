import { ValidateNested } from 'class-validator';
import { Type, Expose } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { GenericAssignDto } from '@snaptospec/utils';
import { SpecElementDto } from './base.dto';

export class ExtractResultDto extends GenericAssignDto<ExtractResultDto> {
  @Expose()
  @ValidateNested({ each: true })
  @Type(() => SpecElementDto)
  @ApiProperty({ type: [SpecElementDto] })
  elements!: SpecElementDto[];
}
