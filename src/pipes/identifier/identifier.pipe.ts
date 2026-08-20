import {
  ArgumentMetadata,
  BadRequestException,
  Injectable,
  Optional,
  PipeTransform,
} from '@nestjs/common';
import { Types } from 'mongoose';
import { identifierSchema } from '../../zod-schemas/identifier.schema';

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

    const {
      success,
      data: identifier,
      error,
    } = identifierSchema.safeParse(value);

    if (!success) throw new BadRequestException(error.issues[0].message);

    return identifier;
  }
}
