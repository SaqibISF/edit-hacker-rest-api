import { applyDecorators, HttpStatus } from '@nestjs/common';
import { ApiOperation, ApiBody, ApiResponse } from '@nestjs/swagger';

const ADMIN_EMAIL_ADDRESS = 'admin@gmail.com';
const USER_EMAIL_ADDRESS = 'user@example.com';
const PASSWORD = 'Qwer!234';
const NEW_PASSWORD = 'Asdf!567';

function ApiUserLogin(
  emailAddress: string,
  summary: string,
  description: string,
) {
  return applyDecorators(
    ApiOperation({ summary, description }),
    ApiBody({
      schema: {
        type: 'object',
        properties: {
          email: { type: 'string' },
          password: { type: 'string' },
        },
        example: {
          email: emailAddress,
          password: PASSWORD,
        },
      },
    }),
    ApiResponse({
      status: HttpStatus.OK,
      description: 'User login api response',
      content: {
        'application/json': {
          schema: {
            type: 'object',
            properties: {
              success: { type: 'true' },
              message: { type: 'string' },
              access_token: { type: 'string' },
              access_token_type: { type: 'string' },
              user: {
                type: 'object',
                properties: {
                  _id: { type: 'string' },
                  name: { type: 'string' },
                  email: { type: 'string' },
                  role: { type: 'string' },
                  createdAt: { type: 'string' },
                  updatedAt: { type: 'string' },
                  passwordResetAt: { type: 'string' },
                  slug: { type: 'string' },
                  emailVerifiedAt: { type: 'string' },
                  lastLoginAt: { type: 'string' },
                  isDeleted: { type: 'boolean' },
                  deletedAt: { type: 'string' },
                },
              },
            },
          },
          examples: {
            LoginSuccessful: {
              value: {
                success: true,
                message: 'User successfully logged in',
                access_token:
                  'eyJhbGciOiJIUzM4NCIsInR5cCI6IkpXVCJ9.eyJfaWQiOiI2YTc0ODVjZjRhNjBjNWE3YmI3YzQ4MjQiLCJlbWFpbCI6InNhcWliMkBnbWFpbC5jb20iLCJyb2xlIjoidXNlciIsIm5hbWUiOiJTYXFpYiIsImlhdCI6MTc4NjAyNDY3NCwiZXhwIjoxNzg2MTExMDc0fQ.8ojBlsbdTL0EdVNMaArFAIIcfrVtJu-kRLWG0LANmbq5hNYA19yghzkpkNvPBzaM',
                access_token_type: 'Bearer',
                user: {
                  _id: '6a7485cf4a60c5a7bb7c4824',
                  name: 'Saqib',
                  email: emailAddress,
                  role: 'user',
                  createdAt: '2026-08-06T13:02:07.329Z',
                  updatedAt: '2026-08-06T13:57:54.925Z',
                  passwordResetAt: '2026-08-06T13:02:07.421Z',
                  slug: 'saqib',
                  emailVerifiedAt: '2026-08-06T13:55:17.672Z',
                  lastLoginAt: '2026-08-06T13:57:54.925Z',
                },
              },
            },
            DeletedUserAccount: {
              value: {
                success: true,
                message:
                  'Your account has been deleted. You can restore it by logging in within the next 90 days. After that, your account will be permanently removed.',
                user: {
                  name: 'Saqib',
                  email: emailAddress,
                  isDeleted: true,
                  deletedAt: '2026-08-07T02:02:01.702Z',
                },
              },
            },
          },
        },
      },
    }),
    ApiResponse({
      status: HttpStatus.NOT_FOUND,
      description: 'This email is not registered',
      content: {
        'application/json': {
          schema: {
            type: 'object',
            properties: {
              success: { type: 'false' },
              message: { type: 'string' },
              statusCode: { type: 'number' },
              timestamp: { type: 'string' },
            },
            example: {
              success: false,
              message: 'This email is not registered',
              statusCode: HttpStatus.NOT_FOUND,
              timestamp: '2026-08-11T03:24:44.925Z',
            },
          },
        },
      },
    }),
    ApiResponse({
      status: HttpStatus.UNAUTHORIZED,
      description: 'Invalid credentials',
      content: {
        'application/json': {
          schema: {
            type: 'object',
            properties: {
              success: { type: 'false' },
              message: { type: 'string' },
              statusCode: { type: 'number' },
              timestamp: { type: 'string' },
            },
          },
          examples: {
            'Email Not Verified': {
              value: {
                success: false,
                message:
                  'Unauthorized, email is not verified yet. Please verify your email before logging in.',
                statusCode: HttpStatus.UNAUTHORIZED,
                timestamp: '2026-08-06T13:03:52.248Z',
              },
            },
            'Invalid Credentials': {
              value: {
                success: false,
                message: 'Invalid credentials',
                statusCode: HttpStatus.UNAUTHORIZED,
                timestamp: '2026-08-11T03:24:44.925Z',
              },
            },
          },
        },
      },
    }),
  );
}

export function ApiNormalUserLogin() {
  return ApiUserLogin(
    USER_EMAIL_ADDRESS,
    'Normal user login',
    'Login as a normal user',
  );
}

export function ApiAdminLogin() {
  return ApiUserLogin(
    ADMIN_EMAIL_ADDRESS,
    'Admin user login',
    'Login as an admin user',
  );
}

export function ApiUserLogout() {
  return applyDecorators(
    ApiOperation({ summary: 'User logout' }),
    ApiResponse({
      status: HttpStatus.OK,
      description: 'User successfully logged out',
      content: {
        'application/json': {
          schema: {
            type: 'object',
            properties: {
              success: { type: 'true' },
              message: { type: 'string' },
            },
            example: {
              success: true,
              message: 'User successfully logged out',
            },
          },
        },
      },
    }),
    ApiResponse({
      status: HttpStatus.UNAUTHORIZED,
      description: 'Unauthorized',
      content: {
        'application/json': {
          schema: {
            type: 'object',
            properties: {
              success: { type: 'false' },
              message: { type: 'string' },
              statusCode: { type: 'number' },
              timestamp: { type: 'string' },
            },
            example: {
              success: false,
              message: 'Unauthorized, invalid token: token not found',
              statusCode: HttpStatus.UNAUTHORIZED,
              timestamp: '2026-08-11T04:22:27.746Z',
            },
          },
        },
      },
    }),
  );
}

export function ApiUserSignup() {
  return applyDecorators(
    ApiOperation({ summary: 'User signup' }),
    ApiBody({
      schema: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          email: { type: 'string' },
          password: { type: 'string' },
        },
        example: {
          name: 'Saqib',
          email: USER_EMAIL_ADDRESS,
          password: 'Qwer!234',
        },
      },
    }),
    ApiResponse({
      status: HttpStatus.CREATED,
      description: 'Please verify your email to activate your account',
      content: {
        'application/json': {
          schema: {
            type: 'object',
            properties: {
              success: { type: 'true' },
              message: { type: 'string' },
            },
            example: {
              success: true,
              message: 'Please verify your email to activate your account',
            },
          },
        },
      },
    }),
    ApiResponse({
      status: HttpStatus.CONFLICT,
      description: 'This email has been already taken',
      content: {
        'application/json': {
          schema: {
            type: 'object',
            properties: {
              success: { type: 'false' },
              message: { type: 'string' },
              statusCode: { type: 'number' },
              timestamp: { type: 'string' },
            },
            example: {
              success: false,
              message: 'This email has been already taken',
              statusCode: HttpStatus.CONFLICT,
              timestamp: '2026-08-11T04:22:27.746Z',
            },
          },
        },
      },
    }),
  );
}

export function ApiResendEmailVerification() {
  return applyDecorators(
    ApiOperation({ summary: 'Resend account verification email' }),
    ApiBody({
      schema: {
        type: 'object',
        properties: { email: { type: 'string' } },
        example: { email: USER_EMAIL_ADDRESS },
      },
    }),
    ApiResponse({
      status: HttpStatus.OK,
      description: 'Account verification email resent successfully',
      content: {
        'application/json': {
          schema: {
            type: 'object',
            properties: {
              success: { type: 'true' },
              message: { type: 'string' },
            },
            example: {
              success: true,
              message: 'Account verification email resent successfully',
            },
          },
        },
      },
    }),
    ApiResponse({
      status: HttpStatus.NOT_FOUND,
      description: 'User not found',
      content: {
        'application/json': {
          schema: {
            type: 'object',
            properties: {
              success: { type: 'false' },
              message: { type: 'string' },
              statusCode: { type: 'number' },
              timestamp: { type: 'string' },
            },
            example: {
              success: false,
              message: 'User not found',
              statusCode: HttpStatus.NOT_FOUND,
              timestamp: '2026-08-11T04:22:27.746Z',
            },
          },
        },
      },
    }),
  );
}

export function ApiVerifyAccount() {
  return applyDecorators(
    ApiOperation({ summary: 'Verify account' }),
    ApiBody({
      schema: {
        oneOf: [
          {
            type: 'object',
            properties: {
              email: { type: 'string' },
              token: { type: 'string' },
            },
            required: ['email', 'token'],
          },
          {
            type: 'object',
            properties: {
              email: { type: 'string' },
              otp: { type: 'number' },
            },
            required: ['email', 'otp'],
          },
        ],
      },
      examples: {
        'With Token': {
          value: {
            email: USER_EMAIL_ADDRESS,
            token:
              'abddf1ea3bbee74b183df5b6da1a925b3f23a29e2e370e59272370893339fe44',
          },
        },
        'With OTP': {
          value: { email: USER_EMAIL_ADDRESS, otp: 123456 },
        },
      },
    }),
    ApiResponse({
      status: HttpStatus.OK,
      description: 'Account verified successfully',
      content: {
        'application/json': {
          schema: {
            type: 'object',
            properties: {
              success: { type: 'true' },
              message: { type: 'string' },
            },
            example: {
              success: true,
              message: 'Account verified successfully',
            },
          },
        },
      },
    }),
    ApiResponse({
      status: HttpStatus.UNAUTHORIZED,
      description: 'Invalid verification token or otp',
      content: {
        'application/json': {
          schema: {
            type: 'object',
            properties: {
              success: { type: 'false' },
              message: { type: 'string' },
              statusCode: { type: 'number' },
              timestamp: { type: 'string' },
            },
            example: {
              success: false,
              message: 'Unauthorized, token or OTP is invalid or expired',
              statusCode: HttpStatus.UNAUTHORIZED,
              timestamp: '2026-08-11T04:22:27.746Z',
            },
          },
        },
      },
    }),
    ApiResponse({
      status: HttpStatus.CONFLICT,
      description: 'Account already verified',
      content: {
        'application/json': {
          schema: {
            type: 'object',
            properties: {
              success: { type: 'false' },
              message: { type: 'string' },
              statusCode: { type: 'number' },
              timestamp: { type: 'string' },
            },
            example: {
              success: false,
              message: 'Account is already verified',
              statusCode: HttpStatus.CONFLICT,
              timestamp: '2026-08-11T04:22:27.746Z',
            },
          },
        },
      },
    }),
  );
}

export function ApiRequestAccountRecovery() {
  return applyDecorators(
    ApiOperation({ summary: 'Request account recovery' }),
    ApiBody({
      schema: {
        type: 'object',
        properties: { email: { type: 'string' } },
        example: { email: USER_EMAIL_ADDRESS },
      },
    }),
    ApiResponse({
      status: HttpStatus.OK,
      description: 'Request for account recovery successfully submitted',
      content: {
        'application/json': {
          schema: {
            type: 'object',
            properties: {
              success: { type: 'true' },
              message: { type: 'string' },
            },
            example: {
              success: true,
              message: 'Request for account recovery successfully submitted',
            },
          },
        },
      },
    }),
    ApiResponse({
      status: HttpStatus.NOT_FOUND,
      description: 'User not found',
      content: {
        'application/json': {
          schema: {
            type: 'object',
            properties: {
              success: { type: 'false' },
              message: { type: 'string' },
              statusCode: { type: 'number' },
              timestamp: { type: 'string' },
            },
            example: {
              success: false,
              message: 'User not found',
              statusCode: HttpStatus.NOT_FOUND,
              timestamp: '2026-08-11T04:22:27.746Z',
            },
          },
        },
      },
    }),
  );
}

export function ApiRecoverUserAccount() {
  return applyDecorators(
    ApiOperation({ summary: 'Recover user account' }),
    ApiBody({
      schema: {
        oneOf: [
          {
            type: 'object',
            properties: {
              email: { type: 'string' },
              token: { type: 'string' },
            },
            required: ['email', 'token'],
          },
          {
            type: 'object',
            properties: {
              email: { type: 'string' },
              otp: { type: 'number' },
            },
            required: ['email', 'otp'],
          },
        ],
      },
      examples: {
        'With Token': {
          value: {
            email: USER_EMAIL_ADDRESS,
            token:
              'abddf1ea3bbee74b183df5b6da1a925b3f23a29e2e370e59272370893339fe44',
          },
        },
        'With OTP': {
          value: { email: USER_EMAIL_ADDRESS, otp: 123456 },
        },
      },
    }),
    ApiResponse({
      status: HttpStatus.OK,
      description: 'User account successfully recovered',
      content: {
        'application/json': {
          schema: {
            type: 'object',
            properties: {
              success: { type: 'true' },
              message: { type: 'string' },
            },
            example: {
              success: true,
              message: 'User account successfully recovered',
            },
          },
        },
      },
    }),
    ApiResponse({
      status: HttpStatus.UNAUTHORIZED,
      description: 'Invalid verification token or otp',
      content: {
        'application/json': {
          schema: {
            type: 'object',
            properties: {
              success: { type: 'false' },
              message: { type: 'string' },
              statusCode: { type: 'number' },
              timestamp: { type: 'string' },
            },
            example: {
              success: false,
              message: 'Unauthorized, token or OTP is invalid or expired',
              statusCode: HttpStatus.UNAUTHORIZED,
              timestamp: '2026-08-11T04:22:27.746Z',
            },
          },
        },
      },
    }),
    ApiResponse({
      status: HttpStatus.CONFLICT,
      description: 'Your account has not been deleted yet',
      content: {
        'application/json': {
          schema: {
            type: 'object',
            properties: {
              success: { type: 'false' },
              message: { type: 'string' },
              statusCode: { type: 'number' },
              timestamp: { type: 'string' },
            },
            example: {
              success: false,
              message: 'Your account has not been deleted yet',
              statusCode: HttpStatus.CONFLICT,
              timestamp: '2026-08-11T04:22:27.746Z',
            },
          },
        },
      },
    }),
  );
}

export function ApiUpdatePassword() {
  return applyDecorators(
    ApiOperation({ summary: 'Update password' }),
    ApiBody({
      schema: {
        type: 'object',
        properties: {
          oldPassword: { type: 'string' },
          newPassword: { type: 'string' },
          confirmPassword: { type: 'string' },
        },
        example: {
          oldPassword: PASSWORD,
          newPassword: NEW_PASSWORD,
          confirmPassword: NEW_PASSWORD,
        },
      },
    }),
    ApiResponse({
      status: HttpStatus.OK,
      description: 'Password successfully updated',
      content: {
        'application/json': {
          schema: {
            type: 'object',
            properties: {
              success: { type: 'true' },
              message: { type: 'string' },
            },
            example: {
              success: true,
              message: 'Password successfully updated',
            },
          },
        },
      },
    }),
    ApiResponse({
      status: HttpStatus.UNAUTHORIZED,
      description: 'Unauthorized: Old password is incorrect or invalid token',
      content: {
        'application/json': {
          schema: {
            type: 'object',
            properties: {
              success: { type: 'false' },
              message: { type: 'string' },
              statusCode: { type: 'number' },
              timestamp: { type: 'string' },
            },
          },
          examples: {
            'Incorrect Old Password': {
              value: {
                success: false,
                message: 'You entered wrong password',
                statusCode: HttpStatus.UNAUTHORIZED,
                timestamp: '2026-08-11T04:22:27.746Z',
              },
            },
            'Unauthorized, you are not logged in': {
              value: {
                success: false,
                message: 'Unauthorized, invalid token: token not found',
                statusCode: HttpStatus.UNAUTHORIZED,
                timestamp: '2026-08-11T04:22:27.746Z',
              },
            },
          },
        },
      },
    }),
    ApiResponse({
      status: HttpStatus.BAD_REQUEST,
      description: 'Password Validations',
      content: {
        'application/json': {
          schema: {
            type: 'object',
            properties: {
              success: { type: 'false' },
              message: { type: 'string' },
              statusCode: { type: 'number' },
              timestamp: { type: 'string' },
            },
          },
          examples: {
            'Password do not match': {
              value: {
                success: false,
                message: 'Passwords do not match',
                statusCode: HttpStatus.BAD_REQUEST,
                timestamp: '2026-08-11T04:22:27.746Z',
              },
            },
            'New password must be different from old password': {
              value: {
                success: false,
                message: 'New password must be different from old password',
                statusCode: HttpStatus.BAD_REQUEST,
                timestamp: '2026-08-11T04:22:27.746Z',
              },
            },
          },
        },
      },
    }),
  );
}

export function ApiForgotPassword() {
  return applyDecorators(
    ApiOperation({ summary: 'Forgot password' }),
    ApiBody({
      schema: {
        type: 'object',
        properties: { email: { type: 'string' } },
        example: { email: USER_EMAIL_ADDRESS },
      },
    }),
    ApiResponse({
      status: HttpStatus.OK,
      description:
        'Password reset request successfully submitted, please check your email',
      content: {
        'application/json': {
          schema: {
            type: 'object',
            properties: {
              success: { type: 'true' },
              message: { type: 'string' },
            },
            example: {
              success: true,
              message:
                'Password reset request successfully submitted, please check your email',
            },
          },
        },
      },
    }),
    ApiResponse({
      status: HttpStatus.UNAUTHORIZED,
      description: 'User not found',
      content: {
        'application/json': {
          schema: {
            type: 'object',
            properties: {
              success: { type: 'false' },
              message: { type: 'string' },
              statusCode: { type: 'number' },
              timestamp: { type: 'string' },
            },
            example: {
              success: false,
              message: 'User not found',
              statusCode: HttpStatus.UNAUTHORIZED,
              timestamp: '2026-08-11T04:22:27.746Z',
            },
          },
        },
      },
    }),
    ApiResponse({
      status: HttpStatus.BAD_REQUEST,
      description: 'Invalid email',
      content: {
        'application/json': {
          schema: {
            type: 'object',
            properties: {
              success: { type: 'false' },
              message: { type: 'string' },
              statusCode: { type: 'number' },
              timestamp: { type: 'string' },
            },
            example: {
              success: false,
              message: 'Invalid email',
              statusCode: HttpStatus.BAD_REQUEST,
              timestamp: '2026-08-11T04:22:27.746Z',
            },
          },
        },
      },
    }),
  );
}

export function ApiResetPassword() {
  return applyDecorators(
    ApiOperation({ summary: 'Reset password' }),
    ApiBody({
      schema: {
        oneOf: [
          {
            type: 'object',
            properties: {
              email: { type: 'string' },
              newPassword: { type: 'string' },
              confirmPassword: { type: 'string' },
              token: { type: 'string' },
            },
            required: ['email', 'newPassword', 'confirmPassword', 'token'],
          },
          {
            type: 'object',
            properties: {
              email: { type: 'string' },
              newPassword: { type: 'string' },
              confirmPassword: { type: 'string' },
              otp: { type: 'number' },
            },
            required: ['email', 'newPassword', 'confirmPassword', 'otp'],
          },
        ],
      },
      examples: {
        'With Token': {
          value: {
            email: USER_EMAIL_ADDRESS,
            newPassword: PASSWORD,
            confirmPassword: PASSWORD,
            token:
              'abddf1ea3bbee74b183df5b6da1a925b3f23a29e2e370e59272370893339fe44',
          },
        },
        'With OTP': {
          value: {
            email: USER_EMAIL_ADDRESS,
            newPassword: PASSWORD,
            confirmPassword: PASSWORD,
            otp: 123456,
          },
        },
      },
    }),
    ApiResponse({
      status: HttpStatus.OK,
      description:
        'Password reset request successfully submitted, please check your email',
      content: {
        'application/json': {
          schema: {
            type: 'object',
            properties: {
              success: { type: 'true' },
              message: { type: 'string' },
            },
            example: {
              success: true,
              message:
                'Password reset request successfully submitted, please check your email',
            },
          },
        },
      },
    }),
    ApiResponse({
      status: HttpStatus.UNAUTHORIZED,
      description: 'Unauthorized access',
      content: {
        'application/json': {
          schema: {
            type: 'object',
            properties: {
              success: { type: 'false' },
              message: { type: 'string' },
              statusCode: { type: 'number' },
              timestamp: { type: 'string' },
            },
          },
          examples: {
            'Invalid Token or OTP': {
              value: {
                success: false,
                message: 'Unauthorized, token or OTP is invalid or expired',
                statusCode: HttpStatus.UNAUTHORIZED,
                timestamp: '2026-08-11T04:22:27.746Z',
              },
            },
            'Email Mismatch': {
              value: {
                success: false,
                message: 'Email does not match the token or OTP provided',
                statusCode: HttpStatus.UNAUTHORIZED,
                timestamp: '2026-08-11T04:22:27.746Z',
              },
            },
          },
        },
      },
    }),
    ApiResponse({
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      description: 'User not found for password reset',
      content: {
        'application/json': {
          schema: {
            type: 'object',
            properties: {
              success: { type: 'false' },
              message: { type: 'string' },
              statusCode: { type: 'number' },
              timestamp: { type: 'string' },
            },
            example: {
              success: false,
              message: 'User not found for password reset',
              statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
              timestamp: '2026-08-11T04:22:27.746Z',
            },
          },
        },
      },
    }),
  );
}
