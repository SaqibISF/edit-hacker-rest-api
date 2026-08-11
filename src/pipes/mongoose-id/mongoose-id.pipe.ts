import {
  ArgumentMetadata,
  BadRequestException,
  Injectable,
  PipeTransform,
  Optional,
} from '@nestjs/common';
import { Types } from 'mongoose';

@Injectable()
export class MongooseIdPipe implements PipeTransform<
  string | undefined,
  Types.ObjectId | undefined
> {
  constructor(@Optional() private readonly isOptional: boolean = false) {}

  transform(
    value: string | undefined,
    metadata: ArgumentMetadata,
  ): Types.ObjectId | undefined {
    // 1. Handle Optional Values (e.g., for optional query params)
    if (!value && this.isOptional) {
      return undefined;
    }

    // 2. Add Contextual Error Messages (using metadata.data to name the field)
    const fieldName = metadata.data || 'id';

    if (!value || !Types.ObjectId.isValid(value)) {
      throw new BadRequestException(
        `Invalid ObjectId format for field "${fieldName}": ${value}`,
      );
    }

    // 3. Use createFromHexString for safer transformation in newer Mongoose versions
    try {
      return Types.ObjectId.createFromHexString(value);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new BadRequestException(
        `Failed to transform "${fieldName}" to ObjectId: ${message}`,
      );
    }
  }
}
