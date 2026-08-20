import { Reflector } from '@nestjs/core';
import { UserRole } from '../users/user.schema';

export const Roles = Reflector.createDecorator<UserRole[]>();
