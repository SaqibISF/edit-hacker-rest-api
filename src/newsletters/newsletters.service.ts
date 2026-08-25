import {
  Injectable,
  NotFoundException,
  ConflictException,
  HttpStatus,
} from '@nestjs/common';
import crypto from 'crypto';
import { InjectModel } from '@nestjs/mongoose';
import { Newsletter, NewsletterDocument } from './newsletter.schema';
import {
  _QueryFilterLooseId,
  type AggregatePaginateModel,
  PaginateOptions,
  PrePaginatePipelineStage,
  Types,
} from 'mongoose';
import {
  NewslettersQueryDto,
  SubscribeNewsletterDto,
  UpdateNewsletterDto,
  UpdatePreferencesDto,
} from './newsletter.validation.schema';
import { ResendService } from 'nestjs-resend';
import { EnvService } from '../env/env.service';
import NewsletterConfirmEmail from '../emails/NewsletterConfirmEmail';

@Injectable()
export class NewslettersService {
  constructor(
    @InjectModel(Newsletter.name)
    private readonly newsletterModel: AggregatePaginateModel<NewsletterDocument>,
    private readonly resendService: ResendService,
    private readonly envService: EnvService,
  ) {}

  async getNewsletters(query: NewslettersQueryDto) {
    const {
      page = 1,
      limit = 10,
      search,
      status,
      source,
      sortBy,
      sortOrder,
    } = query;

    const aggregate: PrePaginatePipelineStage[] = [];
    const match: _QueryFilterLooseId<NewsletterDocument> = {};

    if (search) match.$text = { $search: search };
    if (status !== undefined) match.status = status;
    if (source !== undefined) match.source = source;

    if (Object.keys(match).length > 0) aggregate.push({ $match: match });

    aggregate.push({ $sort: { [sortBy]: sortOrder === 'DESC' ? -1 : 1 } });

    const options: PaginateOptions = {
      page,
      limit,
      customLabels: {
        docs: 'newsletters',
        totalDocs: 'totalNewsletters',
        pagingCounter: 'pageStart',
      },
    };

    const { newsletters, ...meta } =
      await this.newsletterModel.aggregatePaginate(aggregate, options);

    return { newsletters, meta };
  }

  async subscribe(
    subscribeNewsletterDto: SubscribeNewsletterDto,
    user?: Types.ObjectId,
  ) {
    const existing = await this.newsletterModel
      .findOne({ email: subscribeNewsletterDto.email })
      .select('_id status')
      .lean()
      .exec();

    if (existing && existing.status !== 'unsubscribed') {
      throw new ConflictException('Email is already subscribed');
    }

    const confirmToken = crypto.randomBytes(32).toString('hex');
    const unsubscribeToken = crypto.randomBytes(32).toString('hex');
    const confirmTokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000);

    const newsletter = await this.newsletterModel
      .findByIdAndUpdate(
        existing?._id,
        {
          ...subscribeNewsletterDto,
          unsubscribedAt: null,
          ...(user
            ? { user, status: 'confirmed', confirmedAt: new Date() }
            : { status: 'pending', confirmToken, confirmTokenExpiry }),
          unsubscribeToken,
        },
        { returnDocument: 'after', upsert: true },
      )
      .lean()
      .exec();

    if (!user) {
      const { error } = await this.resendService.send({
        from: this.envService.resend_email_from,
        to: subscribeNewsletterDto.email,
        subject: 'Verify Account',
        react: NewsletterConfirmEmail({
          name: subscribeNewsletterDto.name ?? 'User',
          confirmLink: `${this.envService.frontend_url}/newsletters/confirm/${confirmToken}`,
          unsubscribeLink: `${this.envService.frontend_url}/newsletters/unsubscribe/${unsubscribeToken}`,
        }),
      });

      if (error) {
        const statusCode =
          (error as { statusCode?: number }).statusCode ||
          HttpStatus.INTERNAL_SERVER_ERROR;

        console.error(
          `${statusCode} - Failed to sent verification email to ${subscribeNewsletterDto.email} - ${error.message}`,
        );
      }
    }

    return { newsletter };
  }

  async confirm(token: string) {
    const newsletter = await this.newsletterModel
      .findOneAndUpdate(
        {
          confirmToken: token,
          confirmTokenExpiry: { $gt: new Date() },
        },
        {
          $set: { status: 'confirmed', confirmedAt: new Date() },
          $unset: { confirmToken: 1, confirmTokenExpiry: 1 },
        },
        { returnDocument: 'after' },
      )
      .lean()
      .exec();

    if (!newsletter) {
      throw new NotFoundException(
        'Confirmation link is invalid or has expired',
      );
    }

    return { newsletter };
  }

  async unsubscribe(token: string) {
    const newsletter = await this.newsletterModel
      .findOneAndUpdate(
        { unsubscribeToken: token },
        {
          $set: { status: 'unsubscribed', unsubscribedAt: new Date() },
          $unset: { unsubscribeToken: 1 },
        },
        { returnDocument: 'after' },
      )
      .lean()
      .exec();

    if (!newsletter) {
      throw new NotFoundException('Invalid unsubscribe link');
    }

    return { newsletter };
  }

  async updatePreferences(
    email: string,
    updatePreferencesDto: UpdatePreferencesDto,
  ) {
    const updatePayload = Object.keys(updatePreferencesDto).reduce(
      (acc, key) => {
        acc[`preferences.${key}`] =
          updatePreferencesDto[key as keyof UpdatePreferencesDto];
        return acc;
      },
      {} as Record<string, unknown>,
    );

    const newsletter = await this.newsletterModel
      .findOneAndUpdate(
        { email },
        { $set: updatePayload },
        { returnDocument: 'after' },
      )
      .lean()
      .exec();

    if (!newsletter) {
      throw new NotFoundException('Newsletter subscription not found');
    }

    return { newsletter };
  }

  async updateNewsletter(
    newsletterId: Types.ObjectId,
    updateNewsletterDto: UpdateNewsletterDto,
  ) {
    const newsletter = await this.newsletterModel
      .findByIdAndUpdate(newsletterId, updateNewsletterDto, {
        returnDocument: 'after',
      })
      .lean()
      .exec();

    if (!newsletter) {
      throw new NotFoundException('Newsletter subscription not found');
    }

    return { newsletter };
  }

  async deleteNewsletter(newsletterId: Types.ObjectId) {
    const newsletter = await this.newsletterModel
      .findByIdAndDelete(newsletterId)
      .lean()
      .exec();

    if (!newsletter) {
      throw new NotFoundException('Newsletter subscription not found');
    }

    return {};
  }
}
