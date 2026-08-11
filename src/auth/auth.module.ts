import { forwardRef, Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { UsersModule } from '../users/users.module';
import { JwtModule } from '@nestjs/jwt';
import { EnvModule } from '../env/env.module';
import { EnvService } from '../env/env.service';
import { MongooseModule } from '@nestjs/mongoose';
import RevokedTokenSchema, { RevokedToken } from './revoked-tokens.schema';
import { AuthMiddleware } from './auth.middleware';
import OtpSecretSchema, { OtpSecret } from './otp-secret.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: RevokedToken.name, schema: RevokedTokenSchema },
      { name: OtpSecret.name, schema: OtpSecretSchema },
    ]),
    JwtModule.registerAsync({
      global: true,
      imports: [EnvModule],
      useFactory: (config: EnvService) => ({
        secret: config.access_token_secret,
        signOptions: {
          algorithm: config.access_token_algorithm,
          expiresIn: config.access_token_expiry,
        },
      }),
      inject: [EnvService],
    }),
    forwardRef(() => UsersModule),
  ],
  controllers: [AuthController],
  providers: [AuthService, AuthMiddleware],
  exports: [MongooseModule],
})
export class AuthModule {}
