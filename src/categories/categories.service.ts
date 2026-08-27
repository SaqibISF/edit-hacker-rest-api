import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Category, CategoryDocument } from './category.schema';
import {
  _QueryFilterLooseId,
  PaginateOptions,
  PrePaginatePipelineStage,
  QueryFilter,
  Types,
  type AggregatePaginateModel,
} from 'mongoose';
import type {
  CategoriesQueryDto,
  CreateCategoryDto,
  UpdateCategoryDto,
} from './category.validation.schema';
import { removeFileFromStorage } from '../lib/remove-file';
import { UserRole } from 'src/users/user.schema';

@Injectable()
export class CategoriesService {
  constructor(
    @InjectModel(Category.name)
    private readonly categoryModel: AggregatePaginateModel<CategoryDocument>,
  ) {}

  async getCategories({
    page,
    limit,
    search,
    sortBy,
    sortOrder = 'ASC',
    isActive,
    isFeatured,
    role,
  }: CategoriesQueryDto & { userId?: Types.ObjectId; role?: UserRole }) {
    const aggregate: PrePaginatePipelineStage[] = [];
    const match: _QueryFilterLooseId<CategoryDocument> = {};

    if (role === 'admin' && isActive) match.isActive = isActive;
    else match.isActive = true;

    if (search) match.$text = { $search: search };
    if (isFeatured) match.isFeatured = isFeatured;

    if (Object.keys(match).length > 0) aggregate.push({ $match: match });

    aggregate.push({ $sort: { [sortBy]: sortOrder === 'DESC' ? -1 : 1 } });

    const options: PaginateOptions = {
      page,
      limit,
      customLabels: {
        docs: 'categories',
        totalDocs: 'totalCategories',
        pagingCounter: 'pageStart',
      },
    };

    const { categories, ...meta } = await this.categoryModel.aggregatePaginate(
      aggregate,
      options,
    );

    return { categories, meta };
  }

  async getCategory(identifier: string | Types.ObjectId, role?: UserRole) {
    const query: QueryFilter<CategoryDocument> =
      typeof identifier === 'string'
        ? { slug: identifier }
        : { _id: identifier };

    if (role !== 'admin') query.isActive = true;

    const category = await this.categoryModel.findOne(query).lean().exec();

    if (!category) {
      throw new NotFoundException('Category is not found');
    }

    return { category };
  }

  async checkSlugAvailability(slug: string) {
    const category = await this.categoryModel.exists({ slug }).lean().exec();

    return {
      message: category
        ? `Slug '${slug}' is already taken`
        : `Slug '${slug}' is available`,
      isAvailable: !category,
    };
  }

  async createCategory(createCategoryDto: CreateCategoryDto) {
    const exists = await this.categoryModel
      .exists({ slug: createCategoryDto.slug })
      .lean()
      .exec();

    if (exists) {
      throw new BadRequestException(
        `Slug "${createCategoryDto.slug}" is already taken`,
      );
    }

    const category = await this.categoryModel.create(createCategoryDto);

    return { category };
  }

  async updateCategory(
    categoryId: Types.ObjectId,
    updateCategoryDto: UpdateCategoryDto,
  ) {
    if (updateCategoryDto.slug) {
      const exists = await this.categoryModel
        .exists({
          slug: updateCategoryDto.slug,
          _id: { $ne: categoryId },
        })
        .lean()
        .exec();

      if (exists) {
        throw new BadRequestException(
          `Slug "${updateCategoryDto.slug}" is already taken`,
        );
      }
    }

    const category = await this.categoryModel
      .findByIdAndUpdate(categoryId, updateCategoryDto, {
        returnDocument: 'after',
      })
      .lean()
      .exec();

    if (!category) {
      throw new NotFoundException('Category is not found');
    }

    return { category };
  }

  async updateCategoryIcon(categoryId: Types.ObjectId, icon: string) {
    const category = await this.categoryModel
      .findByIdAndUpdate(categoryId, { icon }, { returnDocument: 'before' })
      .select('icon')
      .lean()
      .exec();

    if (!category) {
      removeFileFromStorage(icon);
      throw new NotFoundException('Category is not found');
    }

    removeFileFromStorage(category.icon);

    category.icon = icon;

    return { category };
  }

  async removeCategoryIcon(categoryId: Types.ObjectId) {
    const category = await this.categoryModel
      .findByIdAndUpdate(
        categoryId,
        { $unset: { icon: 1 } },
        { returnDocument: 'before' },
      )
      .select('icon')
      .lean()
      .exec();

    if (!category) {
      throw new NotFoundException('Category is not found');
    }

    if (!category.icon) {
      throw new BadRequestException('Category icon is already removed');
    }

    removeFileFromStorage(category.icon);

    return {};
  }

  async updateCategoryCoverImage(
    categoryId: Types.ObjectId,
    coverImage: string,
  ) {
    const category = await this.categoryModel
      .findByIdAndUpdate(
        categoryId,
        { coverImage },
        { returnDocument: 'before' },
      )
      .select('coverImage')
      .lean()
      .exec();

    if (!category) {
      removeFileFromStorage(coverImage);
      throw new NotFoundException('Category is not found');
    }

    removeFileFromStorage(category.coverImage);

    category.coverImage = coverImage;

    return { category };
  }

  async removeCategoryCoverImage(categoryId: Types.ObjectId) {
    const category = await this.categoryModel
      .findByIdAndUpdate(
        categoryId,
        { $unset: { coverImage: 1 } },
        { returnDocument: 'before' },
      )
      .select('coverImage')
      .lean()
      .exec();

    if (!category) {
      throw new NotFoundException('Category is not found');
    }

    if (!category.coverImage) {
      throw new BadRequestException('Category cover image is already removed');
    }

    removeFileFromStorage(category.coverImage);

    return {};
  }

  async deleteCategory(categoryId: Types.ObjectId) {
    const category = await this.categoryModel
      .findByIdAndDelete(categoryId, { returnDocument: 'before' })
      .select('icon coverImage')
      .lean()
      .exec();

    if (!category) {
      throw new NotFoundException('Category is not found');
    }

    removeFileFromStorage(category.icon);
    removeFileFromStorage(category.coverImage);

    return {};
  }
}
