import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
  UsePipes,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AnalyticsService } from './analytics.service';
import { ResponseMessage } from '../decorators/response-message.decorator';
import type { Types } from 'mongoose';
import { IdentifierPipe } from '../pipes/identifier/identifier.pipe';
import { ZodValidationPipe } from '../pipes/zod-validation/zod-validation.pipe';
import {
  analyticsQuerySchema,
  type AnalyticsQueryDto,
  overviewAnalyticsQuerySchema,
  type OverviewAnalyticsQueryDto,
  trackEventSchema,
  type TrackEventDto,
} from './analytics.validation.schema';
import { Roles } from '../decorators/roles.decorator';
import {
  ApiGetAnalyticsOverviewDocs,
  ApiGetToolAnalyticsDocs,
  ApiTrackEventDocs,
} from './analytics.swagger';

@ApiTags('Analytics')
@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Roles(['admin'])
  @Get('overview')
  @UsePipes(new ZodValidationPipe(overviewAnalyticsQuerySchema))
  @HttpCode(HttpStatus.OK)
  @ResponseMessage('Analytics overview successfully retrieved')
  @ApiGetAnalyticsOverviewDocs()
  async getOverview(@Query() query: OverviewAnalyticsQueryDto) {
    return await this.analyticsService.getOverview(query);
  }

  @Roles(['admin'])
  @Get('tool/:identifier')
  @UsePipes(new ZodValidationPipe(analyticsQuerySchema))
  @HttpCode(HttpStatus.OK)
  @ResponseMessage('Tool analytics successfully retrieved')
  @ApiGetToolAnalyticsDocs()
  async getToolAnalytics(
    @Param('identifier', IdentifierPipe) identifier: string | Types.ObjectId,
    @Query() query: AnalyticsQueryDto,
  ) {
    return await this.analyticsService.getToolAnalytics({
      identifier,
      query,
    });
  }

  @Post('track')
  @UsePipes(new ZodValidationPipe(trackEventSchema))
  @HttpCode(HttpStatus.OK)
  @ResponseMessage('Analytics event tracked successfully')
  @ApiTrackEventDocs()
  async trackEvent(@Body() trackEventDto: TrackEventDto) {
    return await this.analyticsService.trackEvent(trackEventDto);
  }
}
