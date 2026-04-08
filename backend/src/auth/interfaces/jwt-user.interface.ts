import type { Role } from '../../common/enums/role.enum';

export interface JwtUser {
  userId: string;
  email: string;
  role: Role;
}
