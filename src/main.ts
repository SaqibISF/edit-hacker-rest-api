import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './http-exception/http-exception.filter';
import cookieParser from 'cookie-parser';
import dns from 'node:dns';
import compression from 'compression';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'node:path';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

dns.setServers(['8.8.8.8', '1.1.1.1']);

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  app.enableCors({
    origin: process.env.FRONTEND_URL,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });

  app.use(cookieParser());

  app.use(compression());

  app.useGlobalFilters(new HttpExceptionFilter());

  app.useStaticAssets(join(process.cwd(), 'public/uploads'));

  app.setGlobalPrefix('v1');

  app.enableShutdownHooks();

  const config = new DocumentBuilder()
    .setTitle('Welcome to Edit Hacker REST API!')
    .setVersion('1.0')
    .addBearerAuth() // Adds a lock button for JWT authorization
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('/', app, document);

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap()
  .then(() =>
    console.log(
      'EDIT HACKER REST API listening on PORT',
      process.env.PORT || 3001,
    ),
  )
  .catch((error) => console.log(error));
