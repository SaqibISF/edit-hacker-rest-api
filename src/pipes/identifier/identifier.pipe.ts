import {
  ArgumentMetadata,
  BadRequestException,
  Injectable,
  Optional,
  PipeTransform,
} from '@nestjs/common';
import { Types } from 'mongoose';

@Injectable()
export class IdentifierPipe implements PipeTransform<
  string | undefined,
  Types.ObjectId | string | undefined
> {
  constructor(@Optional() private readonly isOptional: boolean = false) {}

  transform(
    value: string | undefined,
    metadata: ArgumentMetadata,
  ): Types.ObjectId | string | undefined {
    // 1. Handle Optional Values (e.g., for optional query params)
    if (!value && this.isOptional) {
      return undefined;
    }

    // 2. Add Contextual Error Messages (using metadata.data to name the field)
    const fieldName = metadata.data || 'identifier';

    if (!value)
      throw new BadRequestException(`Identifier is required ${fieldName}`);

    try {
      if (Types.ObjectId.isValid(value)) {
        return Types.ObjectId.createFromHexString(value);
      } else return value;
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Invalid identifier';
      throw new BadRequestException(`Invalid ${fieldName} ${message}`);
    }
  }
}
