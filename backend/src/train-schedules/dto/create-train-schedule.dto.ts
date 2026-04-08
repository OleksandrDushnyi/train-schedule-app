import { ApiProperty } from '@nestjs/swagger';
import { TrainType } from '@prisma/client';
import {
  IsDateString,
  IsEnum,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';

export class CreateTrainScheduleDto {
  @ApiProperty()
  @IsUUID()
  routeId!: string;

  @ApiProperty({ example: '2026-04-10T08:30:00.000Z' })
  @IsDateString()
  departureAt!: string;

  @ApiProperty({ example: '743K' })
  @IsString()
  @MaxLength(32)
  trainNumber!: string;

  @ApiProperty({ enum: TrainType })
  @IsEnum(TrainType)
  trainType!: TrainType;
}
