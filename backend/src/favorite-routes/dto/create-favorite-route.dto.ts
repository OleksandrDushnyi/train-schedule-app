import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

export class CreateFavoriteRouteDto {
  @ApiProperty()
  @IsUUID()
  routeId!: string;
}
