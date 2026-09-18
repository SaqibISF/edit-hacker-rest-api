import { applyDecorators, HttpStatus } from '@nestjs/common';
import {
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
  ApiConsumes,
  ApiBody,
} from '@nestjs/swagger';

const TIMESTAMP_EXAMPLE = '2026-09-18T16:00:00.000Z';

const ErrorResponse = (
  status: number,
  description: string,
  message: string,
) => {
  return ApiResponse({
    status,
    description,
    content: {
      'application/json': {
        schema: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            message: { type: 'string', example: message },
            statusCode: { type: 'number', example: status },
            timestamp: { type: 'string', example: TIMESTAMP_EXAMPLE },
          },
        },
      },
    },
  });
};

const UnauthorizedResponse = ErrorResponse(
  HttpStatus.UNAUTHORIZED,
  'Unauthorized, invalid or missing authentication token',
  'Unauthorized: token not found',
);

const ForbiddenResponse = ErrorResponse(
  HttpStatus.FORBIDDEN,
  'Forbidden, admin permissions required',
  'You do not have permission to access this resource',
);

export function ApiGetCollectionsDocs() {
  return applyDecorators(
    ApiOperation({
      summary: 'Get database collections information',
      description:
        'Returns a list of all database collections and their current document counts.',
    }),
    ApiResponse({
      status: HttpStatus.OK,
      description: 'Collections successfully retrieved',
      content: {
        'application/json': {
          schema: {
            type: 'object',
            properties: {
              success: { type: 'boolean', example: true },
              message: {
                type: 'string',
                example: 'Collections retrieved successfully',
              },
              collections: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    name: { type: 'string', example: 'tools' },
                    documentCount: { type: 'number', example: 142 },
                  },
                },
              },
            },
          },
        },
      },
    }),
    UnauthorizedResponse,
    ForbiddenResponse,
  );
}

export function ApiGetBackupsDocs() {
  return applyDecorators(
    ApiOperation({
      summary: 'List all existing backups on the server',
      description:
        'Retrieves metadata for all backup files currently stored on the server filesystem.',
    }),
    ApiResponse({
      status: HttpStatus.OK,
      description: 'Backups successfully retrieved',
      content: {
        'application/json': {
          schema: {
            type: 'object',
            properties: {
              success: { type: 'boolean', example: true },
              message: {
                type: 'string',
                example: 'Backups retrieved successfully',
              },
              backups: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    filename: {
                      type: 'string',
                      example: 'backup-full-2026-09-18_16-00-00.json',
                    },
                    size: { type: 'number', example: 524288 },
                    sizeFormatted: { type: 'string', example: '512 KB' },
                    createdAt: { type: 'string', format: 'date-time' },
                    isCompressed: { type: 'boolean', example: false },
                    collections: {
                      type: 'array',
                      items: { type: 'string' },
                      example: ['users', 'tools', 'categories'],
                    },
                    totalDocuments: { type: 'number', example: 1250 },
                  },
                },
              },
            },
          },
        },
      },
    }),
    UnauthorizedResponse,
    ForbiddenResponse,
  );
}

export function ApiCreateBackupDocs() {
  return applyDecorators(
    ApiOperation({
      summary: 'Create a new database backup',
      description:
        'Creates and persists a backup of the whole database or specified collections.',
    }),
    ApiBody({
      schema: {
        type: 'object',
        properties: {
          collections: {
            type: 'array',
            items: { type: 'string' },
            example: ['users', 'tools'],
            description:
              'Optional list of collections to back up. If omitted, all collections are backed up.',
          },
          name: {
            type: 'string',
            example: 'pre-deployment',
            description: 'Optional custom prefix for the backup filename',
          },
          compress: {
            type: 'boolean',
            example: false,
            description: 'Whether to compress the output as GZIP (.json.gz)',
          },
        },
      },
    }),
    ApiResponse({
      status: HttpStatus.CREATED,
      description: 'Backup created successfully',
      content: {
        'application/json': {
          schema: {
            type: 'object',
            properties: {
              success: { type: 'boolean', example: true },
              message: {
                type: 'string',
                example: 'Backup created successfully',
              },
              backup: {
                type: 'object',
                properties: {
                  filename: {
                    type: 'string',
                    example: 'backup-pre-deployment-2026-09-18_16-00-00.json',
                  },
                  size: { type: 'number', example: 524288 },
                  sizeFormatted: { type: 'string', example: '512 KB' },
                  createdAt: { type: 'string', format: 'date-time' },
                  collections: {
                    type: 'array',
                    items: { type: 'string' },
                  },
                  totalDocuments: { type: 'number', example: 1250 },
                },
              },
            },
          },
        },
      },
    }),
    ErrorResponse(
      HttpStatus.BAD_REQUEST,
      'Invalid request data',
      'Validation failed',
    ),
    UnauthorizedResponse,
    ForbiddenResponse,
  );
}

export function ApiExportBackupDocs() {
  return applyDecorators(
    ApiOperation({
      summary: 'Export and stream backup file directly',
      description:
        'Streams a generated backup file directly as an HTTP download attachment without saving permanently.',
    }),
    ApiQuery({
      name: 'collections',
      required: false,
      type: String,
      description: 'Comma-separated collection names (e.g. users,tools)',
    }),
    ApiQuery({
      name: 'compress',
      required: false,
      type: Boolean,
      description: 'Whether to compress as .json.gz',
    }),
    ApiResponse({
      status: HttpStatus.OK,
      description: 'Backup file stream',
    }),
    UnauthorizedResponse,
    ForbiddenResponse,
  );
}

export function ApiDownloadBackupDocs() {
  return applyDecorators(
    ApiOperation({
      summary: 'Download a stored backup file',
      description: 'Streams a stored backup file by its filename.',
    }),
    ApiParam({
      name: 'filename',
      required: true,
      type: String,
      example: 'backup-full-2026-09-18_16-00-00.json',
    }),
    ApiResponse({
      status: HttpStatus.OK,
      description: 'Backup file stream',
    }),
    ErrorResponse(
      HttpStatus.NOT_FOUND,
      'Backup file not found',
      'Backup file does not exist',
    ),
    UnauthorizedResponse,
    ForbiddenResponse,
  );
}

export function ApiDeleteBackupDocs() {
  return applyDecorators(
    ApiOperation({
      summary: 'Delete a stored backup file',
      description: 'Deletes a backup file from the server filesystem.',
    }),
    ApiParam({
      name: 'filename',
      required: true,
      type: String,
      example: 'backup-full-2026-09-18_16-00-00.json',
    }),
    ApiResponse({
      status: HttpStatus.OK,
      description: 'Backup file successfully deleted',
      content: {
        'application/json': {
          schema: {
            type: 'object',
            properties: {
              success: { type: 'boolean', example: true },
              message: {
                type: 'string',
                example: 'Backup file successfully deleted',
              },
            },
          },
        },
      },
    }),
    ErrorResponse(
      HttpStatus.NOT_FOUND,
      'Backup file not found',
      'Backup file does not exist',
    ),
    UnauthorizedResponse,
    ForbiddenResponse,
  );
}

export function ApiUploadBackupDocs() {
  return applyDecorators(
    ApiOperation({
      summary: 'Upload a backup file',
      description: 'Uploads a valid JSON or GZ backup file to server storage.',
    }),
    ApiConsumes('multipart/form-data'),
    ApiBody({
      schema: {
        type: 'object',
        properties: {
          file: {
            type: 'string',
            format: 'binary',
            description: 'Backup file (.json or .json.gz)',
          },
        },
        required: ['file'],
      },
    }),
    ApiResponse({
      status: HttpStatus.CREATED,
      description: 'Backup file uploaded successfully',
      content: {
        'application/json': {
          schema: {
            type: 'object',
            properties: {
              success: { type: 'boolean', example: true },
              message: {
                type: 'string',
                example: 'Backup file uploaded successfully',
              },
              backup: {
                type: 'object',
                properties: {
                  filename: { type: 'string' },
                  size: { type: 'number' },
                  sizeFormatted: { type: 'string' },
                  createdAt: { type: 'string', format: 'date-time' },
                },
              },
            },
          },
        },
      },
    }),
    ErrorResponse(
      HttpStatus.BAD_REQUEST,
      'Invalid file format',
      'Invalid backup file format',
    ),
    UnauthorizedResponse,
    ForbiddenResponse,
  );
}

export function ApiRestoreBackupDocs() {
  return applyDecorators(
    ApiOperation({
      summary: 'Restore database from an existing stored backup',
      description:
        'Restores the database or selected collections using either replace or merge strategy.',
    }),
    ApiParam({
      name: 'filename',
      required: true,
      type: String,
      example: 'backup-full-2026-09-18_16-00-00.json',
    }),
    ApiBody({
      schema: {
        type: 'object',
        properties: {
          mode: {
            type: 'string',
            enum: ['replace', 'merge'],
            default: 'replace',
            description:
              'replace: clears collection before inserting; merge: upserts by _id without deleting existing records',
          },
          collections: {
            type: 'array',
            items: { type: 'string' },
            description: 'Optional subset of collections to restore',
          },
        },
      },
    }),
    ApiResponse({
      status: HttpStatus.OK,
      description: 'Database restored successfully',
      content: {
        'application/json': {
          schema: {
            type: 'object',
            properties: {
              success: { type: 'boolean', example: true },
              message: {
                type: 'string',
                example: 'Database restore completed successfully',
              },
              mode: { type: 'string', example: 'replace' },
              restoredCollections: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    collection: { type: 'string', example: 'tools' },
                    documentsRestored: { type: 'number', example: 142 },
                  },
                },
              },
              totalDocumentsRestored: { type: 'number', example: 1250 },
            },
          },
        },
      },
    }),
    ErrorResponse(
      HttpStatus.NOT_FOUND,
      'Backup file not found',
      'Backup file does not exist',
    ),
    ErrorResponse(
      HttpStatus.BAD_REQUEST,
      'Restore failed',
      'Corrupted backup file',
    ),
    UnauthorizedResponse,
    ForbiddenResponse,
  );
}

export function ApiRestoreUploadDocs() {
  return applyDecorators(
    ApiOperation({
      summary: 'Upload backup and restore database immediately',
      description:
        'Uploads a backup file and executes immediate database restoration in one single request.',
    }),
    ApiConsumes('multipart/form-data'),
    ApiBody({
      schema: {
        type: 'object',
        properties: {
          file: { type: 'string', format: 'binary' },
          mode: {
            type: 'string',
            enum: ['replace', 'merge'],
            default: 'replace',
          },
          collections: {
            type: 'string',
            description:
              'Optional comma-separated or JSON array string of collections to restore',
          },
        },
        required: ['file'],
      },
    }),
    ApiResponse({
      status: HttpStatus.OK,
      description: 'Database restored successfully',
      content: {
        'application/json': {
          schema: {
            type: 'object',
            properties: {
              success: { type: 'boolean', example: true },
              message: {
                type: 'string',
                example: 'Database restore completed successfully',
              },
              totalDocumentsRestored: { type: 'number', example: 1250 },
            },
          },
        },
      },
    }),
    ErrorResponse(
      HttpStatus.BAD_REQUEST,
      'Restore failed',
      'Invalid file or restoration error',
    ),
    UnauthorizedResponse,
    ForbiddenResponse,
  );
}
