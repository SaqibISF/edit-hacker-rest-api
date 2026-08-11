import { forwardRef, Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { MongooseModule } from '@nestjs/mongoose';
import UserSchema, { User } from './user.schema';
import { AuthModule } from '../auth/auth.module';
import { ResendModule } from 'nestjs-resend';
import { EnvService } from '../env/env.service';
import { UserController } from './user.controller';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
    ResendModule.forRootAsync({
      inject: [EnvService],
      useFactory: (config: EnvService) => ({ apiKey: config.resend_api_key }),
    }),
    forwardRef(() => AuthModule),
  ],
  controllers: [UsersController, UserController],
  providers: [UsersService],
  exports: [MongooseModule, ResendModule],
})
export class UsersModule {}
