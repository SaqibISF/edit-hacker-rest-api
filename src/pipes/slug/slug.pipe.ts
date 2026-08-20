import {
  BadRequestException,
  Injectable,
  Optional,
  PipeTransform,
} from '@nestjs/common';
import { slugSchema } from '../../zod-schemas/slug.schema';

@Injectable()
export class SlugPipe implements PipeTransform<string | undefined> {
  constructor(@Optional() private readonly isOptional: boolean = false) {}

  transform(value: string | undefined): string | undefined {
    if (!value && this.isOptional) {
      return undefined;
    }

    const { success, data: slug, error } = slugSchema.safeParse(value);

    if (!success) throw new BadRequestException(error.issues[0].message);

    return slug;
  }
}
