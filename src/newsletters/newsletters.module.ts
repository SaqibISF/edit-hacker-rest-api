import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { NewslettersController } from './newsletters.controller';
import { NewslettersService } from './newsletters.service';
import NewsletterSchema, { Newsletter } from './newsletter.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Newsletter.name, schema: NewsletterSchema },
    ]),
  ],
  controllers: [NewslettersController],
  providers: [NewslettersService],
})
export class NewslettersModule {}
