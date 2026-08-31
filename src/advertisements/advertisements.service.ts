import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
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
import {
  Advertisement,
  type AdvertisementDocument,
} from './advertisement.schema';
import type {
  AdvertisementsQueryDto,
  CreateAdvertisementDto,
  TrackAdActionDto,
  UpdateAdvertisementDto,
} from './advertisement.validation.schema';
import { UserRole } from '../users/user.schema';
import { Scope } from '../zod-schemas/scope.schema';
import { removeFileFromStorage } from '../lib/remove-file';

@Injectable()
export class AdvertisementsService {
  constructor(
    @InjectModel(Advertisement.name)
    private readonly advertisementModel: AggregatePaginateModel<AdvertisementDocument>,
  ) {}

  private adPipelines(): PipelineStage[] {
    return [
      // 1. Lookup advertiser (User)
      {
        $lookup: {
          from: 'users',
          localField: 'advertiser',
          foreignField: '_id',
          as: 'advertiser',
        },
      },
      {
        $unwind: {
          path: '$advertiser',
          preserveNullAndEmptyArrays: true,
        },
      },

      // 2. Lookup tool (Tool)
      {
        $lookup: {
          from: 'tools',
          localField: 'tool',
          foreignField: '_id',
          as: 'tool',
        },
      },
      {
        $unwind: {
          path: '$tool',
          preserveNullAndEmptyArrays: true,
        },
      },

      // 3. Lookup targetCategories (Categories)
      {
        $lookup: {
          from: 'categories',
          localField: 'targetCategories',
          foreignField: '_id',
          as: 'targetCategoriesList',
        },
      },

      // 4. Project safe fields
      {
        $project: {
          _id: 1,
          title: 1,
          description: 1,
          logoUrl: 1,
          ctaText: 1,
          ctaUrl: 1,
          placement: 1,
          startDate: 1,
          endDate: 1,
          package: 1,
          priceUSD: 1,
          paymentStatus: 1,
          paymentId: 1,
          status: 1,
          impressions: 1,
          clicks: 1,
          createdAt: 1,
          updatedAt: 1,

          // Advertiser
          'advertiser._id': 1,
          'advertiser.name': 1,
          'advertiser.avatarUrl': 1,
          'advertiser.email': 1,

          // Tool (conditionally projected if exists)
          tool: {
            $cond: {
              if: { $gt: [{ $type: '$tool' }, 'missing'] },
              then: {
                _id: '$tool._id',
                name: '$tool.name',
                slug: '$tool.slug',
                tagline: '$tool.tagline',
                logo: '$tool.logo',
              },
              else: null,
            },
          },

          // Target categories
          targetCategories: {
            $map: {
              input: '$targetCategoriesList',
              as: 'cat',
              in: {
                _id: '$$cat._id',
                name: '$$cat.name',
                slug: '$$cat.slug',
                icon: '$$cat.icon',
              },
            },
          },
        },
      },
    ];
  }

  async getAdvertisements({
    page,
    limit,
    search,
    sortBy,
    sortOrder = 'DESC',
    placement,
    status,
    package: adPackage,
    paymentStatus,
    advertiser,
    tool,
    targetCategory,
    startDate,
    endDate,
    scope,
    userId,
    role,
  }: AdvertisementsQueryDto & { userId?: Types.ObjectId; role?: UserRole }) {
    const aggregate: PrePaginatePipelineStage[] = [];
    const match: _QueryFilterLooseId<AdvertisementDocument> = {};

    if (scope === 'mine') {
      if (!userId) {
        throw new UnauthorizedException(
          'You must be logged in to view your advertisements',
        );
      }
      match.advertiser = userId;
    } else if (role === 'admin' && advertiser) match.advertiser = advertiser;

    if (scope === 'public' && role !== 'admin') {
      const now = new Date();
      match.status = 'active';
      match.startDate = { $lte: now };
      match.endDate = { $gte: now };
    } else {
      if (status) match.status = status;
      if (startDate) match.startDate = { $gte: startDate };
      if (endDate) match.endDate = { $lte: endDate };
    }

    if (placement) match.placement = placement;
    if (adPackage) match.package = adPackage;
    if (paymentStatus) match.paymentStatus = paymentStatus;
    if (tool) match.tool = tool;
    if (targetCategory) match.targetCategories = targetCategory;

    if (search) match.$text = { $search: search };

    if (Object.keys(match).length > 0) aggregate.push({ $match: match });

    aggregate.push(...this.adPipelines());

    aggregate.push({ $sort: { [sortBy]: sortOrder === 'DESC' ? -1 : 1 } });

    const options: PaginateOptions = {
      page,
      limit,
      customLabels: {
        docs: 'advertisements',
        totalDocs: 'totalAdvertisements',
        pagingCounter: 'pageStart',
      },
    };

    const { advertisements, ...meta } =
      await this.advertisementModel.aggregatePaginate(aggregate, options);

    return { advertisements, meta };
  }

  async getAdvertisement({
    adId,
    scope,
    userId,
    role,
  }: {
    adId: Types.ObjectId;
    scope: Scope;
    userId?: Types.ObjectId;
    role?: UserRole;
  }) {
    const match: _QueryFilterLooseId<AdvertisementDocument> = { _id: adId };

    if (scope === 'mine') {
      if (!userId) {
        throw new UnauthorizedException(
          'You must be logged in to view your advertisement',
        );
      }
      match.advertiser = userId;
    }

    if (scope === 'public' && role !== 'admin') {
      const now = new Date();
      match.status = 'active';
      match.startDate = { $lte: now };
      match.endDate = { $gte: now };
    }

    const aggregate: PipelineStage[] = [
      { $match: match },
      ...this.adPipelines(),
    ];

    const ads = await this.advertisementModel
      .aggregate<AdvertisementDocument>(aggregate)
      .exec();

    if (!ads || !ads.length) {
      throw new NotFoundException('Advertisement not found');
    }

    return { advertisement: ads[0] };
  }

  async createAdvertisement({
    userId,
    role,
    createAdvertisementDto,
  }: {
    userId: Types.ObjectId;
    role: UserRole;
    createAdvertisementDto: CreateAdvertisementDto;
  }) {
    if (createAdvertisementDto.endDate <= createAdvertisementDto.startDate) {
      throw new BadRequestException('End date must be after start date');
    }

    const status =
      role === 'admin' && createAdvertisementDto.status
        ? createAdvertisementDto.status
        : 'pending';

    const paymentStatus =
      role === 'admin' && createAdvertisementDto.paymentStatus
        ? createAdvertisementDto.paymentStatus
        : 'pending';

    const ad = await this.advertisementModel.create({
      ...createAdvertisementDto,
      advertiser: userId,
      status,
      paymentStatus,
    });

    return await this.getAdvertisement({
      adId: ad._id,
      scope: 'mine',
      userId,
      role,
    });
  }

  async updateAdvertisement({
    adId,
    userId,
    role,
    updateAdvertisementDto,
  }: {
    adId: Types.ObjectId;
    userId: Types.ObjectId;
    role: UserRole;
    updateAdvertisementDto: UpdateAdvertisementDto;
  }) {
    if (role !== 'admin') {
      delete updateAdvertisementDto.status;
      delete updateAdvertisementDto.paymentStatus;
      delete updateAdvertisementDto.priceUSD;
      delete updateAdvertisementDto.paymentId;
    }

    const existing = await this.advertisementModel
      .findOne({ _id: adId, ...(role !== 'admin' && { advertiser: userId }) })
      .select('startDate endDate')
      .lean()
      .exec();

    if (!existing) {
      throw new NotFoundException('Advertisement not found');
    }

    const startDate = updateAdvertisementDto.startDate ?? existing.startDate;
    const endDate = updateAdvertisementDto.endDate ?? existing.endDate;

    if (endDate <= startDate) {
      throw new BadRequestException('End date must be after start date');
    }

    const updated = await this.advertisementModel
      .findOneAndUpdate(
        { _id: adId, ...(role !== 'admin' && { advertiser: userId }) },
        updateAdvertisementDto,
        {
          returnDocument: 'after',
          runValidators: true,
        },
      )
      .lean()
      .exec();

    if (!updated) {
      throw new NotFoundException('Advertisement not found');
    }

    return await this.getAdvertisement({
      adId,
      role,
      scope: 'mine',
      userId,
    });
  }

  async updateAdLogo({
    adId,
    logoUrl,
    userId,
    role,
  }: {
    adId: Types.ObjectId;
    logoUrl: string;
    userId: Types.ObjectId;
    role: UserRole;
  }) {
    const ad = await this.advertisementModel
      .findOneAndUpdate(
        { _id: adId, ...(role !== 'admin' && { advertiser: userId }) },
        { logoUrl },
        { returnDocument: 'before' },
      )
      .lean()
      .exec();

    if (!ad) {
      removeFileFromStorage(logoUrl);
      throw new NotFoundException('Advertisement not found');
    }

    if (ad.logoUrl) {
      removeFileFromStorage(ad.logoUrl);
    }

    return await this.getAdvertisement({
      adId,
      role,
      scope: 'mine',
      userId,
    });
  }

  async removeAdLogo({
    adId,
    userId,
    role,
  }: {
    adId: Types.ObjectId;
    userId: Types.ObjectId;
    role: UserRole;
  }) {
    const ad = await this.advertisementModel
      .findOneAndUpdate(
        { _id: adId, ...(role !== 'admin' && { advertiser: userId }) },
        { $unset: { logoUrl: 1 } },
        { returnDocument: 'before' },
      )
      .select('logoUrl')
      .lean()
      .exec();

    if (!ad) {
      throw new NotFoundException('Advertisement not found');
    }

    if (ad.logoUrl) {
      removeFileFromStorage(ad.logoUrl);
    }

    return {};
  }

  async deleteAdvertisement({
    adId,
    userId,
    role,
  }: {
    adId: Types.ObjectId;
    userId: Types.ObjectId;
    role: UserRole;
  }) {
    const ad = await this.advertisementModel
      .findOneAndDelete({
        _id: adId,
        ...(role !== 'admin' && { advertiser: userId }),
      })
      .select('logoUrl')
      .lean()
      .exec();

    if (!ad) {
      throw new NotFoundException('Advertisement not found');
    }

    if (ad.logoUrl) {
      removeFileFromStorage(ad.logoUrl);
    }

    return {};
  }

  async trackAdAction({
    adId,
    trackAdActionDto,
  }: {
    adId: Types.ObjectId;
    trackAdActionDto: TrackAdActionDto;
  }) {
    const { action } = trackAdActionDto;
    const field = action === 'impression' ? 'impressions' : 'clicks';

    const ad = await this.advertisementModel
      .findByIdAndUpdate(
        adId,
        { $inc: { [field]: 1 } },
        { returnDocument: 'after' },
      )
      .select('ctaUrl impressions clicks')
      .lean()
      .exec();

    if (!ad) {
      throw new NotFoundException('Advertisement not found');
    }

    return {
      success: true,
      ...(action === 'click' ? { ctaUrl: ad.ctaUrl } : {}),
      impressions: ad.impressions,
      clicks: ad.clicks,
    };
  }
}
