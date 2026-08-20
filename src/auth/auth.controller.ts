import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Patch,
  Post,
  Res,
  UsePipes,
} from '@nestjs/common';
import { EnvService } from '../env/env.service';
import { type Response } from 'express';
import { ResponseMessage } from '../decorators/response-message.decorator';
import { Payload, type PayloadData } from '../decorators/payload.decorator';
import { AuthService } from './auth.service';
import {
  ApiAdminLogin,
  ApiNormalUserLogin,
  ApiRequestAccountRecovery,
  ApiResendEmailVerification,
  ApiUserLogout,
  ApiUserSignup,
  ApiVerifyAccount,
  ApiRecoverUserAccount,
  ApiUpdatePassword,
  ApiForgotPassword,
  ApiResetPassword,
} from './auth.decorators';
import {
  loginSchema,
  type LoginDto,
  signupSchema,
  type SignupDto,
  updatePasswordSchema,
  resetPasswordSchema,
  type UpdatePasswordDto,
  type ResetPasswordDto,
  verificationSchema,
  type VerificationDto,
} from './auth.validation.schema';
import { ZodValidationPipe } from '../pipes/zod-validation/zod-validation.pipe';
import { ApiTags } from '@nestjs/swagger';
import { EmailPipe } from '../pipes/email/email.pipe';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly envService: EnvService,
  ) {}

  @ApiNormalUserLogin()
  @Post('login')
  @UsePipes(new ZodValidationPipe(loginSchema))
  @HttpCode(HttpStatus.OK)
  @ResponseMessage('User successfully logged in')
  async login(
    @Body() { email, password }: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const loginRes = await this.authService.loginUser({ email, password });

    if (!loginRes.user?.deletedAt) {
      res.cookie(this.envService.access_token_key, loginRes.access_token, {
        httpOnly: true,
        secure: true,
        sameSite: 'strict',
        maxAge: 1000 * 60 * 60 * 24, // 1 day
      });
    }
    return loginRes;
  }

  @ApiAdminLogin()
  @Post('login-as-admin')
  @UsePipes(new ZodValidationPipe(loginSchema))
  @HttpCode(HttpStatus.OK)
  @ResponseMessage('Admin successfully logged in')
  async loginAsAdmin(
    @Body() { email, password }: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const loginRes = await this.authService.loginUser({
      email,
      password,
      asAdmin: true,
    });

    if (!loginRes.user?.deletedAt) {
      res.cookie(this.envService.access_token_key, loginRes.access_token, {
        httpOnly: true,
        secure: true,
        sameSite: 'strict',
        maxAge: 1000 * 60 * 60 * 24, // 1 day
      });
    }

    return loginRes;
  }

  @ApiUserLogout()
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ResponseMessage('User successfully logged out')
  async logout(
    @Res({ passthrough: true }) res: Response,
    @Payload() { token, exp }: PayloadData,
  ) {
    await this.authService.logoutUser(token, exp);

    res.clearCookie(this.envService.access_token_key, {
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
    });

    return {};
  }

  @ApiUserSignup()
  @Post('signup')
  @UsePipes(new ZodValidationPipe(signupSchema))
  @HttpCode(HttpStatus.CREATED)
  @ResponseMessage('Please verify your email to activate your account')
  async signup(@Body() signupDto: SignupDto) {
    await this.authService.signupUser(signupDto);
    return {};
  }

  @ApiResendEmailVerification()
  @Post('resend-account-verification-email')
  @HttpCode(HttpStatus.OK)
  @ResponseMessage('Account verification email resent successfully')
  async resendAccountVerificationEmail(
    @Body('email', EmailPipe) email: string,
  ) {
    await this.authService.resendAccountVerificationEmail(email);
    return {};
  }

  @ApiVerifyAccount()
  @Patch('verify-account')
  @UsePipes(new ZodValidationPipe(verificationSchema))
  @HttpCode(HttpStatus.OK)
  @ResponseMessage('Account successfully verified')
  async verifyAccount(@Body() verificationDto: VerificationDto) {
    await this.authService.verifyAccount(verificationDto);
    return {};
  }

  @ApiRequestAccountRecovery()
  @Post('request-account-recovery')
  @HttpCode(HttpStatus.OK)
  @ResponseMessage('Request for account recovery successfully submitted')
  async requestAccountRecovery(@Body('email', EmailPipe) email: string) {
    await this.authService.requestAccountRecovery(email);
    return {};
  }

  @ApiRecoverUserAccount()
  @Patch('recover-user-account')
  @UsePipes(new ZodValidationPipe(verificationSchema))
  @HttpCode(HttpStatus.OK)
  @ResponseMessage('User account successfully recovered')
  async recoverUserAccount(@Body() verificationDto: VerificationDto) {
    await this.authService.recoverUserAccount(verificationDto);
    return {};
  }

  @ApiUpdatePassword()
  @Patch('update-password')
  @UsePipes(new ZodValidationPipe(updatePasswordSchema))
  @HttpCode(HttpStatus.OK)
  @ResponseMessage('Password successfully updated')
  async updatePassword(
    @Payload('_id') userId: string,
    @Body() { oldPassword, newPassword }: UpdatePasswordDto,
  ) {
    await this.authService.updatePassword(userId, oldPassword, newPassword);
    return {};
  }

  @ApiForgotPassword()
  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  @ResponseMessage(
    'Password reset request successfully submitted, please check your email',
  )
  async forgotPassword(@Body('email', EmailPipe) email: string) {
    await this.authService.forgotPassword(email);
    return {};
  }

  @ApiResetPassword()
  @Patch('reset-password')
  @UsePipes(new ZodValidationPipe(resetPasswordSchema))
  @HttpCode(HttpStatus.OK)
  @ResponseMessage(
    'Password successfully reset, you can now login with your new password',
  )
  async resetPassword(
    @Body()
    resetPasswordDto: ResetPasswordDto,
  ) {
    await this.authService.resetPassword(resetPasswordDto);
    return {};
  }
}
