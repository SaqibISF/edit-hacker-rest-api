import {
  BadRequestException,
  Injectable,
  Optional,
  PipeTransform,
} from '@nestjs/common';
import { emailSchema } from '../../zod-schemas/email.schema';

@Injectable()
export class EmailPipe implements PipeTransform<string | undefined> {
  constructor(@Optional() private readonly isOptional: boolean = false) {}

  transform(value: string | undefined): string | undefined {
    if (!value && this.isOptional) {
      return undefined;
    }

    const { success, data: email, error } = emailSchema.safeParse(value);

    if (!success) throw new BadRequestException(error.issues[0].message);

    return email;
  }
}
