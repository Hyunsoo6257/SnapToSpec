import { ApiProperty } from '@nestjs/swagger';
import { GenericAssignDto } from '@snaptospec/utils';
import { Expose } from 'class-transformer';

export class UploadResultDto extends GenericAssignDto<UploadResultDto> {
  @Expose()
  @ApiProperty({
    description: 'Public URL of uploaded image in Supabase Storage',
  })
  imageUrl!: string;
}
