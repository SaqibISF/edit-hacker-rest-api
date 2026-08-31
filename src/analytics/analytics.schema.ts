import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import mongooseAggregatePaginate from 'mongoose-aggregate-paginate-v2';

@Schema({ _id: false })
export class DeviceBreakdown {
  @Prop({ type: Number, default: 0, min: 0 })
  desktop!: number;

  @Prop({ type: Number, default: 0, min: 0 })
  mobile!: number;

  @Prop({ type: Number, default: 0, min: 0 })
  tablet!: number;
}

const DeviceBreakdownSchema = SchemaFactory.createForClass(DeviceBreakdown);

@Schema({ timestamps: true, versionKey: false })
export class Analytics {
  @Prop({ type: Types.ObjectId, ref: 'Tool', required: true })
  tool!: Types.ObjectId;

  @Prop({ type: Date, required: true })
  date!: Date;

  @Prop({ type: Number, default: 0, min: 0 })
  views!: number;

  @Prop({ type: Number, default: 0, min: 0 })
  clicks!: number;

  @Prop({ type: Number, default: 0, min: 0 })
  saves!: number;

  @Prop({ type: Number, default: 0, min: 0 })
  searchImpressions!: number;

  @Prop({
    type: DeviceBreakdownSchema,
    default: () => ({ desktop: 0, mobile: 0, tablet: 0 }),
  })
  devices!: DeviceBreakdown;

  @Prop({
    type: Map,
    of: Number,
    default: () => new Map(),
  })
  referrers!: Map<string, number>;
}

const AnalyticsSchema = SchemaFactory.createForClass(Analytics);

// Indexes
AnalyticsSchema.index({ tool: 1, date: 1 }, { unique: true });
AnalyticsSchema.index({ date: -1 });
AnalyticsSchema.index({ tool: 1, date: -1 });

// Pagination Plugin
AnalyticsSchema.plugin(mongooseAggregatePaginate);

export type AnalyticsDocument = Analytics & Document;

export default AnalyticsSchema;
