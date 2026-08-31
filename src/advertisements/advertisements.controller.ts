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
import { AdvertisementsService } from './advertisements.service';
import { ResponseMessage } from '../decorators/response-message.decorator';
import type { Types } from 'mongoose';
import { MongooseIdPipe } from '../pipes/mongoose-id/mongoose-id.pipe';
import { ZodValidationPipe } from '../pipes/zod-validation/zod-validation.pipe';
import {
  advertisementsQuerySchema,
  type AdvertisementsQueryDto,
  createAdvertisementSchema,
  type CreateAdvertisementDto,
  updateAdvertisementSchema,
  type UpdateAdvertisementDto,
  updateAdLogoSchema,
  type UpdateAdLogoDto,
  trackAdActionSchema,
  type TrackAdActionDto,
} from './advertisement.validation.schema';
import { FormDataRequest } from 'nestjs-form-data';
import { type Request } from 'express';
import {
  ApiGetAdvertisementsDocs,
  ApiGetAdvertisementDocs,
  ApiCreateAdvertisementDocs,
  ApiUpdateAdvertisementDocs,
  ApiUpdateAdLogoDocs,
  ApiRemoveAdLogoDocs,
  ApiDeleteAdvertisementDocs,
  ApiTrackAdActionDocs,
} from './advertisements.swagger';
import { Payload, type PayloadData } from '../decorators/payload.decorator';
import { scopeSchema, type Scope } from '../zod-schemas/scope.schema';

@ApiTags('Advertisements')
@Controller('advertisements')
export class AdvertisementsController {
  constructor(private readonly advertisementsService: AdvertisementsService) {}

  @Get()
  @UsePipes(new ZodValidationPipe(advertisementsQuerySchema))
  @HttpCode(HttpStatus.OK)
  @ResponseMessage('Advertisements successfully retrieved')
  @ApiGetAdvertisementsDocs()
  async getAdvertisements(
    @Payload() payload: PayloadData | undefined,
    @Query() query: AdvertisementsQueryDto,
  ) {
    return await this.advertisementsService.getAdvertisements({
      ...query,
      role: payload?.role,
      userId: payload?._id,
    });
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ResponseMessage('Advertisement successfully retrieved')
  @ApiGetAdvertisementDocs()
  async getAdvertisement(
    @Payload() payload: PayloadData | undefined,
    @Param('id', MongooseIdPipe) adId: Types.ObjectId,
    @Query('scope', new ZodValidationPipe(scopeSchema)) scope: Scope,
  ) {
    return await this.advertisementsService.getAdvertisement({
      adId,
      scope,
      userId: payload?._id,
      role: payload?.role,
    });
  }

  @Post()
  @UsePipes(new ZodValidationPipe(createAdvertisementSchema))
  @HttpCode(HttpStatus.CREATED)
  @ResponseMessage('Advertisement created successfully')
  @ApiCreateAdvertisementDocs()
  async createAdvertisement(
    @Payload() { _id: userId, role }: PayloadData,
    @Body() createAdvertisementDto: CreateAdvertisementDto,
  ) {
    return await this.advertisementsService.createAdvertisement({
      userId,
      role,
      createAdvertisementDto,
    });
  }

  @Patch(':id')
  @UsePipes(new ZodValidationPipe(updateAdvertisementSchema))
  @HttpCode(HttpStatus.OK)
  @ResponseMessage('Advertisement updated successfully')
  @ApiUpdateAdvertisementDocs()
  async updateAdvertisement(
    @Payload() { _id: userId, role }: PayloadData,
    @Param('id', MongooseIdPipe) adId: Types.ObjectId,
    @Body() updateAdvertisementDto: UpdateAdvertisementDto,
  ) {
    return await this.advertisementsService.updateAdvertisement({
      adId,
      userId,
      role,
      updateAdvertisementDto,
    });
  }

  @Patch(':id/logo')
  @FormDataRequest()
  @UsePipes(new ZodValidationPipe(updateAdLogoSchema))
  @HttpCode(HttpStatus.OK)
  @ResponseMessage('Advertisement logo updated successfully')
  @ApiUpdateAdLogoDocs()
  async updateAdLogo(
    @Req() req: Request,
    @Payload() { _id: userId, role }: PayloadData,
    @Param('id', MongooseIdPipe) adId: Types.ObjectId,
    @Body() { logo }: UpdateAdLogoDto,
  ) {
    const protocol = req.protocol;
    const host = req.get('host');
    const logoUrl = `${protocol}://${host}/${logo.filename}`;

    return await this.advertisementsService.updateAdLogo({
      adId,
      logoUrl,
      userId,
      role,
    });
  }

  @Delete(':id/logo')
  @HttpCode(HttpStatus.OK)
  @ResponseMessage('Advertisement logo removed successfully')
  @ApiRemoveAdLogoDocs()
  async removeAdLogo(
    @Payload() { _id: userId, role }: PayloadData,
    @Param('id', MongooseIdPipe) adId: Types.ObjectId,
  ) {
    return await this.advertisementsService.removeAdLogo({
      adId,
      userId,
      role,
    });
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ResponseMessage('Advertisement deleted successfully')
  @ApiDeleteAdvertisementDocs()
  async deleteAdvertisement(
    @Payload() { _id: userId, role }: PayloadData,
    @Param('id', MongooseIdPipe) adId: Types.ObjectId,
  ) {
    return await this.advertisementsService.deleteAdvertisement({
      adId,
      userId,
      role,
    });
  }

  @Post(':id/action')
  @UsePipes(new ZodValidationPipe(trackAdActionSchema))
  @HttpCode(HttpStatus.OK)
  @ResponseMessage('Advertisement action tracked successfully')
  @ApiTrackAdActionDocs()
  async trackAdAction(
    @Param('id', MongooseIdPipe) adId: Types.ObjectId,
    @Body() trackAdActionDto: TrackAdActionDto,
  ) {
    return await this.advertisementsService.trackAdAction({
      adId,
      trackAdActionDto,
    });
  }
}
