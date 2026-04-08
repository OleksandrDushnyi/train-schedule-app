import { ApiPropertyOptional } from '@nestjs/swagger';
import { TrainType } from '@prisma/client';
import { IsDateString, IsEnum, IsOptional, IsUUID } from 'class-validator';

export class QueryTrainSchedulesDto {
  @ApiPropertyOptional({ example: '2026-04-10' })
  @IsOptional()
  @IsDateString()
  date?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  routeId?: string;

  @ApiPropertyOptional({ enum: TrainType })
  @IsOptional()
  @IsEnum(TrainType)
  trainType?: TrainType;
}
