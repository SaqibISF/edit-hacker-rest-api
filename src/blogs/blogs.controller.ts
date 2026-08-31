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
  Req,
  UsePipes,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { BlogsService } from './blogs.service';
import { ResponseMessage } from '../decorators/response-message.decorator';
import { Types } from 'mongoose';
import { MongooseIdPipe } from '../pipes/mongoose-id/mongoose-id.pipe';
import { IdentifierPipe } from '../pipes/identifier/identifier.pipe';
import { SlugPipe } from '../pipes/slug/slug.pipe';
import { ZodValidationPipe } from '../pipes/zod-validation/zod-validation.pipe';
import {
  blogsQuerySchema,
  type BlogsQueryDto,
  createBlogSchema,
  type CreateBlogDto,
  updateBlogSchema,
  type UpdateBlogDto,
  updateBlogCoverImageSchema,
  type UpdateBlogCoverImageDto,
  updateBlogIconSchema,
  type UpdateBlogIconDto,
} from './blog.validation.schema';
import { Roles } from '../decorators/roles.decorator';
import { FormDataRequest } from 'nestjs-form-data';
import { type Request } from 'express';
import {
  ApiGetBlogsDocs,
  ApiGetBlogDocs,
  ApiCheckBlogSlugAvailabilityDocs,
  ApiCreateBlogDocs,
  ApiUpdateBlogDocs,
  ApiUpdateBlogCoverImageDocs,
  ApiRemoveBlogCoverImageDocs,
  ApiUpdateBlogIconDocs,
  ApiRemoveBlogIconDocs,
  ApiDeleteBlogDocs,
  ApiIncrementBlogViewCountDocs,
} from './blogs.swagger';
import { Payload, type PayloadData } from '../decorators/payload.decorator';

@ApiTags('Blogs')
@Controller('blogs')
export class BlogsController {
  constructor(private readonly blogsService: BlogsService) {}

  @Get()
  @UsePipes(new ZodValidationPipe(blogsQuerySchema))
  @HttpCode(HttpStatus.OK)
  @ResponseMessage('Blogs successfully retrieved')
  @ApiGetBlogsDocs()
  async getBlogs(
    @Payload() payload: PayloadData | undefined,
    @Query() query: BlogsQueryDto,
  ) {
    return await this.blogsService.getBlogs({
      ...query,
      role: payload?.role,
      userId: payload?._id,
    });
  }

  @Get(':identifier')
  @HttpCode(HttpStatus.OK)
  @ResponseMessage('Blog successfully retrieved')
  @ApiGetBlogDocs()
  async getBlog(
    @Payload() payload: PayloadData | undefined,
    @Param('identifier', IdentifierPipe) identifier: string | Types.ObjectId,
  ) {
    return await this.blogsService.getBlog({
      identifier,
      role: payload?.role,
      shouldIncrementView: true,
    });
  }

  @Roles(['admin'])
  @Get(':slug/availability')
  @HttpCode(HttpStatus.OK)
  @ApiCheckBlogSlugAvailabilityDocs()
  async checkSlugAvailability(@Param('slug', SlugPipe) slug: string) {
    return await this.blogsService.checkSlugAvailability(slug);
  }

  @Roles(['admin'])
  @Post()
  @UsePipes(new ZodValidationPipe(createBlogSchema))
  @HttpCode(HttpStatus.CREATED)
  @ResponseMessage('Blog created successfully')
  @ApiCreateBlogDocs()
  async createBlog(
    @Payload('_id') userId: Types.ObjectId,
    @Body() createBlogDto: CreateBlogDto,
  ) {
    return await this.blogsService.createBlog({ userId, createBlogDto });
  }

  @Roles(['admin'])
  @Patch(':id')
  @UsePipes(new ZodValidationPipe(updateBlogSchema))
  @HttpCode(HttpStatus.OK)
  @ResponseMessage('Blog updated successfully')
  @ApiUpdateBlogDocs()
  async updateBlog(
    @Param('id', MongooseIdPipe) blogId: Types.ObjectId,
    @Body() updateBlogDto: UpdateBlogDto,
  ) {
    return await this.blogsService.updateBlog({ blogId, updateBlogDto });
  }

  @Roles(['admin'])
  @Patch(':id/cover-image')
  @FormDataRequest()
  @UsePipes(new ZodValidationPipe(updateBlogCoverImageSchema))
  @HttpCode(HttpStatus.OK)
  @ResponseMessage('Blog cover image updated successfully')
  @ApiUpdateBlogCoverImageDocs()
  async updateBlogCoverImage(
    @Req() req: Request,
    @Param('id', MongooseIdPipe) blogId: Types.ObjectId,
    @Body() { coverImage }: UpdateBlogCoverImageDto,
  ) {
    const protocol = req.protocol;
    const host = req.get('host');
    const coverImageUrl = `${protocol}://${host}/${coverImage.filename}`;

    return await this.blogsService.updateBlogCoverImage({
      blogId,
      coverImage: coverImageUrl,
    });
  }

  @Roles(['admin'])
  @Delete(':id/cover-image')
  @HttpCode(HttpStatus.OK)
  @ResponseMessage('Blog cover image removed successfully')
  @ApiRemoveBlogCoverImageDocs()
  async removeBlogCoverImage(
    @Param('id', MongooseIdPipe) blogId: Types.ObjectId,
  ) {
    return await this.blogsService.removeBlogCoverImage(blogId);
  }

  @Roles(['admin'])
  @Patch(':id/icon')
  @FormDataRequest()
  @UsePipes(new ZodValidationPipe(updateBlogIconSchema))
  @HttpCode(HttpStatus.OK)
  @ResponseMessage('Blog icon updated successfully')
  @ApiUpdateBlogIconDocs()
  async updateBlogIcon(
    @Req() req: Request,
    @Param('id', MongooseIdPipe) blogId: Types.ObjectId,
    @Body() { icon }: UpdateBlogIconDto,
  ) {
    const protocol = req.protocol;
    const host = req.get('host');
    const iconUrl = `${protocol}://${host}/${icon.filename}`;

    return await this.blogsService.updateBlogIcon({
      blogId,
      icon: iconUrl,
    });
  }

  @Roles(['admin'])
  @Delete(':id/icon')
  @HttpCode(HttpStatus.OK)
  @ResponseMessage('Blog icon removed successfully')
  @ApiRemoveBlogIconDocs()
  async removeBlogIcon(@Param('id', MongooseIdPipe) blogId: Types.ObjectId) {
    return await this.blogsService.removeBlogIcon(blogId);
  }

  @Roles(['admin'])
  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ResponseMessage('Blog deleted successfully')
  @ApiDeleteBlogDocs()
  async deleteBlog(@Param('id', MongooseIdPipe) blogId: Types.ObjectId) {
    return await this.blogsService.deleteBlog(blogId);
  }

  @Post(':id/increment-view')
  @HttpCode(HttpStatus.OK)
  @ResponseMessage('Blog view count incremented')
  @ApiIncrementBlogViewCountDocs()
  async incrementViewCount(
    @Param('id', MongooseIdPipe) blogId: Types.ObjectId,
  ) {
    return await this.blogsService.incrementViewCount(blogId);
  }
}
