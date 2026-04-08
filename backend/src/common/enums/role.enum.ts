import type { Role as RoleType } from '../types/role.type';

export const Role = {
  USER: 'USER',
  ADMIN: 'ADMIN',
} as const satisfies Record<RoleType, RoleType>;

export type Role = RoleType;
