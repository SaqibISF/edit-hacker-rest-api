import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import {
  Types,
  type PipelineStage,
  type _QueryFilterLooseId,
  type PaginateOptions,
  type AggregatePaginateModel,
  type PrePaginatePipelineStage,
} from 'mongoose';
import { Blog, type BlogDocument } from './blog.schema';
import type {
  BlogsQueryDto,
  CreateBlogDto,
  UpdateBlogDto,
} from './blog.validation.schema';
import { UserRole } from '../users/user.schema';
import { removeFileFromStorage } from '../lib/remove-file';

@Injectable()
export class BlogsService {
  constructor(
    @InjectModel(Blog.name)
    private readonly blogModel: AggregatePaginateModel<BlogDocument>,
  ) {}

  private blogPipelines(): PipelineStage[] {
    return [
      // 1. Lookup author (User)
      {
        $lookup: {
          from: 'users',
          localField: 'author',
          foreignField: '_id',
          as: 'author',
        },
      },
      {
        $unwind: {
          path: '$author',
          preserveNullAndEmptyArrays: true,
        },
      },

      // 2. Lookup related tools
      {
        $lookup: {
          from: 'tools',
          localField: 'relatedTools',
          foreignField: '_id',
          as: 'relatedToolsList',
        },
      },

      // 3. Project safe fields
      {
        $project: {
          _id: 1,
          title: 1,
          slug: 1,
          excerpt: 1,
          body: 1,
          coverImage: 1,
          icon: 1,
          category: 1,
          tags: 1,
          status: 1,
          publishedAt: 1,
          viewCount: 1,
          readTime: 1,
          isFeatured: 1,
          metaTitle: 1,
          metaDescription: 1,
          canonicalUrl: 1,
          createdAt: 1,
          updatedAt: 1,

          // Author details
          'author._id': 1,
          'author.name': 1,
          'author.avatarUrl': 1,

          // Related tools details
          relatedTools: {
            $map: {
              input: '$relatedToolsList',
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
        },
      },
    ];
  }

  async getBlogs({
    page,
    limit,
    search,
    sortBy,
    sortOrder = 'DESC',
    category,
    tag,
    author,
    relatedTool,
    status,
    isFeatured,
    role,
  }: BlogsQueryDto & { role?: UserRole; userId?: Types.ObjectId }) {
    const aggregate: PrePaginatePipelineStage[] = [];
    const match: _QueryFilterLooseId<BlogDocument> = {};

    if (role !== 'admin') {
      match.status = 'published';
    } else if (status) {
      match.status = status;
    }

    if (category) match.category = category;
    if (tag) match.tags = tag;
    if (author) match.author = author;
    if (relatedTool) match.relatedTools = relatedTool;
    if (isFeatured) match.isFeatured = isFeatured;
    if (search) match.$text = { $search: search };

    if (Object.keys(match).length > 0) aggregate.push({ $match: match });

    aggregate.push(...this.blogPipelines());

    aggregate.push({ $sort: { [sortBy]: sortOrder === 'DESC' ? -1 : 1 } });

    const options: PaginateOptions = {
      page,
      limit,
      customLabels: {
        docs: 'blogs',
        totalDocs: 'totalBlogs',
        pagingCounter: 'pageStart',
      },
    };

    const { blogs, ...meta } = await this.blogModel.aggregatePaginate(
      aggregate,
      options,
    );

    return { blogs, meta };
  }

  async getBlog({
    identifier,
    role,
    shouldIncrementView = true,
  }: {
    identifier: string | Types.ObjectId;
    role?: UserRole;
    shouldIncrementView?: boolean;
  }) {
    const match: _QueryFilterLooseId<BlogDocument> =
      typeof identifier === 'string'
        ? { slug: identifier }
        : { _id: identifier };

    if (role !== 'admin') {
      match.status = 'published';
    }

    const aggregate: PipelineStage[] = [
      { $match: match },
      ...this.blogPipelines(),
    ];

    const blogs = await this.blogModel
      .aggregate<BlogDocument>(aggregate)
      .exec();

    if (!blogs || !blogs.length) {
      throw new NotFoundException('Blog post is not found');
    }

    const blog = blogs[0];

    if (shouldIncrementView && blog.status === 'published') {
      void this.blogModel
        .findByIdAndUpdate(blog._id, { $inc: { viewCount: 1 } })
        .exec();
    }

    return { blog };
  }

  async checkSlugAvailability(slug: string) {
    const blog = await this.blogModel.exists({ slug }).lean().exec();

    return {
      message: blog
        ? `Slug '${slug}' is already taken`
        : `Slug '${slug}' is available`,
      isAvailable: !blog,
    };
  }

  async createBlog({
    userId,
    createBlogDto,
  }: {
    userId: Types.ObjectId;
    createBlogDto: CreateBlogDto;
  }) {
    const exists = await this.blogModel
      .exists({ slug: createBlogDto.slug })
      .lean()
      .exec();

    if (exists) {
      throw new ConflictException('Slug is already taken');
    }

    const blog = await this.blogModel.create({
      ...createBlogDto,
      ...(createBlogDto.status === 'published' && {
        publishedAt: new Date(),
      }),
      author: userId,
    });

    return await this.getBlog({
      identifier: blog._id,
      role: 'admin',
      shouldIncrementView: false,
    });
  }

  async updateBlog({
    blogId,
    updateBlogDto,
  }: {
    blogId: Types.ObjectId;
    updateBlogDto: UpdateBlogDto;
  }) {
    if (updateBlogDto.slug) {
      const exists = await this.blogModel
        .exists({ slug: updateBlogDto.slug, _id: { $ne: blogId } })
        .lean()
        .exec();

      if (exists) {
        throw new ConflictException('Slug is already taken');
      }
    }

    let isSetPublished = false;

    if (updateBlogDto.status === 'published') {
      const existing = await this.blogModel
        .findById(blogId)
        .select('status')
        .lean()
        .exec();

      if (existing && existing.status !== 'published') {
        isSetPublished = true;
      }
    }

    const updatedBlog = await this.blogModel
      .findByIdAndUpdate(
        blogId,
        {
          ...updateBlogDto,
          ...(isSetPublished && { publishedAt: new Date() }),
        },
        { returnDocument: 'after', runValidators: true },
      )
      .lean()
      .exec();

    if (!updatedBlog) {
      throw new NotFoundException('Blog post is not found');
    }

    return await this.getBlog({
      identifier: blogId,
      role: 'admin',
      shouldIncrementView: false,
    });
  }

  async updateBlogCoverImage({
    blogId,
    coverImage,
  }: {
    blogId: Types.ObjectId;
    coverImage: string;
  }) {
    const blog = await this.blogModel
      .findByIdAndUpdate(blogId, { coverImage }, { returnDocument: 'before' })
      .lean()
      .exec();

    if (!blog) {
      removeFileFromStorage(coverImage);
      throw new NotFoundException('Blog post is not found');
    }

    if (blog.coverImage) {
      removeFileFromStorage(blog.coverImage);
    }

    return await this.getBlog({
      identifier: blogId,
      role: 'admin',
      shouldIncrementView: false,
    });
  }

  async removeBlogCoverImage(blogId: Types.ObjectId) {
    const blog = await this.blogModel
      .findByIdAndUpdate(
        blogId,
        { $unset: { coverImage: 1 } },
        { returnDocument: 'before' },
      )
      .select('coverImage')
      .lean()
      .exec();

    if (!blog) {
      throw new NotFoundException('Blog post is not found');
    }

    if (blog.coverImage) {
      removeFileFromStorage(blog.coverImage);
    }

    return {};
  }

  async updateBlogIcon({
    blogId,
    icon,
  }: {
    blogId: Types.ObjectId;
    icon: string;
  }) {
    const blog = await this.blogModel
      .findByIdAndUpdate(blogId, { icon }, { returnDocument: 'before' })
      .lean()
      .exec();

    if (!blog) {
      removeFileFromStorage(icon);
      throw new NotFoundException('Blog post is not found');
    }

    if (blog.icon) {
      removeFileFromStorage(blog.icon);
    }

    return await this.getBlog({
      identifier: blogId,
      role: 'admin',
      shouldIncrementView: false,
    });
  }

  async removeBlogIcon(blogId: Types.ObjectId) {
    const blog = await this.blogModel
      .findByIdAndUpdate(
        blogId,
        { $unset: { icon: 1 } },
        { returnDocument: 'before' },
      )
      .select('icon')
      .lean()
      .exec();

    if (!blog) {
      throw new NotFoundException('Blog post is not found');
    }

    if (blog.icon) {
      removeFileFromStorage(blog.icon);
    }

    return {};
  }

  async deleteBlog(blogId: Types.ObjectId) {
    const blog = await this.blogModel
      .findByIdAndDelete(blogId, { returnDocument: 'before' })
      .select('coverImage icon')
      .lean()
      .exec();

    if (!blog) {
      throw new NotFoundException('Blog post is not found');
    }

    if (blog.coverImage) {
      removeFileFromStorage(blog.coverImage);
    }

    if (blog.icon) {
      removeFileFromStorage(blog.icon);
    }

    return {};
  }

  async incrementViewCount(blogId: Types.ObjectId) {
    const blog = await this.blogModel
      .findByIdAndUpdate(
        blogId,
        { $inc: { viewCount: 1 } },
        { returnDocument: 'after' },
      )
      .select('viewCount')
      .lean()
      .exec();

    if (!blog) {
      throw new NotFoundException('Blog post is not found');
    }

    return { viewCount: blog.viewCount };
  }
}
