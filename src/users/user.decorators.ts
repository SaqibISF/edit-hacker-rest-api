import { applyDecorators, HttpStatus } from '@nestjs/common';
import {
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiConsumes,
} from '@nestjs/swagger';

const TIMESTAMP_EXAMPLE = '2026-08-11T04:22:27.746Z';

const USER_SCHEMA_PROPERTIES = {
  type: 'object',
  properties: {
    _id: { type: 'string' },
    name: { type: 'string' },
    slug: { type: 'string' },
    email: { type: 'string' },
    role: { type: 'string', enum: ['admin', 'user'] },
    avatarUrl: { type: 'string' },
    mobile: { type: 'string' },
    emailVerifiedAt: { type: 'string', format: 'date-time' },
    passwordResetAt: { type: 'string', format: 'date-time' },
    lastLoginAt: { type: 'string', format: 'date-time' },
    bannedAt: { type: 'string', format: 'date-time' },
    banReason: { type: 'string' },
    deletedAt: { type: 'string', format: 'date-time' },
    createdAt: { type: 'string', format: 'date-time' },
    updatedAt: { type: 'string', format: 'date-time' },
  },
};

const USER_EXAMPLE = {
  _id: '64d3e2b5f1a2c3d4e5f6g7h8',
  name: 'John Doe',
  slug: 'john-doe',
  email: 'john.doe@example.com',
  role: 'user',
  avatarUrl: 'https://example.com/avatar.jpg',
  mobile: '+1234567890',
  emailVerifiedAt: TIMESTAMP_EXAMPLE,
  passwordResetAt: TIMESTAMP_EXAMPLE,
  lastLoginAt: TIMESTAMP_EXAMPLE,
  createdAt: TIMESTAMP_EXAMPLE,
  updatedAt: TIMESTAMP_EXAMPLE,
};
const UnauthorizedResponse = ApiResponse({
  status: HttpStatus.UNAUTHORIZED,
  description: 'Unauthorized, invalid token: token not found',
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
          timestamp: TIMESTAMP_EXAMPLE,
        },
      },
    },
  },
});

export function ApiGetUser() {
  return applyDecorators(
    ApiOperation({ summary: 'Get current user profile' }),
    ApiResponse({
      status: HttpStatus.OK,
      description: 'User successfully retrieved',
      content: {
        'application/json': {
          schema: {
            type: 'object',
            properties: {
              success: { type: 'true' },
              message: { type: 'string' },
              user: USER_SCHEMA_PROPERTIES,
            },
            example: {
              success: true,
              message: 'User successfully retrieved',
              user: USER_EXAMPLE,
            },
          },
        },
      },
    }),
    UnauthorizedResponse,
  );
}

export function ApiUpdateUser() {
  return applyDecorators(
    ApiOperation({ summary: 'Update current user profile' }),
    ApiBody({
      schema: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          mobile: { type: 'string' },
        },
        example: { name: 'John Doe', mobile: '+1234567890' },
      },
    }),
    ApiResponse({
      status: HttpStatus.OK,
      description: 'User updated successfully',
      content: {
        'application/json': {
          schema: {
            type: 'object',
            properties: {
              success: { type: 'true' },
              message: { type: 'string' },
              user: USER_SCHEMA_PROPERTIES,
            },
            example: {
              success: true,
              message: 'User updated successfully',
              user: USER_EXAMPLE,
            },
          },
        },
      },
    }),
    ApiResponse({
      status: HttpStatus.NOT_FOUND,
      description: 'User is not found',
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
              message: 'User is not found',
              statusCode: HttpStatus.NOT_FOUND,
              timestamp: TIMESTAMP_EXAMPLE,
            },
          },
        },
      },
    }),
    UnauthorizedResponse,
  );
}

export function ApiUpdateUserAvatar() {
  return applyDecorators(
    ApiOperation({ summary: 'Update user avatar' }),
    ApiConsumes('multipart/form-data'),
    ApiBody({
      schema: {
        type: 'object',
        properties: { avatar: { type: 'string', format: 'binary' } },
        required: ['avatar'],
        example: { avatar: 'binary' },
      },
    }),
    ApiResponse({
      status: HttpStatus.OK,
      description: 'Avatar updated successfully',
      content: {
        'application/json': {
          schema: {
            type: 'object',
            properties: {
              success: { type: 'true' },
              message: { type: 'string' },
              user: USER_SCHEMA_PROPERTIES,
            },
            example: {
              success: true,
              message: 'Avatar updated successfully',
              user: USER_EXAMPLE,
            },
          },
        },
      },
    }),
    ApiResponse({
      status: HttpStatus.NOT_FOUND,
      description: 'User is not found',
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
              message: 'User is not found',
              statusCode: HttpStatus.NOT_FOUND,
              timestamp: TIMESTAMP_EXAMPLE,
            },
          },
        },
      },
    }),
    UnauthorizedResponse,
  );
}

export function ApiRemoveUserAvatar() {
  return applyDecorators(
    ApiOperation({ summary: 'Remove user avatar' }),
    ApiResponse({
      status: HttpStatus.OK,
      description: 'Avatar removed successfully',
      content: {
        'application/json': {
          schema: {
            type: 'object',
            properties: {
              success: { type: 'true' },
              message: { type: 'string' },
              user: USER_SCHEMA_PROPERTIES,
            },
            example: {
              success: true,
              message: 'Avatar removed successfully',
              user: USER_EXAMPLE,
            },
          },
        },
      },
    }),
    ApiResponse({
      status: HttpStatus.NOT_FOUND,
      description: 'Not found errors',
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
            'User Not Found': {
              value: {
                success: false,
                message: 'User is not found',
                statusCode: HttpStatus.NOT_FOUND,
                timestamp: TIMESTAMP_EXAMPLE,
              },
            },
            'Avatar Not Found': {
              value: {
                success: false,
                message: 'Avatar is not found',
                statusCode: HttpStatus.NOT_FOUND,
                timestamp: TIMESTAMP_EXAMPLE,
              },
            },
          },
        },
      },
    }),
    UnauthorizedResponse,
  );
}

export function ApiDeleteUser() {
  return applyDecorators(
    ApiOperation({ summary: 'Delete user account' }),
    ApiResponse({
      status: HttpStatus.OK,
      description:
        'User deleted successfully, you can restore it within 90 days',
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
                'User deleted successfully, you can restore it within 90 days',
            },
          },
        },
      },
    }),
    ApiResponse({
      status: HttpStatus.BAD_REQUEST,
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
              statusCode: HttpStatus.BAD_REQUEST,
              timestamp: TIMESTAMP_EXAMPLE,
            },
          },
        },
      },
    }),
    ApiResponse({
      status: HttpStatus.CONFLICT,
      description: 'User already deleted',
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
              message: 'User already deleted',
              statusCode: HttpStatus.CONFLICT,
              timestamp: TIMESTAMP_EXAMPLE,
            },
          },
        },
      },
    }),
    UnauthorizedResponse,
  );
}
