import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';
import fs from 'fs';
import { FileSystemStoredFile } from 'nestjs-form-data';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const request = ctx.getRequest<Request>();
    const response = ctx.getResponse<Response>();

    const deleteFiles = (obj: unknown) => {
      if (!obj) return;
      if (Array.isArray(obj)) {
        obj.forEach(deleteFiles);
      } else if (typeof obj === 'object') {
        if (obj instanceof FileSystemStoredFile) {
          if (obj.path) {
            fs.promises.unlink(obj.path).catch((err) => {
              console.error('Error deleting file:', err);
            });
          }
        } else {
          for (const key of Object.keys(obj)) {
            deleteFiles(obj[key]);
          }
        }
      }
    };

    if (request.body) {
      deleteFiles(request.body);
    }

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const exceptionResponse =
      exception instanceof HttpException ? exception.getResponse() : null;

    const message =
      exceptionResponse &&
      typeof exceptionResponse === 'object' &&
      exceptionResponse['message']
        ? (exceptionResponse['message'] as string[])
        : exception instanceof Error
          ? exception.message
          : 'Internal Server Error';

    response.status(status).json({
      success: false,
      message,
      statusCode: status,
      timestamp: new Date().toISOString(),
    });
  }
}
