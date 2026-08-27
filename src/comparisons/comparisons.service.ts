import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import {
  Types,
  type PipelineStage,
  type _QueryFilterLooseId,
  type PaginateOptions,
  type AggregatePaginateModel,
} from 'mongoose';
import { Comparison, type ComparisonDocument } from './comparison.schema';
import { type PrePaginatePipelineStage } from 'mongoose';
import type {
  ComparisonsQueryDto,
  CreateComparisonDto,
  UpdateComparisonDto,
} from './comparison.validation.schema';
import { UserRole } from '../users/user.schema';
import { Scope } from '../zod-schemas/scope.schema';

@Injectable()
export class ComparisonsService {
  constructor(
    @InjectModel(Comparison.name)
    private readonly comparisonModel: AggregatePaginateModel<ComparisonDocument>,
  ) {}

  private comparisonPipelines(): PipelineStage[] {
    return [
      // 1. Lookup createdBy (User)
      {
        $lookup: {
          from: 'users',
          localField: 'createdBy',
          foreignField: '_id',
          as: 'createdBy',
        },
      },
      {
        $unwind: {
          path: '$createdBy',
          preserveNullAndEmptyArrays: true, // Keep comparison even if creator is deleted/null
        },
      },

      // 2. Lookup tools array (Tools)
      {
        $lookup: {
          from: 'tools',
          localField: 'tools',
          foreignField: '_id',
          as: 'toolsList',
        },
      },

      // 3. Lookup winner (Tool)
      {
        $lookup: {
          from: 'tools',
          localField: 'winner',
          foreignField: '_id',
          as: 'winner',
        },
      },
      {
        $unwind: {
          path: '$winner',
          preserveNullAndEmptyArrays: true,
        },
      },

      // 4. Select only necessary properties
      {
        $project: {
          _id: 1,
          title: 1,
          slug: 1,
          type: 1,
          isPublished: 1,
          viewCount: 1,
          summary: 1,
          createdAt: 1,
          updatedAt: 1,

          // Select only necessary User properties
          'createdBy._id': 1,
          'createdBy.name': 1,

          // Select only necessary Tools properties via $map
          tools: {
            $map: {
              input: '$toolsList',
              as: 'tool',
              in: {
                _id: '$$tool._id',
                name: '$$tool.name',
                slug: '$$tool.slug',
                tagline: '$$tool.tagline',
                logo: '$$tool.logo',
              },
            },
          },

          // Conditionally select winner properties if it exists
          winner: {
            $cond: {
              if: { $gt: [{ $type: '$winner' }, 'missing'] },
              then: {
                _id: '$winner._id',
                name: '$winner.name',
                slug: '$winner.slug',
                tagline: '$winner.tagline',
                logo: '$winner.logo',
              },
              else: null,
            },
          },
        },
      },
    ];
  }

  async getComparisons({
    page,
    limit,
    search,
    sortBy,
    sortOrder = 'ASC',
    isPublished,
    tools,
    type,
    winner,
    scope,
    userId,
    role,
  }: ComparisonsQueryDto & { userId?: Types.ObjectId; role?: UserRole }) {
    const aggregate: PrePaginatePipelineStage[] = [];
    const match: _QueryFilterLooseId<ComparisonDocument> = {};

    if (scope === 'mine') {
      if (!userId) {
        throw new UnauthorizedException(
          'You must be logged in to view your comparisons',
        );
      }
      match.createdBy = userId;
    }

    if (scope === 'public' && role !== 'admin') {
      match.isPublished = true;
    } else if (isPublished) match.isPublished = isPublished;

    if (search) match.$text = { $search: search };

    if (tools && tools.length > 0) match.tools = { $in: tools };
    if (type) match.type = type;
    if (winner) match.winner = winner;

    if (Object.keys(match).length > 0) aggregate.push({ $match: match });

    aggregate.push(...this.comparisonPipelines());

    aggregate.push({ $sort: { [sortBy]: sortOrder === 'DESC' ? -1 : 1 } });

    const options: PaginateOptions = {
      page,
      limit,
      customLabels: {
        docs: 'comparisons',
        totalDocs: 'totalComparisons',
        pagingCounter: 'pageStart',
      },
    };

    const { comparisons, ...meta } =
      await this.comparisonModel.aggregatePaginate(aggregate, options);

    return { comparisons, meta };
  }

  async getComparison({
    identifier,
    scope,
    userId,
    role,
  }: {
    identifier: string | Types.ObjectId;
    scope: Scope;
    userId?: Types.ObjectId;
    role?: UserRole;
  }) {
    const aggregate: PipelineStage[] = [];
    const match: _QueryFilterLooseId<ComparisonDocument> =
      typeof identifier === 'string'
        ? { slug: identifier }
        : { _id: identifier };

    if (scope === 'mine') {
      if (!userId) {
        throw new UnauthorizedException(
          'You must be logged in to view your comparisons',
        );
      }
      match.createdBy = userId;
    } else if (role !== 'admin') match.isPublished = true;

    aggregate.push({ $match: match });
    aggregate.push(...this.comparisonPipelines());

    const comparisons = await this.comparisonModel
      .aggregate<ComparisonDocument>(aggregate)
      .exec();

    if (!comparisons || !comparisons.length) {
      throw new NotFoundException('Comparison not found');
    }

    return { comparison: comparisons[0] };
  }

  async checkSlugAvailability(slug: string) {
    const comparison = await this.comparisonModel
      .exists({ slug })
      .lean()
      .exec();

    return {
      message: comparison
        ? `Slug '${slug}' is already taken`
        : `Slug '${slug}' is available`,
      isAvailable: !comparison,
    };
  }

  async createComparison({
    userId,
    role,
    createComparisonDto,
  }: {
    userId: Types.ObjectId;
    role: UserRole;
    createComparisonDto: CreateComparisonDto;
  }) {
    const exists = await this.comparisonModel
      .exists({ slug: createComparisonDto.slug })
      .lean()
      .exec();

    if (exists) {
      throw new BadRequestException(
        `Slug "${createComparisonDto.slug}" is already taken`,
      );
    }

    const { slug } = await this.comparisonModel.create({
      ...createComparisonDto,
      type: role === 'admin' ? 'editorial' : 'user',
      createdBy: userId,
    });

    const comparison = await this.getComparison({
      identifier: slug,
      scope: 'mine',
      userId,
      role,
    });

    return { comparison };
  }

  async updateComparison({
    comparisonId,
    updateComparisonDto,
    userId,
    role,
  }: {
    comparisonId: Types.ObjectId;
    updateComparisonDto: UpdateComparisonDto;
    userId: Types.ObjectId;
    role: UserRole;
  }) {
    if (role !== 'admin') delete updateComparisonDto.isPublished;

    const updateComparison = await this.comparisonModel
      .findOneAndUpdate(
        { _id: comparisonId, ...(role !== 'admin' && { createdBy: userId }) },
        updateComparisonDto,
        {
          returnDocument: 'after',
          runValidators: true,
        },
      )
      .lean()
      .exec();

    if (!updateComparison) {
      throw new NotFoundException('Comparison not found');
    }

    const comparison = await this.getComparison({
      identifier: updateComparison.slug,
      scope: 'mine',
      userId,
      role,
    });

    return { comparison };
  }

  async deleteComparison({
    comparisonId,
    userId,
    role,
  }: {
    comparisonId: Types.ObjectId;
    userId: Types.ObjectId;
    role: UserRole;
  }) {
    const comparison = await this.comparisonModel
      .findOneAndDelete({
        _id: comparisonId,
        ...(role !== 'admin' && { createdBy: userId }),
      })
      .lean()
      .exec();

    if (!comparison) {
      throw new NotFoundException('Comparison not found');
    }

    return {};
  }
}
