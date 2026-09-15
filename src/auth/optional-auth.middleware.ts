import { Injectable, NestMiddleware } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { NextFunction, Request, Response } from 'express';
import { EnvService } from '../env/env.service';
import { JwtPayload, type Jwt } from 'jsonwebtoken';
import { InjectModel } from '@nestjs/mongoose';
import { RevokedToken, RevokedTokenDocument } from './revoked-tokens.schema';
import { Model, Types } from 'mongoose';

@Injectable()
export class OptionalAuthMiddleware implements NestMiddleware {
  constructor(
    @InjectModel(RevokedToken.name)
    private readonly revokedTokenModel: Model<RevokedTokenDocument>,
    private readonly jwtService: JwtService,
    private readonly envService: EnvService,
  ) {}

  async use(req: Request, _res: Response, next: NextFunction) {
    try {
      const accessTokenFromHeaders = req.headers.authorization;

      const accessTokenFromCookie = req.cookies?.[
        this.envService.access_token_key
      ] as string | undefined;

      const token =
        accessTokenFromHeaders && accessTokenFromHeaders.startsWith('Bearer ')
          ? accessTokenFromHeaders.replace('Bearer ', '')
          : accessTokenFromCookie;

      if (!token) {
        return next();
      }

      const isRevoked = await this.revokedTokenModel.findOne({ token });

      if (isRevoked) {
        return next();
      }

      const decodedToken: Jwt = await this.jwtService.verifyAsync(token, {
        secret: this.envService.access_token_secret,
        complete: true,
        algorithms: [this.envService.access_token_algorithm],
      });

      const payload = decodedToken.payload as JwtPayload;

      if (payload && payload._id) {
        payload._id = Types.ObjectId.createFromHexString(payload._id as string);
        req['payload'] = { ...payload, token };
      }

      return next();
    } catch {
      // If token is invalid or expired, continue without setting payload
      return next();
    }
  }
}
