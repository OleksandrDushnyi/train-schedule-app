import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsUUID, Max, Min } from 'class-validator';

export class CreateRouteStopDto {
  @ApiProperty()
  @IsUUID()
  stationId!: string;

  @ApiProperty({
    example: 1,
    description: 'Order along the route (1 = first stop)',
  })
  @IsInt()
  @Min(1)
  @Max(500)
  sequence!: number;

  @ApiProperty({
    example: 0,
    description: 'Minutes from departure at first stop',
  })
  @IsInt()
  @Min(0)
  @Max(24 * 60 * 7)
  minutesFromStart!: number;
}
