import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongooseAggregatePaginate from 'mongoose-aggregate-paginate-v2';

@Schema({ timestamps: true, versionKey: false })
export class Category {
  @Prop({
    type: String,
    required: [true, 'Category name is required'],
    unique: [true, 'The category name already exists'],
    trim: true,
  })
  name!: string;

  @Prop({
    type: String,
    required: [true, 'The category slug is required'],
    unique: [true, 'The category slug already exists'],
    lowercase: true,
    trim: true,
  })
  slug!: string;

  @Prop({ type: String })
  icon?: string;

  @Prop({
    type: String,
    trim: true,
    maxLength: [300, 'Description max 300 chars'],
  })
  description?: string;

  @Prop({ type: String })
  coverImage?: string;

  @Prop({ type: String, trim: true })
  metaTitle?: string;

  @Prop({ type: String, trim: true })
  metaDescription?: string;

  @Prop({ type: Number, default: 0 })
  toolCount!: number;

  @Prop({ type: Boolean, default: false })
  isFeatured!: boolean;

  @Prop({ type: Number, default: 0 })
  order!: number;

  @Prop({ type: Boolean, default: true })
  isActive!: boolean;
}

const CategorySchema = SchemaFactory.createForClass(Category);

CategorySchema.index({ name: 'text', slug: 'text', description: 'text' });

CategorySchema.plugin(mongooseAggregatePaginate);

export type CategoryDocument = Category & Document;

export default CategorySchema;
