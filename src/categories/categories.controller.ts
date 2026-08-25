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
import { CategoriesService } from './categories.service';
import { ResponseMessage } from '../decorators/response-message.decorator';
import { Types } from 'mongoose';
import { MongooseIdPipe } from '../pipes/mongoose-id/mongoose-id.pipe';
import { IdentifierPipe } from '../pipes/identifier/identifier.pipe';
import { ZodValidationPipe } from '../pipes/zod-validation/zod-validation.pipe';
import {
  categoriesQuerySchema,
  type CategoriesQueryDto,
  createCategorySchema,
  type CreateCategoryDto,
  updateCategorySchema,
  type UpdateCategoryDto,
  updateCategoryIconSchema,
  type UpdateCategoryIconDto,
  updateCategoryCoverImageSchema,
  type UpdateCategoryCoverImageDto,
} from './category.validation.schema';
import { SlugPipe } from '../pipes/slug/slug.pipe';
import { Roles } from '../decorators/roles.decorator';
import { FormDataRequest } from 'nestjs-form-data';
import { type Request } from 'express';
import {
  ApiGetCategoriesDocs,
  ApiGetCategoryDocs,
  ApiCheckSlugAvailabilityDocs,
  ApiCreateCategoryDocs,
  ApiUpdateCategoryDocs,
  ApiUpdateCategoryIconDocs,
  ApiRemoveCategoryIconDocs,
  ApiUpdateCategoryCoverImageDocs,
  ApiRemoveCategoryCoverImageDocs,
  ApiDeleteCategoryDocs,
} from './category.swagger';

@ApiTags('Categories')
@Controller('categories')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Get()
  @UsePipes(new ZodValidationPipe(categoriesQuerySchema))
  @HttpCode(HttpStatus.OK)
  @ResponseMessage('Categories successfully retrieved')
  @ApiGetCategoriesDocs()
  async getCategories(@Query() query: CategoriesQueryDto) {
    return await this.categoriesService.getCategories(query);
  }

  @Get(':identifier')
  @HttpCode(HttpStatus.OK)
  @ResponseMessage('Category successfully retrieved')
  @ApiGetCategoryDocs()
  async getCategory(
    @Param('identifier', IdentifierPipe) identifier: string | Types.ObjectId,
  ) {
    return await this.categoriesService.getCategory(identifier);
  }

  @Roles(['admin'])
  @Get(':slug/availability')
  @HttpCode(HttpStatus.OK)
  @ApiCheckSlugAvailabilityDocs()
  async checkSlugAvailability(@Param('slug', SlugPipe) slug: string) {
    return await this.categoriesService.checkSlugAvailability(slug);
  }

  @Roles(['admin'])
  @Post()
  @UsePipes(new ZodValidationPipe(createCategorySchema))
  @HttpCode(HttpStatus.CREATED)
  @ResponseMessage('Category created successfully')
  @ApiCreateCategoryDocs()
  async createCategory(@Body() createCategoryDto: CreateCategoryDto) {
    return await this.categoriesService.createCategory(createCategoryDto);
  }

  @Roles(['admin'])
  @Patch(':id')
  @UsePipes(new ZodValidationPipe(updateCategorySchema))
  @HttpCode(HttpStatus.OK)
  @ResponseMessage('Category updated successfully')
  @ApiUpdateCategoryDocs()
  async updateCategory(
    @Param('id', MongooseIdPipe) categoryId: Types.ObjectId,
    @Body() updateCategoryDto: UpdateCategoryDto,
  ) {
    return await this.categoriesService.updateCategory(
      categoryId,
      updateCategoryDto,
    );
  }

  @Roles(['admin'])
  @Patch(':id/icon')
  @FormDataRequest()
  @UsePipes(new ZodValidationPipe(updateCategoryIconSchema))
  @HttpCode(HttpStatus.OK)
  @ResponseMessage('Category icon updated successfully')
  @ApiUpdateCategoryIconDocs()
  async updateCategoryIcon(
    @Req() req: Request,
    @Param('id', MongooseIdPipe) categoryId: Types.ObjectId,
    @Body() { icon }: UpdateCategoryIconDto,
  ) {
    const protocol = req.protocol;
    const host = req.get('host');
    const iconUrl = `${protocol}://${host}/${icon.filename}`;

    return await this.categoriesService.updateCategoryIcon(categoryId, iconUrl);
  }

  @Roles(['admin'])
  @Delete(':id/icon')
  @HttpCode(HttpStatus.OK)
  @ResponseMessage('Category icon removed successfully')
  @ApiRemoveCategoryIconDocs()
  async removeCategoryIcon(
    @Param('id', MongooseIdPipe) categoryId: Types.ObjectId,
  ) {
    return await this.categoriesService.removeCategoryIcon(categoryId);
  }

  @Roles(['admin'])
  @Patch(':id/cover-image')
  @FormDataRequest()
  @UsePipes(new ZodValidationPipe(updateCategoryCoverImageSchema))
  @HttpCode(HttpStatus.OK)
  @ResponseMessage('Category cover image updated successfully')
  @ApiUpdateCategoryCoverImageDocs()
  async updateCategoryCoverImage(
    @Req() req: Request,
    @Param('id', MongooseIdPipe) categoryId: Types.ObjectId,
    @Body() { coverImage }: UpdateCategoryCoverImageDto,
  ) {
    const protocol = req.protocol;
    const host = req.get('host');
    const coverImageUrl = `${protocol}://${host}/${coverImage.filename}`;

    return await this.categoriesService.updateCategoryCoverImage(
      categoryId,
      coverImageUrl,
    );
  }

  @Roles(['admin'])
  @Delete(':id/cover-image')
  @HttpCode(HttpStatus.OK)
  @ResponseMessage('Category cover image removed successfully')
  @ApiRemoveCategoryCoverImageDocs()
  async removeCategoryCoverImage(
    @Param('id', MongooseIdPipe) categoryId: Types.ObjectId,
  ) {
    return await this.categoriesService.removeCategoryCoverImage(categoryId);
  }

  @Roles(['admin'])
  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ResponseMessage('Category deleted successfully')
  @ApiDeleteCategoryDocs()
  async deleteCategory(
    @Param('id', MongooseIdPipe) categoryId: Types.ObjectId,
  ) {
    return await this.categoriesService.deleteCategory(categoryId);
  }
}
