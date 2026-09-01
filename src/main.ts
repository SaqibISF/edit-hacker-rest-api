import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './http-exception/http-exception.filter';
import cookieParser from 'cookie-parser';
import dns from 'node:dns';
import compression from 'compression';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'node:path';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import type { NextFunction, Request, Response } from 'express';

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

  const SWAGGER_CDN = 'https://cdn.jsdelivr.net/npm/swagger-ui-dist@5';

  app.use((req: Request, res: Response, next: NextFunction) => {
    if (req.path === '/swagger-ui.css') {
      return res.redirect(302, `${SWAGGER_CDN}/swagger-ui.css`);
    }
    if (req.path === '/swagger-ui-bundle.js') {
      return res.redirect(302, `${SWAGGER_CDN}/swagger-ui-bundle.js`);
    }
    if (req.path === '/swagger-ui-standalone-preset.js') {
      return res.redirect(
        302,
        `${SWAGGER_CDN}/swagger-ui-standalone-preset.js`,
      );
    }
    if (req.path === '/favicon-32x32.png') {
      return res.redirect(302, `${SWAGGER_CDN}/favicon-32x32.png`);
    }
    if (req.path === '/favicon-16x16.png') {
      return res.redirect(302, `${SWAGGER_CDN}/favicon-16x16.png`);
    }
    next();
  });

  const config = new DocumentBuilder()
    .setTitle('Welcome to Edit Hacker REST API!')
    .setVersion('1.0')
    .addBearerAuth() // Adds a lock button for JWT authorization
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('/', app, document, {
    customCssUrl: `${SWAGGER_CDN}/swagger-ui.css`,
    customJs: [
      `${SWAGGER_CDN}/swagger-ui-bundle.js`,
      `${SWAGGER_CDN}/swagger-ui-standalone-preset.js`,
    ],
    customfavIcon: `${SWAGGER_CDN}/favicon-32x32.png`,
    customSiteTitle: 'Welcome to Edit Hacker REST API!',
  });

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
