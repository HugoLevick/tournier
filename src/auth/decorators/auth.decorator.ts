import { applyDecorators, SetMetadata, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { UserRoleGuard } from '../guards/user-role/user-role.guard';
import { UserRoles } from '../entities/user.entity';

export const META_ROLES = 'roles';

export function Auth(...roles: UserRoles[]) {
  return applyDecorators(
    SetMetadata(META_ROLES, roles),
    UseGuards(AuthGuard(), UserRoleGuard),
  );
}
