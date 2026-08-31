import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AnalyticsController } from './analytics.controller';
import { AnalyticsService } from './analytics.service';
import AnalyticsSchema, { Analytics } from './analytics.schema';
import ToolSchema, { Tool } from '../tools/tool.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Analytics.name, schema: AnalyticsSchema },
      { name: Tool.name, schema: ToolSchema },
    ]),
  ],
  controllers: [AnalyticsController],
  providers: [AnalyticsService],
  exports: [AnalyticsService],
})
export class AnalyticsModule {}
