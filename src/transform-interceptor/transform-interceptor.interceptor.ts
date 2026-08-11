import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface ApiResponse {
  success: boolean;
  message: string;
  [key: string]: unknown;
}

@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<T, unknown> {
  constructor(private readonly reflector: Reflector) {}

  intercept(
    context: ExecutionContext,
    next: CallHandler<T>,
  ): Observable<ApiResponse> {
    const message = this.reflector.get<string>(
      'response-message',
      context.getHandler(),
    );

    return next
      .handle()
      .pipe(map((data): ApiResponse => ({ success: true, message, ...data })));
  }
}
