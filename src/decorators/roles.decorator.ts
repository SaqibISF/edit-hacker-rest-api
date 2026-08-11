import { Reflector } from '@nestjs/core';
import { UserRole } from '../users/user.schema';

export const ROLES_KEY = 'roles';

export const Roles = Reflector.createDecorator<UserRole[]>();
