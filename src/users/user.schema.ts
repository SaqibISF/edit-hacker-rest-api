import bcrypt from 'bcrypt';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Model } from 'mongoose';
import slugify from 'slugify';
import mongooseAggregatePaginate from 'mongoose-aggregate-paginate-v2';

// TTL for soft-deleted users (90 days)
// export const DELETE_USER_TTL = 90 * 24 * 60 * 60;
export const DELETE_USER_TTL = '90d';

export enum UserRole {
  ADMIN = 'admin',
  USER = 'user',
}

@Schema({ timestamps: true, versionKey: false })
export class User {
  @Prop({ required: true })
  name!: string;

  @Prop({ unique: true })
  slug!: string;

  @Prop({
    required: true,
    unique: [true, 'This email is already taken'],
    trim: true,
  })
  email!: string;

  @Prop({ select: false })
  password?: string;

  @Prop({ required: true })
  role!: UserRole;

  @Prop()
  avatarUrl?: string;

  @Prop()
  mobile?: string;

  @Prop()
  emailVerifiedAt?: Date;

  @Prop()
  passwordResetAt?: Date;

  @Prop()
  lastLoginAt?: Date;

  @Prop()
  bannedAt?: Date;

  @Prop()
  banReason?: string;

  @Prop({ type: Date, expires: DELETE_USER_TTL })
  deletedAt?: Date;
}

const UserSchema = SchemaFactory.createForClass(User);

UserSchema.plugin(mongooseAggregatePaginate);

UserSchema.pre('save', async function () {
  if (this.isModified('password') && this.password) {
    this.password = await bcrypt.hash(this.password, 10);
    this.passwordResetAt = new Date();
  }

  // 2. Slug Generation Logic
  if (this.isModified('name')) {
    const generatedSlug = slugify(this.name, { lower: true, strict: true });

    // Check if the slug already exists in the database
    const userModel = this.constructor as Model<UserDocument>;
    let slugExists = await userModel.findOne({ slug: generatedSlug });

    let counter = 1;
    let finalSlug = generatedSlug;

    // If it exists, keep adding a number until we find a unique one
    while (slugExists) {
      finalSlug = `${generatedSlug}-${counter}`;
      slugExists = await userModel.findOne({ slug: finalSlug });
      counter++;
    }

    this.slug = finalSlug;
  }
});

UserSchema.methods.isPasswordCorrect = async function (password: string) {
  const hash = (this as User).password;
  return hash ? await bcrypt.compare(password, hash) : false;
};

export type UserDocument = User & {
  isPasswordCorrect: (password: string) => Promise<boolean>;
  createdAt: Date;
  updatedAt: Date;
} & Document;

export default UserSchema;
