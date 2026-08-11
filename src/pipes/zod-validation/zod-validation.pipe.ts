import {
  ArgumentMetadata,
  BadRequestException,
  Injectable,
  PipeTransform,
} from '@nestjs/common';
import { ZodError, ZodObject, type ZodSchema } from 'zod';

@Injectable()
export class ZodValidationPipe implements PipeTransform {
  constructor(private schema: ZodSchema) {}

  transform(value: unknown, metadata: ArgumentMetadata) {
    if (
      metadata.type === 'custom' ||
      (this.schema instanceof ZodObject && typeof value === 'string')
    ) {
      return value;
    }

    try {
      const parsedValue = this.schema.parse(value);
      return parsedValue;
    } catch (error) {
      if (error instanceof ZodError) {
        const errorMessages = error.issues.map((issue) => issue.message);

        throw new BadRequestException({
          success: false,
          message: errorMessages.join(', '),
        });
      }

      throw new BadRequestException('Validation failed');
    }
  }
}
