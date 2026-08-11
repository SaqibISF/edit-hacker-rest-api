import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { Observable } from 'rxjs';
import { PayloadData } from '../../decorators/payload.decorator';
import { Roles } from '../../decorators/roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const roles = this.reflector.get(Roles, context.getHandler());
    if (!roles) return true;

    const req: Request = context.switchToHttp().getRequest();
    const payload = req['payload'] as PayloadData;

    if (!payload || !payload.role) {
      throw new ForbiddenException('User role not found in session');
    }

    if (roles.includes(payload.role)) {
      return true;
    }

    throw new ForbiddenException(
      'You do not have permission to access this resource',
    );
  }
}
