import { IsString, IsUrl } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { GenericAssignDto } from '@snaptospec/utils';

export class ExtractRequestDto extends GenericAssignDto<ExtractRequestDto> {
  /**
   * Public URL of the screenshot to analyze. Only valid URLs are accepted;
   * for MVP we expect this to point at the project's own Supabase Storage
   * bucket (the service logs a warning when it does not).
   */
  @IsUrl()
  @IsString()
  @ApiProperty({
    description:
      'Public URL of the screenshot in Supabase Storage (must be a valid URL)',
    example:
      'https://your-project.supabase.co/storage/v1/object/public/screenshots/example.png',
  })
  imageUrl!: string;
}
