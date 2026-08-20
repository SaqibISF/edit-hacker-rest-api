import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Request } from 'express';
import type { UserRole } from '../users/user.schema';
import { Types } from 'mongoose';

export type PayloadData = {
  _id: Types.ObjectId;
  email: string;
  role: UserRole;
  name: string;
  token: string;
  iat: number;
  exp: number;
};

type PayloadRequest = { payload: PayloadData } & Request;

export const Payload = createParamDecorator(
  (key: keyof PayloadData | undefined, ctx: ExecutionContext) => {
    const req: PayloadRequest = ctx.switchToHttp().getRequest();

    return key ? req.payload[key] : req.payload;
  },
);
