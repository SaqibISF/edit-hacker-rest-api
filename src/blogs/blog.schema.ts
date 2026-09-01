import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import mongooseAggregatePaginate from 'mongoose-aggregate-paginate-v2';

export const blogCategories = [
  'review',
  'comparison',
  'tutorial',
  'news',
  'listicle',
  'guide',
] as const;
export type BlogCategory = (typeof blogCategories)[number];

export const blogStatuses = ['draft', 'published', 'archived'] as const;
export type BlogStatus = (typeof blogStatuses)[number];

@Schema({ timestamps: true, versionKey: false })
export class Blog {
  @Prop({
    type: String,
    required: [true, 'Title is required'],
    trim: true,
    maxLength: [200, 'Title max 200 chars'],
  })
  title!: string;

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
    required: true,
    trim: true,
    maxLength: [300, 'Excerpt max 300 chars'],
  })
  excerpt!: string;

  @Prop({ type: String, required: [true, 'Body content is required'] })
  body!: string;

  @Prop({ type: String })
  coverImage?: string;

  @Prop({ type: String })
  icon?: string;

  // Authorship
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  author!: Types.ObjectId;

  // Categorization
  @Prop({ type: String, enum: blogCategories, required: true })
  category!: BlogCategory;

  @Prop({ type: [{ type: String, lowercase: true, trim: true }], default: [] })
  tags!: string[];

  // Related tools mentioned
  @Prop({ type: [{ type: Types.ObjectId, ref: 'Tool' }], default: [] })
  relatedTools!: Types.ObjectId[];

  // Status & Publication
  @Prop({ type: String, enum: blogStatuses, default: 'draft' })
  status!: BlogStatus;

  @Prop({ type: Date })
  publishedAt?: Date;

  // Stats
  @Prop({ type: Number, default: 0, min: 0 })
  viewCount!: number;

  @Prop({ type: Number, default: 5, min: 1 })
  readTime!: number;

  @Prop({ type: Boolean, default: false })
  isFeatured!: boolean;

  // SEO
  @Prop({ type: String, trim: true })
  metaTitle?: string;

  @Prop({ type: String, trim: true })
  metaDescription?: string;

  @Prop({ type: String, trim: true })
  canonicalUrl?: string;
}

const BlogSchema = SchemaFactory.createForClass(Blog);

// Indexes
// BlogSchema.index({ slug: 1 });
BlogSchema.index({ status: 1, publishedAt: -1 });
BlogSchema.index({ tags: 1 });
BlogSchema.index({ relatedTools: 1 });
BlogSchema.index({
  title: 'text',
  slug: 'text',
  excerpt: 'text',
  tags: 'text',
});

// Pagination Plugin
BlogSchema.plugin(mongooseAggregatePaginate);

export type BlogDocument = Blog & Document;

export default BlogSchema;
