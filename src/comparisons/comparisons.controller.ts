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
  UsePipes,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ComparisonsService } from './comparisons.service';
import { ResponseMessage } from '../decorators/response-message.decorator';
import { Types } from 'mongoose';
import { MongooseIdPipe } from '../pipes/mongoose-id/mongoose-id.pipe';
import { ZodValidationPipe } from '../pipes/zod-validation/zod-validation.pipe';
import { Roles } from '../decorators/roles.decorator';
import { Payload, type PayloadData } from '../decorators/payload.decorator';
import {
  ApiGetComparisonsDocs,
  ApiGetComparisonDocs,
  ApiCheckComparisonSlugAvailabilityDocs,
  ApiCreateComparisonDocs,
  ApiUpdateComparisonDocs,
  ApiDeleteComparisonDocs,
} from './comparisons.swagger';
import {
  comparisonsQuerySchema,
  type ComparisonsQueryDto,
  createComparisonSchema,
  type CreateComparisonDto,
  updateComparisonSchema,
  type UpdateComparisonDto,
} from './comparison.validation.schema';
import { SlugPipe } from '../pipes/slug/slug.pipe';
import { IdentifierPipe } from '../pipes/identifier/identifier.pipe';
import { scopeSchema, type Scope } from '../zod-schemas/scope.schema';

@ApiTags('comparisons')
@Controller('comparisons')
export class ComparisonsController {
  constructor(private readonly comparisonsService: ComparisonsService) {}

  @Get()
  @UsePipes(new ZodValidationPipe(comparisonsQuerySchema))
  @HttpCode(HttpStatus.OK)
  @ResponseMessage('Comparisons fetched successfully')
  @ApiGetComparisonsDocs()
  async getMyComparisons(
    @Payload() payload: PayloadData | undefined,
    @Query() query: ComparisonsQueryDto,
  ) {
    return await this.comparisonsService.getComparisons({
      ...query,
      userId: payload?._id,
      role: payload?.role,
    });
  }

  @Get(':identifier')
  @HttpCode(HttpStatus.OK)
  @ResponseMessage('Comparison fetched successfully')
  @ApiGetComparisonDocs()
  async getComparison(
    @Payload() payload: PayloadData | undefined,
    @Query('scope', new ZodValidationPipe(scopeSchema)) scope: Scope,
    @Param('identifier', IdentifierPipe) identifier: string | Types.ObjectId,
  ) {
    return await this.comparisonsService.getComparison(
      identifier,
      scope,
      payload?._id,
      payload?.role,
    );
  }

  @Get(':slug/availability')
  @HttpCode(HttpStatus.OK)
  @ApiCheckComparisonSlugAvailabilityDocs()
  async checkSlugAvailability(@Param('slug', SlugPipe) slug: string) {
    return await this.comparisonsService.checkSlugAvailability(slug);
  }

  @Post()
  @UsePipes(new ZodValidationPipe(createComparisonSchema))
  @HttpCode(HttpStatus.CREATED)
  @ResponseMessage('Comparison created successfully')
  @ApiCreateComparisonDocs()
  async createComparison(
    @Payload() payload: PayloadData,
    @Body() createComparisonDto: CreateComparisonDto,
  ) {
    return await this.comparisonsService.createComparison(
      payload._id,
      payload.role,
      createComparisonDto,
    );
  }

  @Roles(['admin'])
  @Patch(':id')
  @UsePipes(new ZodValidationPipe(updateComparisonSchema))
  @HttpCode(HttpStatus.OK)
  @ResponseMessage('Comparison updated successfully')
  @ApiUpdateComparisonDocs()
  async updateComparison(
    @Param('id', MongooseIdPipe) comparisonId: Types.ObjectId,
    @Body() updateComparisonDto: UpdateComparisonDto,
  ) {
    return await this.comparisonsService.updateComparison(
      comparisonId,
      updateComparisonDto,
    );
  }

  @Roles(['admin'])
  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ResponseMessage('Comparison deleted successfully')
  @ApiDeleteComparisonDocs()
  async deleteComparison(
    @Param('id', MongooseIdPipe) comparisonId: Types.ObjectId,
  ) {
    return await this.comparisonsService.deleteComparison(comparisonId);
  }
}
