import { ApiProperty } from '@nestjs/swagger';
import { Role } from '../../../common/enums/role.enum';

export class UserPublicDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  email: string;

  @ApiProperty({ enum: Role })
  role: Role;
}

export class TokenPairDto {
  @ApiProperty({
    description: 'Short-lived JWT for API calls (Authorization: Bearer ...)',
  })
  accessToken: string;

  @ApiProperty({
    description:
      'Refresh JWT; store securely, send to POST /auth/refresh or /auth/logout',
  })
  refreshToken: string;
}
