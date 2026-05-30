import { IsString, IsUrl } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { GenericAssignDto } from '@snaptospec/utils';

export class ExtractRequestDto extends GenericAssignDto<ExtractRequestDto> {
  @IsUrl()
  @IsString()
  @ApiProperty({ description: 'Public URL of the screenshot in Supabase Storage' })
  imageUrl!: string;
}
