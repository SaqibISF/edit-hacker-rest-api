import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AdvertisementsService } from './advertisements.service';
import { AdvertisementsController } from './advertisements.controller';
import AdvertisementSchema, { Advertisement } from './advertisement.schema';
import ToolSchema, { Tool } from '../tools/tool.schema';
import CategorySchema, { Category } from '../categories/category.schema';
import UserSchema, { User } from '../users/user.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Advertisement.name, schema: AdvertisementSchema },
      { name: Tool.name, schema: ToolSchema },
      { name: Category.name, schema: CategorySchema },
      { name: User.name, schema: UserSchema },
    ]),
  ],
  providers: [AdvertisementsService],
  controllers: [AdvertisementsController],
  exports: [AdvertisementsService],
})
export class AdvertisementsModule {}
