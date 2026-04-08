import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsUUID } from 'class-validator';

export class QueryTrainSchedulesDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  routeId?: string;
}
