import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ versionKey: false })
export class RevokedToken {
  @Prop({ required: true, unique: true })
  token!: string;

  @Prop({ required: true, expires: 0 })
  expireAt!: Date;
}

const RevokedTokenSchema = SchemaFactory.createForClass(RevokedToken);

export type RevokedTokenDocument = RevokedToken & Document;

export default RevokedTokenSchema;
