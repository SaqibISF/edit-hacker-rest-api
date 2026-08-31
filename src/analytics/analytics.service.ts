import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Types, type AggregatePaginateModel } from 'mongoose';
import { Analytics, type AnalyticsDocument } from './analytics.schema';
import { Tool, type ToolDocument } from '../tools/tool.schema';
import type {
  AnalyticsPeriod,
  AnalyticsQueryDto,
  OverviewAnalyticsQueryDto,
  TrackEventDto,
} from './analytics.validation.schema';

export interface SummaryAggregateResult {
  _id: null;
  totalViews: number;
  totalClicks: number;
  totalSaves: number;
  totalSearchImpressions: number;
  desktop: number;
  mobile: number;
  tablet: number;
}

export interface TopToolAggregateResult {
  _id: Types.ObjectId;
  views: number;
  clicks: number;
  saves: number;
  searchImpressions: number;
  tool: {
    _id: Types.ObjectId;
    name: string;
    slug: string;
    logo?: string;
    tagline?: string;
    rating?: { average?: number; count?: number };
  };
}

export interface DailyAggregateResult {
  date: Date;
  views: number;
  clicks: number;
  saves: number;
  searchImpressions: number;
}

@Injectable()
export class AnalyticsService {
  constructor(
    @InjectModel(Analytics.name)
    private readonly analyticsModel: AggregatePaginateModel<AnalyticsDocument>,
    @InjectModel(Tool.name)
    private readonly toolModel: AggregatePaginateModel<ToolDocument>,
  ) {}

  private getTodayUTC(): Date {
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);
    return today;
  }

  private sanitizeReferrer(referrer?: string): string | null {
    if (!referrer) return null;
    try {
      const url = referrer.startsWith('http')
        ? referrer
        : `https://${referrer}`;
      const hostname = new URL(url).hostname.replace(/^www\./, '');
      return hostname.replace(/[.$]/g, '_') || null;
    } catch {
      return referrer.substring(0, 50).replace(/[.$]/g, '_');
    }
  }

  private calculateDateRange({
    period,
    startDate,
    endDate,
    days,
  }: {
    period?: AnalyticsPeriod;
    startDate?: Date;
    endDate?: Date;
    days?: number;
  }): { from: Date; to: Date } {
    const now = new Date();
    const to = endDate ? new Date(endDate) : new Date(now);
    to.setUTCHours(23, 59, 59, 999);

    let from: Date;

    if (startDate) {
      from = new Date(startDate);
      from.setUTCHours(0, 0, 0, 0);
    } else {
      let dayCount = days || 30;
      if (period === '7d') dayCount = 7;
      else if (period === '30d') dayCount = 30;
      else if (period === '90d') dayCount = 90;
      else if (period === '365d') dayCount = 365;

      from = new Date(to.getTime() - dayCount * 24 * 60 * 60 * 1000);
      from.setUTCHours(0, 0, 0, 0);
    }

    return { from, to };
  }

  async getToolAnalytics({
    identifier,
    query,
  }: {
    identifier: string | Types.ObjectId;
    query: AnalyticsQueryDto;
  }) {
    const tool = await this.toolModel
      .findOne(
        typeof identifier === 'string'
          ? { slug: identifier }
          : { _id: identifier },
      )
      .select('_id name slug logo tagline rating')
      .lean()
      .exec();

    if (!tool) {
      throw new NotFoundException('Tool not found');
    }

    const { from, to } = this.calculateDateRange(query);

    const daily = await this.analyticsModel
      .find({
        tool: tool._id,
        date: { $gte: from, $lte: to },
      })
      .sort({ date: 1 })
      .lean()
      .exec();

    const totals = {
      views: 0,
      clicks: 0,
      saves: 0,
      searchImpressions: 0,
      devices: {
        desktop: 0,
        mobile: 0,
        tablet: 0,
      },
    };

    const referrerMap = new Map<string, number>();

    daily.forEach((d) => {
      totals.views += d.views || 0;
      totals.clicks += d.clicks || 0;
      totals.saves += d.saves || 0;
      totals.searchImpressions += d.searchImpressions || 0;

      if (d.devices) {
        totals.devices.desktop += d.devices.desktop || 0;
        totals.devices.mobile += d.devices.mobile || 0;
        totals.devices.tablet += d.devices.tablet || 0;
      }

      if (d.referrers) {
        const refs: [string, number][] =
          d.referrers instanceof Map
            ? Array.from(d.referrers.entries())
            : Object.entries(d.referrers as unknown as Record<string, number>);
        refs.forEach(([ref, count]) => {
          referrerMap.set(ref, (referrerMap.get(ref) || 0) + Number(count));
        });
      }
    });

    const topReferrers = Array.from(referrerMap.entries())
      .map(([referrer, count]) => ({ referrer, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    return {
      tool,
      period: query.period || '30d',
      from,
      to,
      totals,
      topReferrers,
      daily,
    };
  }

  async getOverview(query: OverviewAnalyticsQueryDto) {
    const { from, to } = this.calculateDateRange(query);

    const [summaryAgg, topToolsAgg, dailyAgg] = await Promise.all([
      // 1. Overall aggregate metrics across all tools
      this.analyticsModel.aggregate<SummaryAggregateResult>([
        { $match: { date: { $gte: from, $lte: to } } },
        {
          $group: {
            _id: null,
            totalViews: { $sum: '$views' },
            totalClicks: { $sum: '$clicks' },
            totalSaves: { $sum: '$saves' },
            totalSearchImpressions: { $sum: '$searchImpressions' },
            desktop: { $sum: '$devices.desktop' },
            mobile: { $sum: '$devices.mobile' },
            tablet: { $sum: '$devices.tablet' },
          },
        },
      ]),

      // 2. Top tools ranked by views
      this.analyticsModel.aggregate<TopToolAggregateResult>([
        { $match: { date: { $gte: from, $lte: to } } },
        {
          $group: {
            _id: '$tool',
            views: { $sum: '$views' },
            clicks: { $sum: '$clicks' },
            saves: { $sum: '$saves' },
            searchImpressions: { $sum: '$searchImpressions' },
          },
        },
        { $sort: { views: -1 } },
        { $limit: query.limit || 10 },
        {
          $lookup: {
            from: 'tools',
            localField: '_id',
            foreignField: '_id',
            as: 'tool',
          },
        },
        { $unwind: '$tool' },
        {
          $project: {
            _id: 1,
            views: 1,
            clicks: 1,
            saves: 1,
            searchImpressions: 1,
            'tool._id': 1,
            'tool.name': 1,
            'tool.slug': 1,
            'tool.logo': 1,
            'tool.tagline': 1,
            'tool.rating': 1,
          },
        },
      ]),

      // 3. Daily time-series breakdown across entire platform
      this.analyticsModel.aggregate<DailyAggregateResult>([
        { $match: { date: { $gte: from, $lte: to } } },
        {
          $group: {
            _id: '$date',
            views: { $sum: '$views' },
            clicks: { $sum: '$clicks' },
            saves: { $sum: '$saves' },
            searchImpressions: { $sum: '$searchImpressions' },
          },
        },
        { $sort: { _id: 1 } },
        {
          $project: {
            _id: 0,
            date: '$_id',
            views: 1,
            clicks: 1,
            saves: 1,
            searchImpressions: 1,
          },
        },
      ]),
    ]);

    const s: SummaryAggregateResult = summaryAgg[0] || {
      _id: null,
      totalViews: 0,
      totalClicks: 0,
      totalSaves: 0,
      totalSearchImpressions: 0,
      desktop: 0,
      mobile: 0,
      tablet: 0,
    };

    return {
      period: query.period || '30d',
      from,
      to,
      summary: {
        views: s.totalViews,
        clicks: s.totalClicks,
        saves: s.totalSaves,
        searchImpressions: s.totalSearchImpressions,
      },
      devices: {
        desktop: s.desktop,
        mobile: s.mobile,
        tablet: s.tablet,
      },
      topTools: topToolsAgg,
      daily: dailyAgg,
    };
  }

  async trackEvent(trackEventDto: TrackEventDto) {
    const today = this.getTodayUTC();
    const { tool, event, device, referrer } = trackEventDto;

    const inc: Record<string, number> = {
      [event]: 1,
    };

    if (device) {
      inc[`devices.${device}`] = 1;
    }

    const sanitizedRef = this.sanitizeReferrer(referrer);
    if (sanitizedRef) {
      inc[`referrers.${sanitizedRef}`] = 1;
    }

    const updates: Promise<unknown>[] = [
      this.analyticsModel
        .findOneAndUpdate(
          { tool, date: today },
          { $inc: inc },
          { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true },
        )
        .exec(),
    ];

    if (event === 'views') {
      updates.push(
        this.toolModel
          .findByIdAndUpdate(tool, { $inc: { viewCount: 1 } })
          .exec(),
      );
    } else if (event === 'clicks') {
      updates.push(
        this.toolModel
          .findByIdAndUpdate(tool, { $inc: { clickCount: 1 } })
          .exec(),
      );
    } else if (event === 'saves') {
      updates.push(
        this.toolModel
          .findByIdAndUpdate(tool, { $inc: { saveCount: 1 } })
          .exec(),
      );
    }

    await Promise.all(updates);

    return { success: true };
  }
}
