import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import mongooseAggregatePaginate from 'mongoose-aggregate-paginate-v2';

export const reviewUsagePeriods = [
  'less-than-month',
  '1-6-months',
  '6-12-months',
  'over-1-year',
] as const;
export type ReviewUsagePeriod = (typeof reviewUsagePeriods)[number];

export const reviewStatuses = [
  'pending',
  'approved',
  'rejected',
  'flagged',
] as const;
export type ReviewStatus = (typeof reviewStatuses)[number];

export const reviewVotes = ['helpful', 'unhelpful'] as const;
export type ReviewVote = (typeof reviewVotes)[number];

@Schema({ _id: false })
class Rating {
  @Prop({ type: Number, required: true, min: 1, max: 5 })
  overall!: number;

  @Prop({ type: Number, min: 1, max: 5, default: null })
  easeOfUse!: number | null;

  @Prop({ type: Number, min: 1, max: 5, default: null })
  valueForMoney!: number | null;

  @Prop({ type: Number, min: 1, max: 5, default: null })
  features!: number | null;

  @Prop({ type: Number, min: 1, max: 5, default: null })
  support!: number | null;
}

const RatingSchema = SchemaFactory.createForClass(Rating);

@Schema({ _id: false })
class Vote {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  user!: Types.ObjectId;

  @Prop({ type: String, enum: reviewVotes, required: true })
  type!: ReviewVote;

  @Prop({ type: Date, default: Date.now })
  votedAt!: Date;
}

const VoteSchema = SchemaFactory.createForClass(Vote);

@Schema({ timestamps: true, versionKey: false })
export class Review {
  @Prop({ type: Types.ObjectId, ref: 'Tool', required: true })
  tool!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  user!: Types.ObjectId;

  @Prop({ type: RatingSchema })
  rating?: Rating;

  @Prop({
    type: String,
    trim: true,
    required: [true, 'Review title is required'],
    maxLength: [120, 'Review title max 120 chars'],
  })
  title!: string;

  @Prop({
    type: String,
    required: [true, 'Review description is required'],
    trim: true,
    minLength: [20, 'Review must be at least 20 characters'],
    maxLength: [2000, 'Review max 2000 chars'],
  })
  description!: string;

  @Prop({ type: [{ type: String, trim: true }], default: [] })
  pros!: string[];

  @Prop({ type: [{ type: String, trim: true }], default: [] })
  cons!: string[];

  @Prop({ type: String, enum: reviewUsagePeriods, required: true })
  usagePeriod!: ReviewUsagePeriod;

  @Prop({
    type: String,
    trim: true,
    maxLength: [200, 'Use case max 200 chars'],
  })
  useCase?: string;

  @Prop({ type: String, enum: reviewStatuses, default: 'pending' })
  status!: ReviewStatus;

  @Prop({ type: Number, default: 0, min: 0 })
  helpfulVotes!: number;

  @Prop({ type: Number, default: 0, min: 0 })
  unhelpfulVotes!: number;

  @Prop({ type: [VoteSchema], default: [] })
  votes!: Vote[];

  @Prop({ type: Boolean, default: false })
  isVerifiedPurchase!: boolean;
}

const ReviewSchema = SchemaFactory.createForClass(Review);

ReviewSchema.index({
  title: 'text',
  description: 'text',
  pros: 'text',
  cons: 'text',
  useCase: 'text',
});

// Single review per user per tool
ReviewSchema.index({ tool: 1, user: 1 }, { unique: true });

// Query optimizations for tool review listings (status + sorting)
ReviewSchema.index({ tool: 1, status: 1, createdAt: -1 });
ReviewSchema.index({ tool: 1, status: 1, helpfulVotes: -1 });
ReviewSchema.index({ tool: 1, status: 1, 'rating.overall': -1 });

// User and moderation queries
ReviewSchema.index({ user: 1, createdAt: -1 });
ReviewSchema.index({ status: 1, createdAt: -1 });

ReviewSchema.plugin(mongooseAggregatePaginate);

export type ReviewDocument = Review & Document;

export default ReviewSchema;
