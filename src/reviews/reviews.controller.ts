import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  UsePipes,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ReviewsService } from './reviews.service';
import { ResponseMessage } from '../decorators/response-message.decorator';
import { Types } from 'mongoose';
import { MongooseIdPipe } from '../pipes/mongoose-id/mongoose-id.pipe';
import { ZodValidationPipe } from '../pipes/zod-validation/zod-validation.pipe';
import { Payload, type PayloadData } from '../decorators/payload.decorator';
import {
  ApiGetReviewsDocs,
  ApiGetToolReviewSummaryDocs,
  ApiGetReviewDocs,
  ApiCreateReviewDocs,
  ApiUpdateReviewDocs,
  ApiVoteReviewDocs,
  ApiDeleteReviewDocs,
} from './reviews.swagger';
import {
  reviewsQuerySchema,
  type ReviewsQueryDto,
  createReviewSchema,
  type CreateReviewDto,
  updateReviewSchema,
  type UpdateReviewDto,
  voteReviewSchema,
  type VoteReviewDto,
} from './review.validation.schema';
import { scopeSchema, type Scope } from '../zod-schemas/scope.schema';

@ApiTags('Reviews')
@Controller('reviews')
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Get()
  @UsePipes(new ZodValidationPipe(reviewsQuerySchema))
  @HttpCode(HttpStatus.OK)
  @ResponseMessage('Reviews fetched successfully')
  @ApiGetReviewsDocs()
  async getReviews(
    @Payload() payload: PayloadData | undefined,
    @Query() query: ReviewsQueryDto,
  ) {
    return await this.reviewsService.getReviews({
      ...query,
      userId: payload?._id,
      role: payload?.role,
    });
  }

  @Get('tool/:toolId/summary')
  @HttpCode(HttpStatus.OK)
  @ResponseMessage('Tool review summary fetched successfully')
  @ApiGetToolReviewSummaryDocs()
  async getToolReviewSummary(
    @Param('toolId', MongooseIdPipe) toolId: Types.ObjectId,
  ) {
    return await this.reviewsService.getToolReviewSummary(toolId);
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ResponseMessage('Review fetched successfully')
  @ApiGetReviewDocs()
  async getReview(
    @Payload() payload: PayloadData | undefined,
    @Query('scope', new ZodValidationPipe(scopeSchema)) scope: Scope,
    @Param('id', MongooseIdPipe) reviewId: Types.ObjectId,
  ) {
    return await this.reviewsService.getReview({
      reviewId,
      scope,
      userId: payload?._id,
      role: payload?.role,
    });
  }

  @Post()
  @UsePipes(new ZodValidationPipe(createReviewSchema))
  @HttpCode(HttpStatus.CREATED)
  @ResponseMessage('Review created successfully')
  @ApiCreateReviewDocs()
  async createReview(
    @Payload() { _id: userId, role }: PayloadData,
    @Body() createReviewDto: CreateReviewDto,
  ) {
    return await this.reviewsService.createReview({
      userId,
      role,
      createReviewDto,
    });
  }

  @Patch(':id')
  @UsePipes(new ZodValidationPipe(updateReviewSchema))
  @HttpCode(HttpStatus.OK)
  @ResponseMessage('Review updated successfully')
  @ApiUpdateReviewDocs()
  async updateReview(
    @Payload() { _id: userId, role }: PayloadData,
    @Param('id', MongooseIdPipe) reviewId: Types.ObjectId,
    @Body() updateReviewDto: UpdateReviewDto,
  ) {
    return await this.reviewsService.updateReview({
      reviewId,
      updateReviewDto,
      userId,
      role,
    });
  }

  @Post(':id/vote')
  @UsePipes(new ZodValidationPipe(voteReviewSchema))
  @HttpCode(HttpStatus.OK)
  @ResponseMessage('Vote registered successfully')
  @ApiVoteReviewDocs()
  async voteReview(
    @Payload('_id') userId: Types.ObjectId,
    @Param('id', MongooseIdPipe) reviewId: Types.ObjectId,
    @Body() voteDto: VoteReviewDto,
  ) {
    return await this.reviewsService.voteReview({
      reviewId,
      voteDto,
      userId,
    });
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ResponseMessage('Review deleted successfully')
  @ApiDeleteReviewDocs()
  async deleteReview(
    @Payload() { _id: userId, role }: PayloadData,
    @Param('id', MongooseIdPipe) reviewId: Types.ObjectId,
  ) {
    return await this.reviewsService.deleteReview({
      reviewId,
      userId,
      role,
    });
  }
}
