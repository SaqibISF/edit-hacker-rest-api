import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import { Tool, ToolDocument } from './tool.schema';
import {
  _QueryFilterLooseId,
  Model,
  PaginateOptions,
  PrePaginatePipelineStage,
  Types,
  type AggregatePaginateModel,
} from 'mongoose';
import type {
  CreateToolDto,
  UpdateToolDto,
  ToolsQueryDto,
} from './tool.validation.schema';
import {
  removeFileFromStorage,
  removeFilesFromStorage,
} from '../lib/remove-file';
import { Category, CategoryDocument } from '../categories/category.schema';
import { Connection } from 'mongoose';

@Injectable()
export class ToolsService {
  constructor(
    @InjectModel(Tool.name)
    private readonly toolModel: AggregatePaginateModel<ToolDocument>,

    @InjectModel(Category.name)
    private readonly categoryModel: Model<CategoryDocument>,

    @InjectConnection() private readonly connection: Connection,
  ) {}

  async getTools({
    page,
    limit,
    search,
    sortBy,
    sortOrder = 'DESC',
    status,
    pricingModel,
  }: ToolsQueryDto) {
    const aggregate: PrePaginatePipelineStage[] = [];
    const match: _QueryFilterLooseId<ToolDocument> = {};

    if (search) match.$text = { $search: search };
    if (status) match.status = status;
    if (pricingModel) match.pricingModel = pricingModel;

    if (Object.keys(match).length > 0) aggregate.push({ $match: match });

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

  async getTool(identifier: string | Types.ObjectId) {
    const tool = await this.toolModel
      .findOne(
        typeof identifier === 'string'
          ? { slug: identifier }
          : { _id: identifier },
      )
      .lean()
      .exec();

    if (!tool) {
      throw new NotFoundException('Tool is not found');
    }

    return { tool };
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
      throw new BadRequestException(
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

  async updateToolLogo(toolId: Types.ObjectId, logo: string) {
    const tool = await this.toolModel
      .findByIdAndUpdate(toolId, { logo }, { returnDocument: 'before' })
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

  async removeToolLogo(toolId: Types.ObjectId) {
    const tool = await this.toolModel
      .findByIdAndUpdate(
        toolId,
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

  async updateToolCoverImage(toolId: Types.ObjectId, coverImage: string) {
    const tool = await this.toolModel
      .findByIdAndUpdate(toolId, { coverImage }, { returnDocument: 'before' })
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

  async removeToolCoverImage(toolId: Types.ObjectId) {
    const tool = await this.toolModel
      .findByIdAndUpdate(
        toolId,
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

  async addToolScreenshots(toolId: Types.ObjectId, screenshots: string[]) {
    const tool = await this.toolModel
      .findByIdAndUpdate(
        toolId,
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

  async removeToolScreenshots(toolId: Types.ObjectId, screenshots: string[]) {
    const tool = await this.toolModel
      .findByIdAndUpdate(
        toolId,
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

  async updateTool(toolId: Types.ObjectId, updateToolDto: UpdateToolDto) {
    const tool = await this.toolModel
      .findByIdAndUpdate(toolId, updateToolDto, { returnDocument: 'after' })
      .lean()
      .exec();

    if (!tool) {
      throw new NotFoundException('Tool is not found');
    }

    return { tool };
  }

  async deleteTool(toolId: Types.ObjectId) {
    const session = await this.connection.startSession();

    try {
      session.startTransaction();

      const tool = await this.toolModel
        .findByIdAndDelete(toolId, { returnDocument: 'before', session })
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
