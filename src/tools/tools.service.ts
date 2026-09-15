import {
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import { Tool, ToolDocument } from './tool.schema';
import {
  _QueryFilterLooseId,
  Model,
  PaginateOptions,
  PipelineStage,
  PrePaginatePipelineStage,
  Types,
  type AggregatePaginateModel,
} from 'mongoose';
import type {
  CreateToolDto,
  UpdateToolDto,
  ToolsQueryDto,
  AddToolPlanDto,
  UpdateToolPlanDto,
} from './tool.validation.schema';
import {
  removeFileFromStorage,
  removeFilesFromStorage,
} from '../lib/remove-file';
import { Category, CategoryDocument } from '../categories/category.schema';
import { Connection } from 'mongoose';
import { UserRole } from '../users/user.schema';
import { Scope } from '../zod-schemas/scope.schema';

@Injectable()
export class ToolsService {
  constructor(
    @InjectModel(Tool.name)
    private readonly toolModel: AggregatePaginateModel<ToolDocument>,

    @InjectModel(Category.name)
    private readonly categoryModel: Model<CategoryDocument>,

    @InjectConnection() private readonly connection: Connection,
  ) {}

  private toolPipelines(): PipelineStage[] {
    return [
      // 1. Lookup Category
      {
        $lookup: {
          from: 'categories',
          localField: 'category',
          foreignField: '_id',
          as: 'category',
        },
      },
      {
        $unwind: {
          path: '$category',
          preserveNullAndEmptyArrays: true,
        },
      },

      // 2. Lookup submittedBy (User)
      {
        $lookup: {
          from: 'users',
          localField: 'submittedBy',
          foreignField: '_id',
          as: 'submittedBy',
        },
      },
      {
        $unwind: {
          path: '$submittedBy',
          preserveNullAndEmptyArrays: true,
        },
      },

      // 3. Lookup reviewedBy (User)
      {
        $lookup: {
          from: 'users',
          localField: 'reviewedBy',
          foreignField: '_id',
          as: 'reviewedBy',
        },
      },
      {
        $unwind: {
          path: '$reviewedBy',
          preserveNullAndEmptyArrays: true,
        },
      },

      // 4. Project and shape fields
      {
        $project: {
          _id: 1,
          name: 1,
          slug: 1,
          tagline: 1,
          description: 1,
          logo: 1,
          coverImage: 1,
          screenshots: 1,
          tags: 1,
          pricingModel: 1,
          startingPrice: 1,
          plans: 1,
          platforms: 1,
          links: 1,
          affiliateUrl: 1,
          rating: 1,
          viewCount: 1,
          clickCount: 1,
          saveCount: 1,
          status: 1,
          rejectionReason: 1,
          reviewedAt: 1,
          listingType: 1,
          isFeatured: 1,
          isSponsored: 1,
          isVerified: 1,
          featuredUntil: 1,
          metaTitle: 1,
          metaDescription: 1,
          launchDate: 1,
          isActive: 1,
          createdAt: 1,
          updatedAt: 1,

          // Category nested object
          category: {
            $cond: {
              if: '$category._id',
              then: {
                _id: '$category._id',
                name: '$category.name',
                slug: '$category.slug',
                icon: '$category.icon',
                description: '$category.description',
              },
              else: null,
            },
          },

          // SubmittedBy nested object
          submittedBy: {
            $cond: {
              if: '$submittedBy._id',
              then: {
                _id: '$submittedBy._id',
                name: '$submittedBy.name',
                email: '$submittedBy.email',
                avatarUrl: '$submittedBy.avatarUrl',
                role: '$submittedBy.role',
              },
              else: null,
            },
          },

          // ReviewedBy nested object
          reviewedBy: {
            $cond: {
              if: '$reviewedBy._id',
              then: {
                _id: '$reviewedBy._id',
                name: '$reviewedBy.name',
                email: '$reviewedBy.email',
                avatarUrl: '$reviewedBy.avatarUrl',
                role: '$reviewedBy.role',
              },
              else: null,
            },
          },
        },
      },
    ];
  }

  async getTools({
    page,
    limit,
    search,
    sortBy,
    sortOrder = 'DESC',
    status,
    pricingModel,
    scope,
    isActive,
    userId,
    role,
  }: ToolsQueryDto & { userId?: Types.ObjectId; role?: UserRole }) {
    const aggregate: PrePaginatePipelineStage[] = [];
    const match: _QueryFilterLooseId<ToolDocument> = {};

    if (scope === 'mine') {
      if (!userId) {
        throw new UnauthorizedException(
          'You must be logged in to view your tools',
        );
      }
      match.submittedBy = userId;
    }

    if (scope === 'public' && role !== 'admin') {
      match.status = 'approved';
      match.isActive = true;
    } else {
      if (status) match.status = status;
      if (isActive !== undefined) match.isActive = isActive;
    }

    if (search) match.$text = { $search: search };
    if (pricingModel) match.pricingModel = pricingModel;

    if (Object.keys(match).length > 0) aggregate.push({ $match: match });

    aggregate.push(...this.toolPipelines());

    aggregate.push({ $sort: { [sortBy]: sortOrder === 'DESC' ? -1 : 1 } });

    const options: PaginateOptions = {
      page,
      limit,
      customLabels: {
        docs: 'tools',
        totalDocs: 'totalTools',
        pagingCounter: 'pageStart',
      },
    };

    const { tools, ...meta } = await this.toolModel.aggregatePaginate(
      aggregate,
      options,
    );

    return { tools, meta };
  }

  async getTool({
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
    const match: _QueryFilterLooseId<ToolDocument> =
      typeof identifier === 'string'
        ? { slug: identifier }
        : { _id: identifier };

    if (scope === 'mine') {
      if (!userId) {
        throw new UnauthorizedException(
          'You must be logged in to view your tool',
        );
      }
      match.submittedBy = userId;
    } else if (role !== 'admin') {
      match.status = 'approved';
      match.isActive = true;
    }

    aggregate.push({ $match: match });
    aggregate.push(...this.toolPipelines());

    const tools = await this.toolModel
      .aggregate<ToolDocument>(aggregate)
      .exec();

    if (!tools || !tools.length) {
      throw new NotFoundException('Tool is not found');
    }

    return { tool: tools[0] };
  }

  async checkSlugAvailability(slug: string) {
    const tool = await this.toolModel.exists({ slug }).lean().exec();

    return {
      message: tool
        ? `Slug '${slug}' is already taken`
        : `Slug '${slug}' is available`,
      isAvailable: !tool,
    };
  }

  async createTool(submittedBy: Types.ObjectId, createToolDto: CreateToolDto) {
    const isSlugExist = await this.toolModel.exists({
      slug: createToolDto.slug,
    });

    if (isSlugExist)
      throw new ConflictException(
        `Slug "${createToolDto.slug}" is already taken`,
      );

    const session = await this.connection.startSession();

    try {
      session.startTransaction();

      const [tool] = await this.toolModel.create(
        [{ ...createToolDto, submittedBy }],
        { session },
      );

      await this.categoryModel.updateOne(
        { _id: createToolDto.category },
        { $inc: { toolCount: 1 } },
        { session },
      );

      await session.commitTransaction();

      return { tool };
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      await session.endSession();
    }
  }

  async incrementViewCount(identifier: string | Types.ObjectId) {
    await this.toolModel
      .findOneAndUpdate(
        typeof identifier === 'string'
          ? { slug: identifier }
          : { _id: identifier },
        { $inc: { viewCount: 1 } },
      )
      .lean()
      .exec()
      .catch((error) => console.error('Error updating view count:', error));

    return {};
  }

  async incrementClickCount(identifier: string | Types.ObjectId) {
    await this.toolModel
      .findOneAndUpdate(
        typeof identifier === 'string'
          ? { slug: identifier }
          : { _id: identifier },
        { $inc: { clickCount: 1 } },
      )
      .lean()
      .exec()
      .catch((error) => console.error('Error updating click count:', error));

    return {};
  }

  async incrementSaveCount(identifier: string | Types.ObjectId) {
    await this.toolModel
      .findOneAndUpdate(
        typeof identifier === 'string'
          ? { slug: identifier }
          : { _id: identifier },
        { $inc: { saveCount: 1 } },
      )
      .lean()
      .exec()
      .catch((error) => console.error('Error updating save count:', error));

    return {};
  }

  async updateToolLogo({
    toolId,
    logo,
    userId,
    role,
  }: {
    toolId: Types.ObjectId;
    logo: string;
    userId: Types.ObjectId;
    role: UserRole;
  }) {
    const tool = await this.toolModel
      .findOneAndUpdate(
        { _id: toolId, ...(role !== 'admin' && { submittedBy: userId }) },
        { logo },
        { returnDocument: 'before' },
      )
      .lean()
      .exec();

    if (!tool) {
      removeFileFromStorage(logo);
      throw new NotFoundException('Tool is not found');
    }

    removeFileFromStorage(tool.logo);

    tool.logo = logo;

    return { tool };
  }

  async removeToolLogo({
    toolId,
    userId,
    role,
  }: {
    toolId: Types.ObjectId;
    userId: Types.ObjectId;
    role: UserRole;
  }) {
    const tool = await this.toolModel
      .findOneAndUpdate(
        { _id: toolId, ...(role !== 'admin' && { submittedBy: userId }) },
        { $unset: { logo: 1 } },
        { returnDocument: 'before' },
      )
      .select('logo')
      .lean()
      .exec();

    if (!tool) {
      throw new NotFoundException('Tool is not found');
    }

    removeFileFromStorage(tool.logo);

    return {};
  }

  async updateToolCoverImage({
    toolId,
    coverImage,
    userId,
    role,
  }: {
    toolId: Types.ObjectId;
    coverImage: string;
    userId: Types.ObjectId;
    role: UserRole;
  }) {
    const tool = await this.toolModel
      .findOneAndUpdate(
        { _id: toolId, ...(role !== 'admin' && { submittedBy: userId }) },
        { coverImage },
        { returnDocument: 'before' },
      )
      .lean()
      .exec();

    if (!tool) {
      removeFileFromStorage(coverImage);
      throw new NotFoundException('Tool is not found');
    }

    removeFileFromStorage(tool.coverImage);

    tool.coverImage = coverImage;

    return { tool };
  }

  async removeToolCoverImage({
    toolId,
    userId,
    role,
  }: {
    toolId: Types.ObjectId;
    userId: Types.ObjectId;
    role: UserRole;
  }) {
    const tool = await this.toolModel
      .findOneAndUpdate(
        { _id: toolId, ...(role !== 'admin' && { submittedBy: userId }) },
        { $unset: { coverImage: 1 } },
        { returnDocument: 'before' },
      )
      .select('coverImage')
      .lean()
      .exec();

    if (!tool) {
      throw new NotFoundException('Tool is not found');
    }

    removeFileFromStorage(tool.coverImage);

    return {};
  }

  async addToolScreenshots({
    toolId,
    screenshots,
    userId,
    role,
  }: {
    toolId: Types.ObjectId;
    screenshots: string[];
    userId: Types.ObjectId;
    role: UserRole;
  }) {
    const tool = await this.toolModel
      .findOneAndUpdate(
        { _id: toolId, ...(role !== 'admin' && { submittedBy: userId }) },
        { $push: { screenshots: { $each: screenshots } } },
        { returnDocument: 'after' },
      )
      .lean()
      .exec();

    if (!tool) {
      throw new NotFoundException('Tool is not found');
    }

    return { tool };
  }

  async removeToolScreenshots({
    toolId,
    screenshots,
    userId,
    role,
  }: {
    toolId: Types.ObjectId;
    screenshots: string[];
    userId: Types.ObjectId;
    role: UserRole;
  }) {
    const tool = await this.toolModel
      .findOneAndUpdate(
        { _id: toolId, ...(role !== 'admin' && { submittedBy: userId }) },
        { $pull: { screenshots: { $in: screenshots } } },
        { returnDocument: 'after' },
      )
      .lean()
      .exec();

    removeFilesFromStorage(screenshots);

    if (!tool) {
      throw new NotFoundException('Tool is not found');
    }

    return {};
  }

  async addToolPlan({
    toolId,
    addToolPlanDto,
    userId,
    role,
  }: {
    toolId: Types.ObjectId;
    addToolPlanDto: AddToolPlanDto;
    userId: Types.ObjectId;
    role: UserRole;
  }) {
    const tool = await this.toolModel
      .findOneAndUpdate(
        { _id: toolId, ...(role !== 'admin' && { submittedBy: userId }) },
        { $push: { plans: addToolPlanDto } },
        {
          projection: { plans: { $slice: -1 } },
          returnDocument: 'after',
        },
      )
      .lean()
      .exec();

    if (!tool) throw new NotFoundException('Tool is not found');

    const [plan] = tool.plans;

    return { plan };
  }

  async updateToolPlan({
    toolId,
    planId,
    updateToolPlanDto,
    userId,
    role,
  }: {
    toolId: Types.ObjectId;
    planId: Types.ObjectId;
    updateToolPlanDto: UpdateToolPlanDto;
    userId: Types.ObjectId;
    role: UserRole;
  }) {
    const payload = Object.keys(updateToolPlanDto).reduce(
      (acc, key) => {
        acc[`plans.$.${key}`] = updateToolPlanDto[key];
        return acc;
      },
      {} as Record<string, unknown>,
    );

    const tool = await this.toolModel
      .findOneAndUpdate(
        {
          _id: toolId,
          'plans._id': planId,
          ...(role !== 'admin' && { submittedBy: userId }),
        },
        { $set: payload },
        {
          returnDocument: 'after',
          projection: { plans: { $elemMatch: { _id: planId } } },
        },
      )
      .lean()
      .exec();

    if (!tool) {
      throw new NotFoundException('Tool is not found');
    }

    const [plan] = tool.plans;

    return { plan };
  }

  async deleteToolPlan({
    toolId,
    planId,
    userId,
    role,
  }: {
    toolId: Types.ObjectId;
    planId: Types.ObjectId;
    userId: Types.ObjectId;
    role: UserRole;
  }) {
    const tool = await this.toolModel
      .findOneAndUpdate(
        { _id: toolId, ...(role !== 'admin' && { submittedBy: userId }) },
        { $pull: { plans: { _id: planId } } },
        { returnDocument: 'after' },
      )
      .lean()
      .exec();

    if (!tool) {
      throw new NotFoundException('Tool is not found');
    }

    return {};
  }

  async updateTool({
    toolId,
    updateToolDto,
    userId,
    role,
  }: {
    toolId: Types.ObjectId;
    updateToolDto: UpdateToolDto;
    userId: Types.ObjectId;
    role: UserRole;
  }) {
    if (role !== 'admin') {
      if (updateToolDto.status !== 'draft') delete updateToolDto.status;
      delete updateToolDto.isActive;
    }

    const tool = await this.toolModel
      .findOneAndUpdate(
        { _id: toolId, ...(role !== 'admin' && { submittedBy: userId }) },
        {
          ...updateToolDto,
          ...(role === 'admin' &&
            (updateToolDto.status === 'approved' ||
              updateToolDto.status === 'rejected') && {
              reviewedBy: userId,
              reviewedAt: new Date(),
            }),
        },
        { returnDocument: 'after' },
      )
      .lean()
      .exec();

    if (!tool) {
      throw new NotFoundException('Tool is not found');
    }

    return { tool };
  }

  async deleteTool({
    toolId,
    userId,
    role,
  }: {
    toolId: Types.ObjectId;
    userId: Types.ObjectId;
    role: UserRole;
  }) {
    const session = await this.connection.startSession();

    try {
      session.startTransaction();

      const tool = await this.toolModel
        .findOneAndDelete(
          { _id: toolId, ...(role !== 'admin' && { submittedBy: userId }) },
          { returnDocument: 'before', session },
        )
        .select('_id')
        .lean()
        .exec();

      if (!tool) {
        throw new NotFoundException('Tool is not found');
      }

      await this.categoryModel.updateOne(
        { _id: tool.category },
        { $inc: { toolCount: -1 } },
        { session },
      );

      removeFileFromStorage(tool.logo);
      removeFileFromStorage(tool.coverImage);
      removeFilesFromStorage(tool.screenshots);

      await session.commitTransaction();
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      await session.endSession();
    }

    return {};
  }
}
