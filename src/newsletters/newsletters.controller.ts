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
import { NewslettersService } from './newsletters.service';
import { ResponseMessage } from '../decorators/response-message.decorator';
import { Types } from 'mongoose';
import { MongooseIdPipe } from '../pipes/mongoose-id/mongoose-id.pipe';
import { ZodValidationPipe } from '../pipes/zod-validation/zod-validation.pipe';
import {
  newslettersQuerySchema,
  type NewslettersQueryDto,
  subscribeNewsletterSchema,
  type SubscribeNewsletterDto,
  updateNewsletterSchema,
  type UpdateNewsletterDto,
  updatePreferencesSchema,
  type UpdatePreferencesDto,
} from './newsletter.validation.schema';
import { Roles } from '../decorators/roles.decorator';
import { Payload } from '../decorators/payload.decorator';
import {
  ApiGetNewslettersDocs,
  ApiSubscribeNewsletterDocs,
  ApiConfirmNewsletterDocs,
  ApiUnsubscribeNewsletterDocs,
  ApiUpdateNewsletterPreferencesDocs,
  ApiUpdateNewsletterDocs,
  ApiDeleteNewsletterDocs,
} from './newsletters.swagger';

@ApiTags('newsletters')
@Controller('newsletters')
export class NewslettersController {
  constructor(private readonly newslettersService: NewslettersService) {}

  @Roles(['admin'])
  @Get()
  @UsePipes(new ZodValidationPipe(newslettersQuerySchema))
  @HttpCode(HttpStatus.OK)
  @ResponseMessage('Newsletters successfully retrieved')
  @ApiGetNewslettersDocs()
  async getNewsletters(@Query() query: NewslettersQueryDto) {
    return await this.newslettersService.getNewsletters(query);
  }

  @Post('subscribe')
  @UsePipes(new ZodValidationPipe(subscribeNewsletterSchema))
  @HttpCode(HttpStatus.OK)
  @ResponseMessage('Subscription pending. Please check your email to confirm.')
  @ApiSubscribeNewsletterDocs()
  async subscribe(
    @Body() subscribeDto: SubscribeNewsletterDto,
    @Payload('_id') userId?: Types.ObjectId,
  ) {
    return await this.newslettersService.subscribe(subscribeDto, userId);
  }

  @Get('confirm/:token')
  @HttpCode(HttpStatus.OK)
  @ResponseMessage('Subscription confirmed successfully')
  @ApiConfirmNewsletterDocs()
  async confirm(@Param('token') token: string) {
    return await this.newslettersService.confirm(token);
  }

  @Get('unsubscribe/:token')
  @HttpCode(HttpStatus.OK)
  @ResponseMessage('You have been unsubscribed successfully')
  @ApiUnsubscribeNewsletterDocs()
  async unsubscribe(@Param('token') token: string) {
    return await this.newslettersService.unsubscribe(token);
  }

  @Patch('preferences')
  @UsePipes(new ZodValidationPipe(updatePreferencesSchema))
  @HttpCode(HttpStatus.OK)
  @ResponseMessage('Preferences updated successfully')
  @ApiUpdateNewsletterPreferencesDocs()
  async updatePreferences(
    @Payload('email') email: string,
    @Body() updatePreferencesDto: UpdatePreferencesDto,
  ) {
    return await this.newslettersService.updatePreferences(
      email,
      updatePreferencesDto,
    );
  }

  @Roles(['admin'])
  @Patch(':id')
  @UsePipes(new ZodValidationPipe(updateNewsletterSchema))
  @HttpCode(HttpStatus.OK)
  @ResponseMessage('Newsletter subscription updated successfully')
  @ApiUpdateNewsletterDocs()
  async updateNewsletter(
    @Param('id', MongooseIdPipe) id: Types.ObjectId,
    @Body() updateDto: UpdateNewsletterDto,
  ) {
    return await this.newslettersService.updateNewsletter(id, updateDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ResponseMessage('Newsletter subscription deleted successfully')
  @ApiDeleteNewsletterDocs()
  async deleteNewsletter(@Param('id', MongooseIdPipe) id: Types.ObjectId) {
    return await this.newslettersService.deleteNewsletter(id);
  }
}
