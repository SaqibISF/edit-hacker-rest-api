import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import {
  Types,
  type PipelineStage,
  type _QueryFilterLooseId,
  type PaginateOptions,
  type AggregatePaginateModel,
  Connection,
  ClientSession,
} from 'mongoose';
import { type PrePaginatePipelineStage } from 'mongoose';
import { Review, type ReviewDocument, type ReviewVote } from './review.schema';
import { Tool, type ToolDocument } from '../tools/tool.schema';
import type {
  CreateReviewDto,
  ReviewsQueryDto,
  UpdateReviewDto,
  VoteReviewDto,
} from './review.validation.schema';
import { UserRole } from '../users/user.schema';
import { Scope } from '../zod-schemas/scope.schema';

@Injectable()
export class ReviewsService {
  constructor(
    @InjectModel(Review.name)
    private readonly reviewModel: AggregatePaginateModel<ReviewDocument>,
    @InjectModel(Tool.name)
    private readonly toolModel: AggregatePaginateModel<ToolDocument>,
    @InjectConnection()
    private readonly connection: Connection,
  ) {}

  private reviewPipelines(currentUserId?: Types.ObjectId): PipelineStage[] {
    return [
      // 1. Lookup User
      {
        $lookup: {
          from: 'users',
          localField: 'user',
          foreignField: '_id',
          as: 'user',
        },
      },
      {
        $unwind: { path: '$user', preserveNullAndEmptyArrays: true },
      },

      // 2. Lookup Tool
      {
        $lookup: {
          from: 'tools',
          localField: 'tool',
          foreignField: '_id',
          as: 'tool',
        },
      },
      {
        $unwind: { path: '$tool', preserveNullAndEmptyArrays: true },
      },

      // 3. Project safe fields
      {
        $project: {
          _id: 1,
          title: 1,
          description: 1,
          rating: 1,
          pros: 1,
          cons: 1,
          usagePeriod: 1,
          useCase: 1,
          status: 1,
          helpfulVotes: 1,
          unhelpfulVotes: 1,
          isVerifiedPurchase: 1,
          createdAt: 1,
          updatedAt: 1,

          // User details
          'user._id': 1,
          'user.name': 1,
          'user.avatarUrl': 1,

          // Tool details
          'tool._id': 1,
          'tool.name': 1,
          'tool.slug': 1,
          'tool.tagline': 1,
          'tool.logo': 1,

          // User's vote status on this review
          ...(currentUserId
            ? {
                userVote: {
                  $let: {
                    vars: {
                      matchedVote: {
                        $arrayElemAt: [
                          {
                            $filter: {
                              input: { $ifNull: ['$votes', []] },
                              as: 'v',
                              cond: { $eq: ['$$v.user', currentUserId] },
                            },
                          },
                          0,
                        ],
                      },
                    },
                    in: '$$matchedVote.type',
                  },
                },
              }
            : { userVote: { $literal: null } }),
        },
      },
    ];
  }

  private async recalculateToolRating(
    toolId: Types.ObjectId,
    session: ClientSession,
  ) {
    const stats = (await this.reviewModel
      .aggregate([
        {
          $match: {
            tool: toolId,
            status: 'approved',
            'rating.overall': { $exists: true, $ne: null },
          },
        },
        {
          $group: {
            _id: '$tool',
            average: { $avg: '$rating.overall' },
            count: { $sum: 1 },
          },
        },
      ])
      .session(session || null)) as { average: number; count: number }[];

    const average =
      stats.length > 0 ? Math.round(stats[0].average * 10) / 10 : 0;
    const count = stats.length > 0 ? stats[0].count : 0;

    await this.toolModel.findByIdAndUpdate(
      toolId,
      { rating: { average, count } },
      { session },
    );
  }

  async getReviews({
    page,
    limit,
    search,
    sortBy,
    sortOrder = 'DESC',
    tool,
    user,
    status,
    rating,
    usagePeriod,
    isVerifiedPurchase,
    scope,
    userId,
    role,
  }: ReviewsQueryDto & { userId?: Types.ObjectId; role?: UserRole }) {
    const aggregate: PrePaginatePipelineStage[] = [];
    const match: _QueryFilterLooseId<ReviewDocument> = {};

    if (scope === 'mine') {
      if (!userId) {
        throw new UnauthorizedException(
          'You must be logged in to view your reviews',
        );
      }
      match.user = userId;
      if (status) match.status = status;
    } else {
      if (user) match.user = user;
      if (role !== 'admin') {
        match.status = { $in: ['approved', 'flagged'] };
      } else if (status) {
        match.status = status;
      }
    }

    if (tool) match.tool = tool;

    if (search) match.$text = { $search: search };

    if (rating) match['rating.overall'] = rating;
    if (usagePeriod) match.usagePeriod = usagePeriod;
    if (isVerifiedPurchase) match.isVerifiedPurchase = isVerifiedPurchase;

    if (Object.keys(match).length > 0) aggregate.push({ $match: match });

    aggregate.push(...this.reviewPipelines(userId));

    aggregate.push({ $sort: { [sortBy]: sortOrder === 'DESC' ? -1 : 1 } });

    const options: PaginateOptions = {
      page,
      limit,
      customLabels: {
        docs: 'reviews',
        totalDocs: 'totalReviews',
        pagingCounter: 'pageStart',
      },
    };

    const { reviews, ...meta } = await this.reviewModel.aggregatePaginate(
      aggregate,
      options,
    );

    return { reviews, meta };
  }

  async getReview({
    reviewId,
    scope,
    userId,
    role,
  }: {
    reviewId: Types.ObjectId;
    scope: Scope;
    userId?: Types.ObjectId;
    role?: UserRole;
  }) {
    const aggregate: PipelineStage[] = [];
    const match: _QueryFilterLooseId<ReviewDocument> = { _id: reviewId };

    if (scope === 'mine') {
      if (!userId) {
        throw new UnauthorizedException(
          'You must be logged in to view your review',
        );
      }
      match.user = userId;
    } else if (role !== 'admin')
      match.status = { $in: ['approved', 'flagged'] };

    aggregate.push({ $match: match });
    aggregate.push(...this.reviewPipelines(userId));

    const reviews = await this.reviewModel
      .aggregate<ReviewDocument>(aggregate)
      .exec();

    if (!reviews || !reviews.length) {
      throw new NotFoundException('Review not found');
    }

    return { review: reviews[0] };
  }

  async getToolReviewSummary(toolId: Types.ObjectId) {
    const stats: {
      totalReviews: number;
      avgRating: number;
      avgEaseOfUse: number;
      avgValueForMoney: number;
      avgFeatures: number;
      avgSupport: number;
      star5: number;
      star4: number;
      star3: number;
      star2: number;
      star1: number;
    }[] = await this.reviewModel.aggregate([
      {
        $match: {
          tool: toolId,
          status: 'approved',
          'rating.overall': { $exists: true, $ne: null },
        },
      },
      {
        $group: {
          _id: null,
          totalReviews: { $sum: 1 },
          avgRating: { $avg: '$rating.overall' },
          avgEaseOfUse: { $avg: '$rating.easeOfUse' },
          avgValueForMoney: { $avg: '$rating.valueForMoney' },
          avgFeatures: { $avg: '$rating.features' },
          avgSupport: { $avg: '$rating.support' },
          star5: {
            $sum: {
              $cond: [{ $eq: [{ $round: ['$rating.overall', 0] }, 5] }, 1, 0],
            },
          },
          star4: {
            $sum: {
              $cond: [{ $eq: [{ $round: ['$rating.overall', 0] }, 4] }, 1, 0],
            },
          },
          star3: {
            $sum: {
              $cond: [{ $eq: [{ $round: ['$rating.overall', 0] }, 3] }, 1, 0],
            },
          },
          star2: {
            $sum: {
              $cond: [{ $eq: [{ $round: ['$rating.overall', 0] }, 2] }, 1, 0],
            },
          },
          star1: {
            $sum: {
              $cond: [{ $eq: [{ $round: ['$rating.overall', 0] }, 1] }, 1, 0],
            },
          },
        },
      },
    ]);

    if (!stats.length) {
      return {
        summary: {
          totalReviews: 0,
          averageRating: 0,
          aspects: {
            easeOfUse: null,
            valueForMoney: null,
            features: null,
            support: null,
          },
          distribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
        },
      };
    }

    const s = stats[0];
    return {
      summary: {
        totalReviews: s.totalReviews,
        averageRating: Math.round(s.avgRating * 10) / 10,
        aspects: {
          easeOfUse: s.avgEaseOfUse
            ? Math.round(s.avgEaseOfUse * 10) / 10
            : null,
          valueForMoney: s.avgValueForMoney
            ? Math.round(s.avgValueForMoney * 10) / 10
            : null,
          features: s.avgFeatures ? Math.round(s.avgFeatures * 10) / 10 : null,
          support: s.avgSupport ? Math.round(s.avgSupport * 10) / 10 : null,
        },
        distribution: {
          5: s.star5,
          4: s.star4,
          3: s.star3,
          2: s.star2,
          1: s.star1,
        },
      },
    };
  }

  async createReview({
    userId,
    role,
    createReviewDto,
  }: {
    userId: Types.ObjectId;
    role: UserRole;
    createReviewDto: CreateReviewDto;
  }) {
    const tool = await this.toolModel
      .findById(createReviewDto.tool)
      .lean()
      .exec();

    if (!tool) throw new NotFoundException('Tool not found');

    const existingReview = await this.reviewModel
      .exists({ tool: createReviewDto.tool, user: userId })
      .lean()
      .exec();

    if (existingReview) {
      throw new ConflictException(
        'You have already submitted a review for this tool',
      );
    }

    const session = await this.connection.startSession();

    let reviewId: Types.ObjectId | undefined;

    try {
      session.startTransaction();
      const [review] = await this.reviewModel.create(
        [
          {
            ...createReviewDto,
            user: userId,
            status: role === 'admin' ? 'approved' : 'pending',
          },
        ],
        { session },
      );

      if (review.status === 'approved') {
        await this.recalculateToolRating(createReviewDto.tool, session);
      }

      await session.commitTransaction();
      reviewId = review._id;
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      await session.endSession();
    }

    return await this.getReview({
      reviewId: reviewId,
      scope: 'mine',
      userId,
      role,
    });
  }

  async updateReview({
    reviewId,
    updateReviewDto,
    userId,
    role,
  }: {
    reviewId: Types.ObjectId;
    updateReviewDto: UpdateReviewDto;
    userId: Types.ObjectId;
    role: UserRole;
  }) {
    if (role !== 'admin') {
      delete updateReviewDto.status;
      delete updateReviewDto.isVerifiedPurchase;
    }

    const session = await this.connection.startSession();

    try {
      session.startTransaction();
      const oldReview = await this.reviewModel
        .findOneAndUpdate(
          { _id: reviewId, ...(role !== 'admin' && { user: userId }) },
          updateReviewDto,
          { returnDocument: 'before', runValidators: true, session },
        )
        .lean()
        .exec();

      if (!oldReview) {
        throw new NotFoundException('Review not found');
      }

      const isOrWasApproved =
        oldReview.status === 'approved' ||
        updateReviewDto.status === 'approved';

      if (isOrWasApproved) {
        await this.recalculateToolRating(oldReview.tool, session);
      }

      await session.commitTransaction();
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      await session.endSession();
    }

    return await this.getReview({
      reviewId,
      scope: role === 'admin' ? 'public' : 'mine',
      userId,
      role,
    });
  }

  async voteReview({
    reviewId,
    voteDto,
    userId,
  }: {
    reviewId: Types.ObjectId;
    voteDto: VoteReviewDto;
    userId: Types.ObjectId;
  }) {
    const review = await this.reviewModel.findById(reviewId).exec();
    if (!review) {
      throw new NotFoundException('Review not found');
    }

    if (review.status !== 'approved') {
      throw new BadRequestException('You can only vote on approved reviews');
    }

    if (review.user.equals(userId)) {
      throw new BadRequestException('You cannot vote on your own review');
    }

    if (!review.votes) {
      review.votes = [];
    }

    const existingVoteIndex = review.votes.findIndex((v) =>
      v.user.equals(userId),
    );

    let currentVoteType: ReviewVote | null = voteDto.vote;

    if (existingVoteIndex > -1) {
      const existingVote = review.votes[existingVoteIndex];
      if (existingVote.type === voteDto.vote) {
        // Toggle off / remove vote
        review.votes.splice(existingVoteIndex, 1);
        if (voteDto.vote === 'helpful') {
          review.helpfulVotes = Math.max(0, review.helpfulVotes - 1);
        } else {
          review.unhelpfulVotes = Math.max(0, review.unhelpfulVotes - 1);
        }
        currentVoteType = null;
      } else {
        // Switch vote
        existingVote.type = voteDto.vote;
        existingVote.votedAt = new Date();
        if (voteDto.vote === 'helpful') {
          review.helpfulVotes = review.helpfulVotes + 1;
          review.unhelpfulVotes = Math.max(0, review.unhelpfulVotes - 1);
        } else {
          review.unhelpfulVotes = review.unhelpfulVotes + 1;
          review.helpfulVotes = Math.max(0, review.helpfulVotes - 1);
        }
      }
    } else {
      // New vote
      review.votes.push({
        user: userId,
        type: voteDto.vote,
        votedAt: new Date(),
      });
      if (voteDto.vote === 'helpful') {
        review.helpfulVotes = review.helpfulVotes + 1;
      } else {
        review.unhelpfulVotes = review.unhelpfulVotes + 1;
      }
    }

    await review.save();

    return {
      helpfulVotes: review.helpfulVotes,
      unhelpfulVotes: review.unhelpfulVotes,
      userVote: currentVoteType,
    };
  }

  async deleteReview({
    reviewId,
    userId,
    role,
  }: {
    reviewId: Types.ObjectId;
    userId: Types.ObjectId;
    role: UserRole;
  }) {
    const session = await this.connection.startSession();

    try {
      session.startTransaction();

      const review = await this.reviewModel
        .findOneAndDelete(
          { _id: reviewId, ...(role !== 'admin' && { user: userId }) },
          { returnDocument: 'before', session },
        )
        .lean()
        .exec();

      if (!review) {
        throw new NotFoundException('Review not found');
      }

      if (review.status === 'approved') {
        await this.recalculateToolRating(review.tool, session);
      }

      await session.commitTransaction();

      return {};
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      await session.endSession();
    }
  }
}
