import {
  CanActivate,
  ExecutionContext,
  Injectable,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';
import { User, UserRoles } from '../entities/user.entity';
import { META_ROLES } from '../decorators/auth.decorator';
import { UnauthorizedException } from '@nestjs/common';

@Injectable()
export class UserRoleGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  //prettier-ignore
  canActivate(context: ExecutionContext): boolean | Promise<boolean> | Observable<boolean> {
    const validRoles: string[] = this.reflector.get(
      META_ROLES,
      context.getHandler(),
    );

    const req = context.switchToHttp().getRequest();
    const user: User = req.user;

    if (!user) throw new BadRequestException('User not found');
    
    if(!user.email) throw new UnauthorizedException('User not registered')

    if (!validRoles || validRoles.length === 0 || user.role === UserRoles.owner) return true;

    if (validRoles.includes(user.role)) return true;

    throw new ForbiddenException(
      `User ${user.username} needs a valid role: [${validRoles}]`,
    );
  }
}
