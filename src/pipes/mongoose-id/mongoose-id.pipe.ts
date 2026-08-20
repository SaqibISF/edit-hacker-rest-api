import {
  ArgumentMetadata,
  BadRequestException,
  Injectable,
  PipeTransform,
  Optional,
} from '@nestjs/common';
import { Types } from 'mongoose';
import { objectIdSchema } from '../../zod-schemas/objectId.schema';

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
    if (this.isOptional) {
      return undefined;
    }

    // 2. Add Contextual Error Messages (using metadata.data to name the field)
    const fieldName = metadata.data || 'id';

    if (!value) {
      throw new BadRequestException(
        `Invalid ObjectId format for field "${fieldName}": ${value}`,
      );
    }

    const { success, data: _id, error } = objectIdSchema.safeParse(value);

    if (!success) throw new BadRequestException(error.issues[0].message);

    return _id;
  }
}
