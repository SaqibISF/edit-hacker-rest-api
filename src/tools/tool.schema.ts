import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import mongooseAggregatePaginate from 'mongoose-aggregate-paginate-v2';

export const toolBillingCycles = [
  'monthly',
  'yearly',
  'one-time',
  'free',
] as const;
export type ToolBillingCycle = (typeof toolBillingCycles)[number];

export const toolPlateForms = [
  'web',
  'ios',
  'android',
  'desktop-mac',
  'desktop-windows',
  'desktop-linux',
  'api',
  'browser-extension',
] as const;
export type ToolPlateForm = (typeof toolPlateForms)[number];

export const toolPricingModels = [
  'free',
  'freemium',
  'paid',
  'free-trial',
  'open-source',
] as const;
export type ToolPricingModel = (typeof toolPricingModels)[number];

export const toolStatuses = [
  'pending',
  'approved',
  'rejected',
  'draft',
] as const;
export type ToolStatus = (typeof toolStatuses)[number];

export const toolListingType = ['free', 'standard', 'featured'] as const;
export type ToolListingType = (typeof toolListingType)[number];

@Schema()
class PricingPlan {
  @Prop({ type: String, required: true })
  name!: string;

  @Prop({ type: Number, required: true })
  price!: number;

  @Prop({
    type: String,
    enum: toolBillingCycles,
    default: 'monthly',
  })
  billingCycle!: ToolBillingCycle;

  @Prop([{ type: String, default: [] }])
  features!: string[];

  @Prop({ type: Boolean, default: false })
  isPopular!: boolean;

  @Prop({ type: Number, default: 0 })
  trialDays!: number;
}

const PricingSchema = SchemaFactory.createForClass(PricingPlan);

@Schema({ _id: false })
class Links {
  @Prop({ type: String })
  website?: string;

  @Prop({ type: String })
  twitter?: string;

  @Prop({ type: String })
  instagram?: string;

  @Prop({ type: String })
  linkedIn?: string;

  @Prop({ type: String })
  youtube?: string;

  @Prop({ type: String })
  discord?: string;

  @Prop({ type: String })
  github?: string;

  @Prop({ type: String })
  appStore?: string;

  @Prop({ type: String })
  playStore?: string;

  @Prop({ type: String })
  apiDocs?: string;
}

const LinksSchema = SchemaFactory.createForClass(Links);

@Schema({ timestamps: true, versionKey: false })
export class Tool {
  @Prop({
    type: String,
    required: [true, 'Tool name is required'],
    trim: true,
    maxLength: [100, 'Name max 100 chars'],
  })
  name!: string;

  @Prop({
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  })
  slug!: string;

  @Prop({
    type: String,
    required: [true, 'Tagline is required'],
    trim: true,
    maxLength: [160, 'Tagline max 160 chars'],
  })
  tagline!: string;

  @Prop({
    type: String,
    required: [true, 'Description is required'],
    trim: true,
  })
  description!: string;

  @Prop({ type: String })
  logo?: string;

  @Prop({ type: String })
  coverImage?: string;

  @Prop({ type: [{ type: String }], default: [] })
  screenshots!: string[];

  @Prop({
    type: Types.ObjectId,
    ref: 'Category',
    required: [true, 'Category is required'],
  })
  category!: Types.ObjectId;

  @Prop({ type: [{ type: String, lowercase: true, trim: true }], default: [] })
  tags!: string[];

  @Prop({ type: String, enum: toolPricingModels, required: true })
  pricingModel!: ToolPricingModel;

  @Prop({
    type: Number,
    default: 0, // USD cents
  })
  startingPrice!: number;

  @Prop({ type: [PricingSchema], default: [] })
  plans!: PricingPlan[];

  @Prop({ type: [{ type: String, enum: toolPlateForms }], default: [] })
  platforms!: ToolPlateForm[];

  @Prop({ type: LinksSchema })
  links?: Links;

  @Prop({ type: String, select: false })
  affiliateUrl?: string;

  @Prop({
    type: {
      average: { type: Number, default: 0, min: 0, max: 5 },
      count: { type: Number, default: 0 },
    },
  })
  rating!: { average: number; count: number };

  @Prop({ type: Number, default: 0 })
  viewCount!: number;

  @Prop({ type: Number, default: 0 })
  clickCount!: number;

  @Prop({ type: Number, default: 0 })
  saveCount!: number;

  @Prop({
    type: Types.ObjectId,
    ref: 'User',
    required: [true, 'SubmittedBy is required'],
  })
  submittedBy!: Types.ObjectId;

  @Prop({ type: String, enum: toolStatuses, default: 'pending' })
  status!: ToolStatus;

  @Prop({ type: String })
  rejectionReason?: string;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  reviewedBy?: Types.ObjectId;

  @Prop({ type: Date })
  reviewedAt?: Date;

  @Prop({ type: String, enum: toolListingType, default: 'free' })
  listingType!: ToolListingType;

  @Prop({ type: Boolean, default: false })
  isFeatured!: boolean;

  @Prop({ type: Boolean, default: false })
  isSponsored!: boolean;

  @Prop({ type: Boolean, default: false })
  isVerified!: boolean;

  @Prop({ type: Date })
  featuredUntil?: Date;

  @Prop({ type: String, trim: true })
  metaTitle?: string;

  @Prop({ type: String, trim: true })
  metaDescription?: string;

  @Prop({ type: Date })
  launchDate?: Date;

  @Prop({ type: Boolean, default: true })
  isActive!: boolean;
}

const ToolSchema = SchemaFactory.createForClass(Tool);

ToolSchema.index({
  name: 'text',
  slug: 'text',
  tagline: 'text',
  tags: 'text',
  metaTitle: 'text',
  metaDescription: 'text',
});

ToolSchema.plugin(mongooseAggregatePaginate);

export type ToolDocument = Tool & Document;

export default ToolSchema;
