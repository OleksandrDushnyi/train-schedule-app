import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MinLength } from 'class-validator';

export class RefreshTokenBodyDto {
  @ApiProperty({ description: 'JWT refresh token from login/register/refresh' })
  @IsString()
  @IsNotEmpty()
  @MinLength(32)
  refreshToken: string;
}
