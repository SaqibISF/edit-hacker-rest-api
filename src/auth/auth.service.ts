import {
  ConflictException,
  HttpStatus,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { Connection, Model, Types } from 'mongoose';
import { User, UserDocument, UserRole } from '../users/user.schema';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import { JwtService } from '@nestjs/jwt';
import { RevokedToken, RevokedTokenDocument } from './revoked-tokens.schema';
import { EnvService } from '../env/env.service';
import { ResendService } from 'nestjs-resend';
import { OtpSecret, OtpSecretDocument } from './otp-secret.schema';
import crypto from 'crypto';
import { ForgotPasswordEmail } from '../emails/ForgotPasswordEmail';
import { VerifyAccountEmail } from '../emails/VerifyAccountEmail';
import { type SignupDto } from '../zod-schemas/signup.schema';
import { type LoginDto } from '../zod-schemas/login.schema';
import { type VerificationDto } from '../zod-schemas/verification.schema';
import { type ResetPasswordDto } from '../zod-schemas/password.schema';
import { RequestRecoverAccountEmail } from 'src/emails/RequestRecoverAccountEmail';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(RevokedToken.name)
    private readonly revokedTokenModel: Model<RevokedTokenDocument>,
    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,
    @InjectModel(OtpSecret.name)
    private readonly otpSecretModel: Model<OtpSecretDocument>,
    @InjectConnection() private readonly connection: Connection,
    private readonly jwtService: JwtService,
    private readonly envService: EnvService,
    private readonly resendService: ResendService,
  ) {}

  private async sendAccountVerificationEmail({
    userId,
    name,
    email,
  }: {
    userId: Types.ObjectId;
    name: string;
    email: string;
  }) {
    const secret = crypto.randomBytes(32).toString('hex');
    const otp = crypto.randomInt(100000, 999999);

    this.otpSecretModel
      .findOneAndUpdate(
        { userId },
        {
          otp,
          secret,
          expireAt: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000),
        },
        { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true },
      )
      .lean()
      .exec()
      .catch((error) =>
        console.error(`OTP Update Failed for User ${email}`, error),
      );

    const verifyAccountLink = `${this.envService.verify_account_url}?secret=${secret}&email=${email}`;

    const { error } = await this.resendService.send({
      from: this.envService.resend_email_from,
      to: email,
      subject: 'Verify Account',
      react: VerifyAccountEmail({ name, verifyAccountLink, otp }),
    });

    if (error) {
      const statusCode =
        (error as { statusCode?: number }).statusCode ||
        HttpStatus.INTERNAL_SERVER_ERROR;

      console.error(
        `${statusCode} - Failed to sent verification email to ${email} - ${error.message}`,
      );
    }
  }

  private async sendForgotPasswordEmail(
    userId: Types.ObjectId,
    name: string,
    email: string,
  ) {
    const secret = crypto.randomBytes(32).toString('hex');
    const otp = crypto.randomInt(100000, 999999);

    this.otpSecretModel
      .findOneAndUpdate(
        { userId },
        { otp, secret },
        { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true },
      )
      .lean()
      .exec()
      .catch((error) =>
        console.error(
          `Failed to generate OTP and link for password reset for User ${email}`,
          error,
        ),
      );

    const resetLink = `${this.envService.reset_password_url}?token=${secret}&email=${email}`;

    const { error } = await this.resendService.send({
      from: this.envService.resend_email_from,
      to: email,
      subject: 'Reset Password',
      react: ForgotPasswordEmail({ name, resetLink, otp }),
    });

    if (error) {
      const statusCode =
        (error as { statusCode?: number }).statusCode ||
        HttpStatus.INTERNAL_SERVER_ERROR;

      console.error(
        `${statusCode} - Failed to sent forgot password email to ${email} - ${error.message}`,
      );
    }
  }

  private async sendAccountRecoverRequestEmail({
    userId,
    name,
    email,
  }: {
    userId: Types.ObjectId;
    name: string;
    email: string;
  }) {
    const secret = crypto.randomBytes(32).toString('hex');
    const otp = crypto.randomInt(100000, 999999);

    this.otpSecretModel
      .findOneAndUpdate(
        { userId },
        {
          otp,
          secret,
          expireAt: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000),
        },
        { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true },
      )
      .lean()
      .exec()
      .catch((error) =>
        console.error(
          `Failed to save Account Recover Request OTP and Link for ${email}`,
          error,
        ),
      );

    const accountRecoverLink = `${this.envService.recover_account_url}?secret=${secret}&email=${email}`;

    const { error } = await this.resendService.send({
      from: this.envService.resend_email_from,
      to: email,
      subject: 'Request to Recover Account',
      react: RequestRecoverAccountEmail({ name, accountRecoverLink, otp }),
    });

    if (error) {
      const statusCode =
        (error as { statusCode?: number }).statusCode ||
        HttpStatus.INTERNAL_SERVER_ERROR;

      console.error(
        `${statusCode} - Failed to sent recover account request email to ${email} - ${error.message}`,
      );
    }
  }

  async loginUser({
    email,
    password,
    asAdmin = false,
  }: LoginDto & { asAdmin?: boolean }) {
    const user = await this.userModel
      .findOne({ email })
      .select('+password')
      .exec();

    if (!user) {
      throw new NotFoundException('This email is not registered');
    }

    const isPasswordCorrect = await user.isPasswordCorrect(password);

    if (!isPasswordCorrect) {
      throw new UnauthorizedException('Invalid Credentials');
    }

    if (!user.emailVerifiedAt) {
      throw new UnauthorizedException(
        'Unauthorized, email is not verified yet. Please verify your email before logging in.',
      );
    }

    if (asAdmin && user.role !== UserRole.ADMIN) {
      throw new UnauthorizedException('Unauthorized, you are not an admin');
    } else if (!asAdmin && user.role !== UserRole.USER) {
      throw new UnauthorizedException('Unauthorized, you are not a user');
    }

    if (user.bannedAt) {
      throw new UnauthorizedException(
        'Unauthorized, your account has been banned',
      );
    }

    if (user.deletedAt) {
      return {
        message:
          'Your account has been deleted. You can restore it by logging in within the next 90 days. After that, your account will be permanently removed.',
        user: {
          name: user.name,
          email: user.email,
          isDeleted: true,
          deletedAt: user.deletedAt,
        },
      };
    }

    const access_token = await this.jwtService.signAsync({
      _id: user._id,
      email: user.email,
      role: user.role,
      name: user.name,
    });

    const loggedInUser = await this.userModel
      .findByIdAndUpdate(
        user._id,
        { lastLoginAt: new Date() },
        { returnDocument: 'after' },
      )
      .exec();

    return { access_token, access_token_type: 'Bearer', user: loggedInUser };
  }

  async logoutUser(token: string, exp: number) {
    await this.revokedTokenModel.create({ token, expireAt: exp * 1000 });
  }

  async signupUser({ name, email, password }: SignupDto) {
    const existedUser = await this.userModel.exists({ email }).lean().exec();

    if (existedUser)
      throw new ConflictException('This email has been already taken');

    const user = await this.userModel.create({
      name,
      email,
      password,
      role: UserRole.USER,
    });

    delete user.password;

    void this.sendAccountVerificationEmail({ userId: user._id, name, email });
  }

  async resendAccountVerificationEmail(email: string) {
    const user = await this.userModel
      .findOne({ email })
      .select('_id name email emailVerifiedAt')
      .lean()
      .exec();

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.emailVerifiedAt) {
      throw new ConflictException('Account is already verified');
    }

    void this.sendAccountVerificationEmail({
      userId: user._id,
      name: user.name,
      email: user.email,
    });
  }

  async verifyAccount({ token, otp, email }: VerificationDto) {
    const session = await this.connection.startSession();

    try {
      session.startTransaction();

      const otpSecret = await this.otpSecretModel
        .findOneAndDelete({ $or: [{ secret: token }, { otp }] }, { session })
        .lean()
        .exec();

      if (!otpSecret) {
        throw new UnauthorizedException(
          'Unauthorized, token or OTP is invalid or expired',
        );
      }

      const user = await this.userModel
        .findById(otpSecret.userId)
        .select('email emailVerifiedAt')
        .exec();

      if (!user) {
        throw new NotFoundException('User not found for verification');
      }

      if (user.email !== email) {
        throw new UnauthorizedException(
          'Email does not match the token or OTP provided',
        );
      }

      if (user.emailVerifiedAt) {
        throw new UnauthorizedException('Email is already verified');
      }

      user.emailVerifiedAt = new Date();

      await user.save({ session });

      await session.commitTransaction();
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      await session.endSession();
    }
  }

  async requestAccountRecovery(email: string) {
    const user = await this.userModel
      .findOne({ email })
      .select('_id name email deletedAt')
      .lean()
      .exec();

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (!user.deletedAt) {
      throw new ConflictException('Your account has not been deleted yet');
    }

    void this.sendAccountRecoverRequestEmail({
      userId: user._id,
      name: user.name,
      email: user.email,
    });
  }

  async recoverUserAccount({ token, otp, email }: VerificationDto) {
    const session = await this.connection.startSession();

    try {
      session.startTransaction();

      const otpSecret = await this.otpSecretModel
        .findOneAndDelete({ $or: [{ secret: token }, { otp }] }, { session })
        .lean()
        .exec();

      if (!otpSecret) {
        throw new UnauthorizedException(
          'Unauthorized, token or OTP is invalid or expired',
        );
      }

      const user = await this.userModel
        .findOneAndUpdate(
          { email },
          { $unset: { deletedAt: 1 } },
          { returnDocument: 'before', session },
        )
        .select('email deletedAt')
        .lean()
        .exec();

      if (!user) {
        throw new NotFoundException('User not found for restoration');
      }

      if (user.email !== email) {
        throw new UnauthorizedException(
          'Email does not match the token or OTP provided',
        );
      }

      if (!user.deletedAt) {
        throw new ConflictException('This user was not deleted');
      }

      await session.commitTransaction();
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      await session.endSession();
    }
  }

  async updatePassword(
    userId: string,
    oldPassword: string,
    newPassword: string,
  ) {
    const user = await this.userModel
      .findById(userId)
      .select('+password')
      .exec();

    if (!user) {
      throw new NotFoundException('User not founded');
    }

    const isPasswordCorrect = await user.isPasswordCorrect(oldPassword);

    if (!isPasswordCorrect) {
      throw new UnauthorizedException('You entered wrong password');
    }

    user.password = newPassword;

    await user.save();
  }

  async forgotPassword(email: string) {
    const user = await this.userModel
      .findOne({ email })
      .select('_id name emailVerifiedAt')
      .lean()
      .exec();

    if (!user) {
      throw new NotFoundException('User not founded');
    }

    if (!user.emailVerifiedAt) {
      throw new UnauthorizedException(
        'Unauthorized, email is not verified yet. Please verify your email before requesting password reset.',
      );
    }

    void this.sendForgotPasswordEmail(user._id, user.name, email);
  }

  async resetPassword({
    token,
    otp,
    email,
    newPassword: password,
  }: ResetPasswordDto) {
    const session = await this.connection.startSession();

    try {
      session.startTransaction();

      const otpSecret = await this.otpSecretModel
        .findOneAndDelete({ $or: [{ secret: token }, { otp }] }, { session })
        .lean()
        .exec();

      if (!otpSecret) {
        throw new UnauthorizedException(
          'Unauthorized, token or OTP is invalid or expired',
        );
      }

      const user = await this.userModel
        .findById(otpSecret.userId)
        .select('+password')
        .exec();

      if (!user) {
        throw new InternalServerErrorException(
          'User not found for password reset',
        );
      }

      if (user.email !== email) {
        throw new UnauthorizedException(
          'Email does not match the token or OTP provided',
        );
      }

      user.password = password;

      await user.save({ session });

      await session.commitTransaction();
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      await session.endSession();
    }
  }
}
