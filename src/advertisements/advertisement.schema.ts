import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import mongooseAggregatePaginate from 'mongoose-aggregate-paginate-v2';

export const adPlacements = [
  'homepage-banner',
  'category-top',
  'sidebar',
  'newsletter',
  'tool-detail-sidebar',
] as const;
export type AdPlacement = (typeof adPlacements)[number];

export const adPackages = ['starter', 'standard', 'premium'] as const;
export type AdPackage = (typeof adPackages)[number];

export const adPaymentStatuses = ['pending', 'paid', 'refunded'] as const;
export type AdPaymentStatus = (typeof adPaymentStatuses)[number];

export const adStatuses = [
  'pending',
  'active',
  'paused',
  'expired',
  'rejected',
] as const;
export type AdStatus = (typeof adStatuses)[number];

@Schema({ timestamps: true, versionKey: false })
export class Advertisement {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  advertiser!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Tool' })
  tool?: Types.ObjectId;

  // Ad Content
  @Prop({
    type: String,
    required: [true, 'Title is required'],
    trim: true,
    maxLength: 200,
  })
  title!: string;

  @Prop({ type: String, trim: true, maxLength: 500 })
  description?: string;

  @Prop({ type: String })
  logoUrl?: string;

  @Prop({ type: String, default: 'Try Free →', trim: true })
  ctaText!: string;

  @Prop({ type: String, required: [true, 'CTA URL is required'], trim: true })
  ctaUrl!: string;

  // Placement
  @Prop({ type: String, enum: adPlacements, required: true })
  placement!: AdPlacement;

  @Prop({
    type: [{ type: Types.ObjectId, ref: 'Category' }],
    default: [],
  })
  targetCategories!: Types.ObjectId[];

  // Scheduling
  @Prop({ type: Date, required: true })
  startDate!: Date;

  @Prop({ type: Date, required: true })
  endDate!: Date;

  // Billing
  @Prop({ type: String, enum: adPackages, default: 'standard' })
  package!: AdPackage;

  @Prop({ type: Number, required: true, min: 0 })
  priceUSD!: number;

  @Prop({ type: String, enum: adPaymentStatuses, default: 'pending' })
  paymentStatus!: AdPaymentStatus;

  @Prop({ type: String })
  paymentId?: string;

  // Status
  @Prop({ type: String, enum: adStatuses, default: 'pending' })
  status!: AdStatus;

  // Performance stats
  @Prop({ type: Number, default: 0, min: 0 })
  impressions!: number;

  @Prop({ type: Number, default: 0, min: 0 })
  clicks!: number;
}

const AdvertisementSchema = SchemaFactory.createForClass(Advertisement);

AdvertisementSchema.index({ status: 1, startDate: 1, endDate: 1 });
AdvertisementSchema.index({ placement: 1, status: 1 });
AdvertisementSchema.index({ advertiser: 1 });
AdvertisementSchema.index({ targetCategories: 1 });
AdvertisementSchema.index({
  title: 'text',
  description: 'text',
  ctaText: 'text',
});

AdvertisementSchema.plugin(mongooseAggregatePaginate);

export type AdvertisementDocument = Advertisement & Document;

export default AdvertisementSchema;
