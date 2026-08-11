import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { EnvModule } from './env/env.module';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { RolesGuard } from './guards/roles/roles.guard';
import { TransformInterceptor } from './transform-interceptor/transform-interceptor.interceptor';
import { ConfigModule } from '@nestjs/config';
import Joi from 'joi';
import { MongooseModule } from '@nestjs/mongoose';
import { EnvService } from './env/env.service';
import { LoggerMiddleware } from './middlewares/logger/logger.middleware';
import { AuthMiddleware } from './auth/auth.middleware';
import { FormDataConfigModule } from './form-data-config/form-data-config.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: Joi.object({
        MONGO_URI: Joi.string().required(),
        PORT: Joi.number().default(3001),
        ACCESS_TOKEN_KEY: Joi.string().required(),
        ACCESS_TOKEN_SECRET: Joi.string().required(),
        ACCESS_TOKEN_EXPIRY: Joi.string().required(),
        ACCESS_TOKEN_ALGORITHM: Joi.string().required(),
        FRONTEND_URL: Joi.string().required(),
        RESEND_API_KEY: Joi.string().required(),
        RESEND_EMAIL_FROM: Joi.string().required(),
      }),
    }),
    FormDataConfigModule,
    EnvModule,
    MongooseModule.forRootAsync({
      inject: [EnvService],
      useFactory: (config: EnvService) => ({ uri: config.mongo_uri }),
    }),
    AuthModule,
    UsersModule,
  ],
  providers: [
    { provide: APP_INTERCEPTOR, useClass: TransformInterceptor },
    { provide: APP_GUARD, useClass: RolesGuard },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(LoggerMiddleware).forRoutes('*');
    consumer
      .apply(AuthMiddleware)
      .exclude(
        '/',
        'auth/login',
        'auth/login-as-admin',
        'auth/signup',
        'auth/resend-account-verification-email',
        'auth/verify-account',
        'auth/forgot-password',
        'auth/reset-password',
        'auth/request-account-recovery',
        'auth/recover-user-account',
        // '/favicon.ico',
      )
      .forRoutes('*');
  }
}
