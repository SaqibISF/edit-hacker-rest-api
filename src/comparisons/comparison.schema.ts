import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import mongooseAggregatePaginate from 'mongoose-aggregate-paginate-v2';

export const comparisonTypes = ['editorial', 'user'] as const;
export type ComparisonType = (typeof comparisonTypes)[number];

@Schema({ timestamps: true, versionKey: false })
export class Comparison {
  @Prop({ type: String, trim: true, maxLength: 200, required: true })
  title!: string;

  @Prop({
    type: String,
    unique: true,
    sparse: true,
    lowercase: true,
    trim: true,
    required: true,
  })
  slug!: string;

  @Prop({
    type: [{ type: Types.ObjectId, ref: 'Tool' }],
    validate: {
      validator: (arr: Types.ObjectId[]) =>
        arr && arr.length >= 2 && arr.length <= 5,
      message: 'A comparison must have between 2 and 5 tools',
    },
    default: [],
  })
  tools!: Types.ObjectId[];

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  createdBy!: Types.ObjectId;

  @Prop({ type: String, enum: comparisonTypes, default: 'user' })
  type!: ComparisonType;

  @Prop({ type: Boolean, default: false })
  isPublished!: boolean;

  @Prop({ type: Number, default: 0 })
  viewCount!: number;

  @Prop({ type: Types.ObjectId, ref: 'Tool', default: null })
  winner?: Types.ObjectId | null;

  @Prop({ type: String, trim: true, maxLength: 500 })
  summary?: string;
}

const ComparisonSchema = SchemaFactory.createForClass(Comparison);

ComparisonSchema.plugin(mongooseAggregatePaginate);

ComparisonSchema.index({ title: 'text', slug: 'text', summary: 'text' });
ComparisonSchema.index({ tools: 1, type: 1, isPublished: 1 });

export type ComparisonDocument = Comparison & Document;

export default ComparisonSchema;
