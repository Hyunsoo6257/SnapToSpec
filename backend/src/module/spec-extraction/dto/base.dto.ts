import {
  IsString,
  IsOptional,
  IsNotEmpty,
  IsEnum,
  IsNumber,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { GenericAssignDto } from '@snaptospec/utils';

export class SpecStylesDto extends GenericAssignDto<SpecStylesDto> {
  @IsString()
  @IsOptional()
  @ApiPropertyOptional()
  backgroundColor!: string | null;

  @IsString()
  @IsOptional()
  @ApiPropertyOptional()
  color!: string | null;

  @IsString()
  @IsOptional()
  @ApiPropertyOptional()
  fontSize!: string | null;

  @IsString()
  @IsOptional()
  @ApiPropertyOptional()
  fontWeight!: string | null;

  @IsString()
  @IsOptional()
  @ApiPropertyOptional()
  borderRadius!: string | null;

  @IsString()
  @IsOptional()
  @ApiPropertyOptional()
  padding!: string | null;

  @IsString()
  @IsOptional()
  @ApiPropertyOptional()
  margin!: string | null;

  @IsString()
  @IsOptional()
  @ApiPropertyOptional()
  border!: string | null;

  @IsString()
  @IsOptional()
  @ApiPropertyOptional()
  gap!: string | null;
}

export class SpecElementPositionDto extends GenericAssignDto<SpecElementPositionDto> {
  @IsNumber()
  @ApiProperty()
  x!: number;

  @IsNumber()
  @ApiProperty()
  y!: number;

  @IsNumber()
  @ApiProperty()
  width!: number;

  @IsNumber()
  @ApiProperty()
  height!: number;
}

export class SpecElementDto extends GenericAssignDto<SpecElementDto> {
  @IsString()
  @IsNotEmpty()
  @ApiProperty()
  id!: string;

  @IsEnum(['button', 'text', 'input', 'image', 'card', 'container', 'icon', 'divider'])
  @ApiProperty({ enum: ['button', 'text', 'input', 'image', 'card', 'container', 'icon', 'divider'] })
  type!: 'button' | 'text' | 'input' | 'image' | 'card' | 'container' | 'icon' | 'divider';

  @IsString()
  @IsOptional()
  @ApiPropertyOptional()
  label!: string | null;

  @ValidateNested()
  @Type(() => SpecElementPositionDto)
  @ApiProperty({ type: SpecElementPositionDto })
  position!: SpecElementPositionDto;

  @ValidateNested()
  @Type(() => SpecStylesDto)
  @ApiProperty({ type: SpecStylesDto })
  styles!: SpecStylesDto;
}
