import {
  Injectable,
  NestMiddleware,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { NextFunction, Request, Response } from 'express';
import { EnvService } from '../env/env.service';
import { JwtPayload, type Jwt } from 'jsonwebtoken';
import { InjectModel } from '@nestjs/mongoose';
import { RevokedToken, RevokedTokenDocument } from './revoked-tokens.schema';
import { Model, Types } from 'mongoose';

@Injectable()
export class AuthMiddleware implements NestMiddleware {
  constructor(
    @InjectModel(RevokedToken.name)
    private readonly revokedTokenModel: Model<RevokedTokenDocument>,
    private readonly jwtService: JwtService,
    private readonly envService: EnvService,
  ) {}

  async use(req: Request, _res: Response, next: NextFunction) {
    try {
      const accessTokenFromHeaders = req.headers.authorization;

      const accessTokenFromCookie = req.cookies[
        this.envService.access_token_key
      ] as string | undefined;

      const token =
        accessTokenFromHeaders && accessTokenFromHeaders.startsWith('Bearer ')
          ? accessTokenFromHeaders.replace('Bearer ', '')
          : accessTokenFromCookie;

      if (!token) {
        throw new UnauthorizedException(
          'Unauthorized, invalid token: token not found',
        );
      }

      const isRevoked = await this.revokedTokenModel.findOne({ token });

      if (isRevoked) {
        throw new UnauthorizedException(
          'Unauthorized, session has been expired or token has been revoked',
        );
      }

      const decodedToken: Jwt = await this.jwtService.verifyAsync(token, {
        secret: this.envService.access_token_secret,
        complete: true,
        algorithms: [this.envService.access_token_algorithm],
      });

      const payload = decodedToken.payload as JwtPayload;

      if (!payload._id) {
        throw new UnauthorizedException(
          'Unauthorized, session has been expired or token has been revoked',
        );
      }

      payload._id = Types.ObjectId.createFromHexString(payload._id as string);

      req['payload'] = { ...payload, token };

      next();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Invalid token';
      throw new UnauthorizedException(
        `${!message.startsWith('Unauthorized') ? 'Unauthorized, ' : ''}${message}`,
      );
    }
  }
}
