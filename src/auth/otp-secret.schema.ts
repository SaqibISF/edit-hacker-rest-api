import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ versionKey: false })
export class OtpSecret {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId!: Types.ObjectId;

  @Prop({ type: Number, required: true })
  otp!: number;

  @Prop({ type: String, required: true })
  secret!: string;

  @Prop({
    type: Date,
    default: () => new Date(Date.now() + 5 * 60 * 1000), // Default is 5 minutes from now
    expires: 0,
  })
  expireAt!: Date;
}

const OtpSecretSchema = SchemaFactory.createForClass(OtpSecret);

export type OtpSecretDocument = OtpSecret & Document;

export default OtpSecretSchema;
