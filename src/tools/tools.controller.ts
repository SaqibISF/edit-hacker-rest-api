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
import { ToolsService } from './tools.service';
import { ResponseMessage } from '../decorators/response-message.decorator';
import { Types } from 'mongoose';
import { MongooseIdPipe } from '../pipes/mongoose-id/mongoose-id.pipe';
import { IdentifierPipe } from '../pipes/identifier/identifier.pipe';
import { ZodValidationPipe } from '../pipes/zod-validation/zod-validation.pipe';
import {
  toolsQuerySchema,
  type ToolsQueryDto,
  createToolSchema,
  type CreateToolDto,
  updateToolSchema,
  type UpdateToolDto,
  updateToolLogoSchema,
  type UpdateToolLogoDto,
  updateToolCoverImageSchema,
  type UpdateToolCoverImageDto,
  updateToolScreenshotsSchema,
  type UpdateToolScreenshotsDto,
  removeToolScreenshotsSchema,
  type RemoveToolScreenshotsDto,
  addToolPlanSchema,
  type AddToolPlanDto,
  updateToolPlanSchema,
  type UpdateToolPlanDto,
} from './tool.validation.schema';
import { SlugPipe } from '../pipes/slug/slug.pipe';
import { Roles } from '../decorators/roles.decorator';
import {
  ApiGetToolsDocs,
  ApiGetToolDocs,
  ApiCheckSlugAvailabilityDocs,
  ApiCreateToolDocs,
  ApiUpdateToolLogoDocs,
  ApiRemoveToolLogoDocs,
  ApiUpdateToolCoverImageDocs,
  ApiRemoveToolCoverImageDocs,
  ApiUpdateToolScreenshotsDocs,
  ApiRemoveToolScreenshotsDocs,
  ApiUpdateToolDocs,
  ApiDeleteToolDocs,
  ApiAddToolPlanDocs,
  ApiUpdateToolPlanDocs,
  ApiDeleteToolPlanDocs,
} from './tool.swagger';
import { Payload } from '../decorators/payload.decorator';
import { FormDataRequest } from 'nestjs-form-data';
import { type Request } from 'express';

@ApiTags('Tools')
@Controller('tools')
export class ToolsController {
  constructor(private readonly toolsService: ToolsService) {}

  @Get()
  @UsePipes(new ZodValidationPipe(toolsQuerySchema))
  @HttpCode(HttpStatus.OK)
  @ApiGetToolsDocs()
  @ResponseMessage('Tools successfully retrieved')
  async getTools(@Query() query: ToolsQueryDto) {
    return await this.toolsService.getTools(query);
  }

  @Get(':identifier')
  @HttpCode(HttpStatus.OK)
  @ResponseMessage('Tool successfully retrieved')
  @ApiGetToolDocs()
  async getTool(
    @Param('identifier', IdentifierPipe) identifier: string | Types.ObjectId,
  ) {
    return await this.toolsService.getTool(identifier);
  }

  @Roles(['admin'])
  @Get(':slug/availability')
  @HttpCode(HttpStatus.OK)
  @ApiCheckSlugAvailabilityDocs()
  async checkSlugAvailability(@Param('slug', SlugPipe) slug: string) {
    return await this.toolsService.checkSlugAvailability(slug);
  }

  @Roles(['admin'])
  @Post()
  @UsePipes(new ZodValidationPipe(createToolSchema))
  @HttpCode(HttpStatus.CREATED)
  @ResponseMessage('Tool created successfully')
  @ApiCreateToolDocs()
  async createTool(
    @Payload('_id') userId: Types.ObjectId,
    @Body() createToolDto: CreateToolDto,
  ) {
    return await this.toolsService.createTool(userId, createToolDto);
  }

  @Roles(['admin'])
  @Patch(':id/logo')
  @FormDataRequest()
  @UsePipes(new ZodValidationPipe(updateToolLogoSchema))
  @HttpCode(HttpStatus.OK)
  @ResponseMessage('Logo updated successfully')
  @ApiUpdateToolLogoDocs()
  async updateToolLogo(
    @Req() req: Request,
    @Param('id', MongooseIdPipe) toolId: Types.ObjectId,
    @Body() { logo }: UpdateToolLogoDto,
  ) {
    const protocol = req.protocol;
    const host = req.get('host');

    const logoUrl = `${protocol}://${host}/${logo.filename}`;

    return await this.toolsService.updateToolLogo(toolId, logoUrl);
  }

  @Roles(['admin'])
  @Delete(':id/logo')
  @HttpCode(HttpStatus.OK)
  @ResponseMessage('Logo removed successfully')
  @ApiRemoveToolLogoDocs()
  async removeToolLogo(@Param('id', MongooseIdPipe) toolId: Types.ObjectId) {
    return await this.toolsService.removeToolLogo(toolId);
  }

  @Roles(['admin'])
  @Patch(':id/cover-image')
  @FormDataRequest()
  @UsePipes(new ZodValidationPipe(updateToolCoverImageSchema))
  @HttpCode(HttpStatus.OK)
  @ResponseMessage('Cover image updated successfully')
  @ApiUpdateToolCoverImageDocs()
  async updateToolCoverImage(
    @Req() req: Request,
    @Param('id', MongooseIdPipe) toolId: Types.ObjectId,
    @Body() { coverImage }: UpdateToolCoverImageDto,
  ) {
    const protocol = req.protocol;
    const host = req.get('host');

    const coverImageUrl = `${protocol}://${host}/${coverImage.filename}`;

    return await this.toolsService.updateToolCoverImage(toolId, coverImageUrl);
  }

  @Roles(['admin'])
  @Delete(':id/cover-image')
  @HttpCode(HttpStatus.OK)
  @ResponseMessage('Cover image removed successfully')
  @ApiRemoveToolCoverImageDocs()
  async removeToolCoverImage(
    @Param('id', MongooseIdPipe) toolId: Types.ObjectId,
  ) {
    return await this.toolsService.removeToolCoverImage(toolId);
  }

  @Roles(['admin'])
  @Patch(':id/screenshots')
  @FormDataRequest()
  @UsePipes(new ZodValidationPipe(updateToolScreenshotsSchema))
  @HttpCode(HttpStatus.OK)
  @ResponseMessage('Screenshots updated successfully')
  @ApiUpdateToolScreenshotsDocs()
  async updateToolScreenshots(
    @Req() req: Request,
    @Param('id', MongooseIdPipe) toolId: Types.ObjectId,
    @Body() { screenshots }: UpdateToolScreenshotsDto,
  ) {
    const protocol = req.protocol;
    const host = req.get('host');

    const screenshotsUrls = screenshots.map(
      (screenshot) => `${protocol}://${host}/${screenshot.filename}`,
    );

    return await this.toolsService.addToolScreenshots(toolId, screenshotsUrls);
  }

  @Roles(['admin'])
  @Delete(':id/screenshots')
  @UsePipes(new ZodValidationPipe(removeToolScreenshotsSchema))
  @HttpCode(HttpStatus.OK)
  @ResponseMessage('Screenshots removed successfully')
  @ApiRemoveToolScreenshotsDocs()
  async removeToolScreenshots(
    @Param('id', MongooseIdPipe) toolId: Types.ObjectId,
    @Body() { screenshots }: RemoveToolScreenshotsDto,
  ) {
    return await this.toolsService.removeToolScreenshots(toolId, screenshots);
  }

  @Roles(['admin'])
  @Post(':id/plans')
  @UsePipes(new ZodValidationPipe(addToolPlanSchema))
  @HttpCode(HttpStatus.OK)
  @ResponseMessage('Tool plan added successfully')
  @ApiAddToolPlanDocs()
  async addToolPlan(
    @Param('id', MongooseIdPipe) toolId: Types.ObjectId,
    @Body() addToolPlanDto: AddToolPlanDto,
  ) {
    return await this.toolsService.addToolPlan(toolId, addToolPlanDto);
  }

  @Roles(['admin'])
  @Patch(':id/plans/:planId')
  @UsePipes(new ZodValidationPipe(updateToolPlanSchema))
  @HttpCode(HttpStatus.OK)
  @ResponseMessage('Tool plan updated successfully')
  @ApiUpdateToolPlanDocs()
  async updateToolPlan(
    @Param('id', MongooseIdPipe) toolId: Types.ObjectId,
    @Param('planId', MongooseIdPipe) planId: Types.ObjectId,
    @Body() updateToolPlanDto: UpdateToolPlanDto,
  ) {
    return await this.toolsService.updateToolPlan(
      toolId,
      planId,
      updateToolPlanDto,
    );
  }

  @Roles(['admin'])
  @Delete(':id/plans/:planId')
  @HttpCode(HttpStatus.OK)
  @ResponseMessage('Tool plan removed successfully')
  @ApiDeleteToolPlanDocs()
  async deleteToolPlan(
    @Param('id', MongooseIdPipe) toolId: Types.ObjectId,
    @Param('planId', MongooseIdPipe) planId: Types.ObjectId,
  ) {
    return await this.toolsService.deleteToolPlan(toolId, planId);
  }

  @Roles(['admin'])
  @Patch(':id')
  @UsePipes(new ZodValidationPipe(updateToolSchema))
  @HttpCode(HttpStatus.OK)
  @ResponseMessage('Tool updated successfully')
  @ApiUpdateToolDocs()
  async updateTool(
    @Param('id', MongooseIdPipe) toolId: Types.ObjectId,
    @Body() updateToolDto: UpdateToolDto,
  ) {
    return await this.toolsService.updateTool(toolId, updateToolDto);
  }

  @Roles(['admin'])
  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ResponseMessage('Tool deleted successfully')
  @ApiDeleteToolDocs()
  async deleteTool(@Param('id', MongooseIdPipe) toolId: Types.ObjectId) {
    return await this.toolsService.deleteTool(toolId);
  }
}
