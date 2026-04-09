import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';
import { TrainType } from '../../common/enums/train-type.enum';

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
