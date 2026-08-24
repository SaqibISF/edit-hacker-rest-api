import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import mongooseAggregatePaginate from 'mongoose-aggregate-paginate-v2';

export const newsletterStatuses = [
  'pending',
  'confirmed',
  'unsubscribed',
] as const;
export type NewsletterStatus = (typeof newsletterStatuses)[number];

export const newsletterSources = [
  'homepage',
  'blog',
  'footer',
  'popup',
  'api',
] as const;
export type NewsletterSource = (typeof newsletterSources)[number];

@Schema({ _id: false })
class Preferences {
  @Prop({ type: Boolean, default: true })
  weeklyDigest!: boolean;

  @Prop({ type: Boolean, default: true })
  newTools!: boolean;

  @Prop({ type: Boolean, default: true })
  deals!: boolean;

  @Prop({ type: Boolean, default: false })
  tutorials!: boolean;
}

const PreferencesSchema = SchemaFactory.createForClass(Preferences);

@Schema({ timestamps: true, versionKey: false })
export class Newsletter {
  @Prop({
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
  })
  email!: string;

  @Prop({ type: String, trim: true, default: null })
  name?: string | null;

  @Prop({ type: Types.ObjectId, ref: 'User', default: null })
  user?: Types.ObjectId | null;

  @Prop({ type: String, enum: newsletterStatuses, default: 'pending' })
  status!: NewsletterStatus;

  @Prop({ type: String, select: false })
  confirmToken?: string;

  @Prop({ type: Date, select: false })
  confirmTokenExpiry?: Date;

  @Prop({ type: Date, default: null })
  confirmedAt?: Date | null;

  @Prop({ type: Date, default: null })
  unsubscribedAt?: Date | null;

  @Prop({ type: String })
  unsubscribeToken?: string;

  @Prop({ type: PreferencesSchema, default: () => ({}) })
  preferences!: Preferences;

  @Prop({ type: String, enum: newsletterSources, default: 'homepage' })
  source!: NewsletterSource;

  @Prop({ type: Number, default: 0 })
  emailsSent!: number;

  @Prop({ type: Number, default: 0 })
  emailsOpened!: number;
}

export type NewsletterDocument = Newsletter & Document;

const NewsletterSchema = SchemaFactory.createForClass(Newsletter);

NewsletterSchema.index({ email: 'text', name: 'text', source: 'text' });

NewsletterSchema.plugin(mongooseAggregatePaginate);

export default NewsletterSchema;
