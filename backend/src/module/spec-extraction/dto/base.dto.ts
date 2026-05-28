import { ApiProperty } from '@nestjs/swagger';
import { GenericAssignDto } from '@snaptospec/utils';
import { Type } from 'class-transformer';
import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';

export const SPEC_ELEMENT_TYPES = [
  'button',
  'text',
  'input',
  'image',
  'card',
  'container',
  'icon',
  'divider',
] as const;

export type SpecElementType = (typeof SPEC_ELEMENT_TYPES)[number];

export class SpecPositionDto extends GenericAssignDto<SpecPositionDto> {
  @IsNumber()
  @ApiProperty({ description: 'X position in px from image top-left' })
  x!: number;

  @IsNumber()
  @ApiProperty({ description: 'Y position in px from image top-left' })
  y!: number;

  @IsNumber()
  @ApiProperty({ description: 'Element width in px' })
  width!: number;

  @IsNumber()
  @ApiProperty({ description: 'Element height in px' })
  height!: number;
}

export class SpecStylesDto extends GenericAssignDto<SpecStylesDto> {
  @IsString()
  @IsOptional()
  @ApiProperty({ nullable: true, description: '#HEX, transparent, or null' })
  backgroundColor!: string | null;

  @IsString()
  @IsOptional()
  @ApiProperty({ nullable: true, description: '#HEX or null' })
  color!: string | null;

  @IsString()
  @IsOptional()
  @ApiProperty({ nullable: true, description: 'Npx or null' })
  fontSize!: string | null;

  @IsString()
  @IsOptional()
  @ApiProperty({ nullable: true, description: '400|500|600|700|800 or null' })
  fontWeight!: string | null;

  @IsString()
  @IsOptional()
  @ApiProperty({ nullable: true, description: 'Npx or null' })
  borderRadius!: string | null;

  @IsString()
  @IsOptional()
  @ApiProperty({ nullable: true, description: 'Npx Npx Npx Npx or null' })
  padding!: string | null;

  @IsString()
  @IsOptional()
  @ApiProperty({ nullable: true, description: 'Npx Npx Npx Npx or null' })
  margin!: string | null;

  @IsString()
  @IsOptional()
  @ApiProperty({ nullable: true, description: 'Npx solid #HEX, none, or null' })
  border!: string | null;

  @IsString()
  @IsOptional()
  @ApiProperty({ nullable: true, description: 'Npx or null' })
  gap!: string | null;
}

export class SpecElementDto extends GenericAssignDto<SpecElementDto> {
  @IsString()
  @IsNotEmpty()
  @ApiProperty({ description: 'Unique slug id, e.g. btn-primary' })
  id!: string;

  @IsEnum(SPEC_ELEMENT_TYPES)
  @ApiProperty({ enum: SPEC_ELEMENT_TYPES, description: 'UI element type' })
  type!: SpecElementType;

  @IsString()
  @IsOptional()
  @ApiProperty({ nullable: true, description: 'Visible text or null' })
  label!: string | null;

  @ValidateNested()
  @Type(() => SpecPositionDto)
  @ApiProperty({ type: SpecPositionDto })
  position!: SpecPositionDto;

  @ValidateNested()
  @Type(() => SpecStylesDto)
  @ApiProperty({ type: SpecStylesDto })
  styles!: SpecStylesDto;
}
