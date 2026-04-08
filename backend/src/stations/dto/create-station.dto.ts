import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsOptional,
  IsString,
  Length,
  Matches,
  MaxLength,
} from 'class-validator';

export class CreateStationDto {
  @ApiProperty({ example: 'Kyiv-Pasazhyrskyi' })
  @IsString()
  @MaxLength(200)
  name!: string;

  @ApiPropertyOptional({ example: 'KYIV' })
  @IsOptional()
  @IsString()
  @Length(2, 32)
  @Matches(/^[A-Z0-9_-]+$/i, { message: 'code must be alphanumeric' })
  code?: string;
}
