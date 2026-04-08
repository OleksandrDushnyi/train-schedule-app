import { ApiPropertyOptional } from '@nestjs/swagger';
import { TrainType } from '@prisma/client';
import {
  IsDateString,
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';

export class UpdateTrainScheduleDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  routeId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  departureAt?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(32)
  trainNumber?: string;

  @ApiPropertyOptional({ enum: TrainType })
  @IsOptional()
  @IsEnum(TrainType)
  trainType?: TrainType;
}
