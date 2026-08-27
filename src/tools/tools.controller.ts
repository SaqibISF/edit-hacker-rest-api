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
  ApiIncrementViewCountDocs,
  ApiIncrementClickCountDocs,
  ApiIncrementSaveCountDocs,
} from './tool.swagger';
import { Payload, type PayloadData } from '../decorators/payload.decorator';
import { FormDataRequest } from 'nestjs-form-data';
import { type Request } from 'express';
import { scopeSchema, type Scope } from '../zod-schemas/scope.schema';

@ApiTags('Tools')
@Controller('tools')
export class ToolsController {
  constructor(private readonly toolsService: ToolsService) {}

  @Get()
  @UsePipes(new ZodValidationPipe(toolsQuerySchema))
  @HttpCode(HttpStatus.OK)
  @ApiGetToolsDocs()
  @ResponseMessage('Tools successfully retrieved')
  async getTools(
    @Payload() payload: PayloadData | undefined,
    @Query() query: ToolsQueryDto,
  ) {
    return await this.toolsService.getTools({
      ...query,
      userId: payload?._id,
      role: payload?.role,
    });
  }

  @Get(':identifier')
  @HttpCode(HttpStatus.OK)
  @ResponseMessage('Tool successfully retrieved')
  @ApiGetToolDocs()
  async getTool(
    @Payload() payload: PayloadData | undefined,
    @Query('scope', new ZodValidationPipe(scopeSchema)) scope: Scope,
    @Param('identifier', IdentifierPipe) identifier: string | Types.ObjectId,
  ) {
    return await this.toolsService.getTool({
      identifier,
      scope,
      userId: payload?._id,
      role: payload?.role,
    });
  }

  @Get(':slug/availability')
  @HttpCode(HttpStatus.OK)
  @ApiCheckSlugAvailabilityDocs()
  async checkSlugAvailability(@Param('slug', SlugPipe) slug: string) {
    return await this.toolsService.checkSlugAvailability(slug);
  }

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

  @Get(':identifier/increment-view-count')
  @HttpCode(HttpStatus.OK)
  @ResponseMessage('View count incremented successfully')
  @ApiIncrementViewCountDocs()
  async incrementViewCount(
    @Param('identifier', IdentifierPipe) identifier: string | Types.ObjectId,
  ) {
    return await this.toolsService.incrementViewCount(identifier);
  }

  @Get(':identifier/increment-click-count')
  @HttpCode(HttpStatus.OK)
  @ResponseMessage('Click count incremented successfully')
  @ApiIncrementClickCountDocs()
  async incrementClickCount(
    @Param('identifier', IdentifierPipe) identifier: string | Types.ObjectId,
  ) {
    return await this.toolsService.incrementClickCount(identifier);
  }

  @Get(':identifier/increment-save-count')
  @HttpCode(HttpStatus.OK)
  @ResponseMessage('Save count incremented successfully')
  @ApiIncrementSaveCountDocs()
  async incrementSaveCount(
    @Param('identifier', IdentifierPipe) identifier: string | Types.ObjectId,
  ) {
    return await this.toolsService.incrementSaveCount(identifier);
  }

  @Patch(':id/logo')
  @FormDataRequest()
  @UsePipes(new ZodValidationPipe(updateToolLogoSchema))
  @HttpCode(HttpStatus.OK)
  @ResponseMessage('Logo updated successfully')
  @ApiUpdateToolLogoDocs()
  async updateToolLogo(
    @Req() req: Request,
    @Payload() { _id: userId, role }: PayloadData,
    @Param('id', MongooseIdPipe) toolId: Types.ObjectId,
    @Body() { logo }: UpdateToolLogoDto,
  ) {
    const protocol = req.protocol;
    const host = req.get('host');

    const logoUrl = `${protocol}://${host}/${logo.filename}`;

    return await this.toolsService.updateToolLogo({
      toolId,
      logo: logoUrl,
      userId,
      role,
    });
  }

  @Delete(':id/logo')
  @HttpCode(HttpStatus.OK)
  @ResponseMessage('Logo removed successfully')
  @ApiRemoveToolLogoDocs()
  async removeToolLogo(
    @Payload() { _id: userId, role }: PayloadData,
    @Param('id', MongooseIdPipe) toolId: Types.ObjectId,
  ) {
    return await this.toolsService.removeToolLogo({ toolId, userId, role });
  }

  @Patch(':id/cover-image')
  @FormDataRequest()
  @UsePipes(new ZodValidationPipe(updateToolCoverImageSchema))
  @HttpCode(HttpStatus.OK)
  @ResponseMessage('Cover image updated successfully')
  @ApiUpdateToolCoverImageDocs()
  async updateToolCoverImage(
    @Req() req: Request,
    @Payload() { _id: userId, role }: PayloadData,
    @Param('id', MongooseIdPipe) toolId: Types.ObjectId,
    @Body() { coverImage }: UpdateToolCoverImageDto,
  ) {
    const protocol = req.protocol;
    const host = req.get('host');

    const coverImageUrl = `${protocol}://${host}/${coverImage.filename}`;

    return await this.toolsService.updateToolCoverImage({
      toolId,
      coverImage: coverImageUrl,
      userId,
      role,
    });
  }

  @Delete(':id/cover-image')
  @HttpCode(HttpStatus.OK)
  @ResponseMessage('Cover image removed successfully')
  @ApiRemoveToolCoverImageDocs()
  async removeToolCoverImage(
    @Payload() { _id: userId, role }: PayloadData,
    @Param('id', MongooseIdPipe) toolId: Types.ObjectId,
  ) {
    return await this.toolsService.removeToolCoverImage({
      toolId,
      userId,
      role,
    });
  }

  @Patch(':id/screenshots')
  @FormDataRequest()
  @UsePipes(new ZodValidationPipe(updateToolScreenshotsSchema))
  @HttpCode(HttpStatus.OK)
  @ResponseMessage('Screenshots updated successfully')
  @ApiUpdateToolScreenshotsDocs()
  async updateToolScreenshots(
    @Req() req: Request,
    @Payload() { _id: userId, role }: PayloadData,
    @Param('id', MongooseIdPipe) toolId: Types.ObjectId,
    @Body() { screenshots }: UpdateToolScreenshotsDto,
  ) {
    const protocol = req.protocol;
    const host = req.get('host');

    const screenshotsUrls = screenshots.map(
      (screenshot) => `${protocol}://${host}/${screenshot.filename}`,
    );

    return await this.toolsService.addToolScreenshots({
      toolId,
      screenshots: screenshotsUrls,
      userId,
      role,
    });
  }

  @Delete(':id/screenshots')
  @UsePipes(new ZodValidationPipe(removeToolScreenshotsSchema))
  @HttpCode(HttpStatus.OK)
  @ResponseMessage('Screenshots removed successfully')
  @ApiRemoveToolScreenshotsDocs()
  async removeToolScreenshots(
    @Payload() { _id: userId, role }: PayloadData,
    @Param('id', MongooseIdPipe) toolId: Types.ObjectId,
    @Body() { screenshots }: RemoveToolScreenshotsDto,
  ) {
    return await this.toolsService.removeToolScreenshots({
      toolId,
      screenshots,
      userId,
      role,
    });
  }

  @Post(':id/plans')
  @UsePipes(new ZodValidationPipe(addToolPlanSchema))
  @HttpCode(HttpStatus.OK)
  @ResponseMessage('Tool plan added successfully')
  @ApiAddToolPlanDocs()
  async addToolPlan(
    @Payload() { _id: userId, role }: PayloadData,
    @Param('id', MongooseIdPipe) toolId: Types.ObjectId,
    @Body() addToolPlanDto: AddToolPlanDto,
  ) {
    return await this.toolsService.addToolPlan({
      toolId,
      addToolPlanDto,
      userId,
      role,
    });
  }

  @Patch(':id/plans/:planId')
  @UsePipes(new ZodValidationPipe(updateToolPlanSchema))
  @HttpCode(HttpStatus.OK)
  @ResponseMessage('Tool plan updated successfully')
  @ApiUpdateToolPlanDocs()
  async updateToolPlan(
    @Payload() { _id: userId, role }: PayloadData,
    @Param('id', MongooseIdPipe) toolId: Types.ObjectId,
    @Param('planId', MongooseIdPipe) planId: Types.ObjectId,
    @Body() updateToolPlanDto: UpdateToolPlanDto,
  ) {
    return await this.toolsService.updateToolPlan({
      toolId,
      planId,
      updateToolPlanDto,
      userId,
      role,
    });
  }

  @Delete(':id/plans/:planId')
  @HttpCode(HttpStatus.OK)
  @ResponseMessage('Tool plan removed successfully')
  @ApiDeleteToolPlanDocs()
  async deleteToolPlan(
    @Payload() { _id: userId, role }: PayloadData,
    @Param('id', MongooseIdPipe) toolId: Types.ObjectId,
    @Param('planId', MongooseIdPipe) planId: Types.ObjectId,
  ) {
    return await this.toolsService.deleteToolPlan({
      toolId,
      planId,
      userId,
      role,
    });
  }

  @Patch(':id')
  @UsePipes(new ZodValidationPipe(updateToolSchema))
  @HttpCode(HttpStatus.OK)
  @ResponseMessage('Tool updated successfully')
  @ApiUpdateToolDocs()
  async updateTool(
    @Payload() { _id: userId, role }: PayloadData,
    @Param('id', MongooseIdPipe) toolId: Types.ObjectId,
    @Body() updateToolDto: UpdateToolDto,
  ) {
    return await this.toolsService.updateTool({
      toolId,
      updateToolDto,
      userId,
      role,
    });
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ResponseMessage('Tool deleted successfully')
  @ApiDeleteToolDocs()
  async deleteTool(
    @Payload() { _id: userId, role }: PayloadData,
    @Param('id', MongooseIdPipe) toolId: Types.ObjectId,
  ) {
    return await this.toolsService.deleteTool({ toolId, userId, role });
  }
}
