import { NestFactory } from '@nestjs/core';
import { Logger, ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

import { AppModule } from './app.module';
import { LogColor } from './common/logger/log-colors';
import { AppLogger } from './common/logger/app.logger';

const logger = new Logger('Bootstrap');

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });
  app.useLogger(new AppLogger());

  app.setGlobalPrefix('/api/v1');

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      stopAtFirstError: true,
    }),
  );

  // ---- CORS Allow ----
  const corsOrigins: string[] =
    process.env.CORS_ORIGINS?.split(',')
      .map((origin) => origin.trim())
      .filter(Boolean) ?? [];

  app.enableCors({
    origin: (
      origin: string | undefined,
      callback: (err: Error | null, allow?: boolean) => void,
    ) => {
      if (!origin || corsOrigins.includes(origin)) {
        callback(null, true);
        return;
      }

      new Logger('CORS').warn(`Blocked origin: ${origin}`);
      callback(null, false);
    },
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });

  // ---- Swagger ----
  const swaggerPath = process.env.SWAGGER_PATH ?? 'api/docs';

  const swaggerConfig = new DocumentBuilder()
    .setTitle(process.env.SWAGGER_TITLE ?? 'Chakra API')
    .setDescription(process.env.SWAGGER_DESCRIPTION ?? 'Chakra backend API')
    .setVersion(process.env.SWAGGER_VERSION ?? '1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Paste the accessToken from POST /auth/login',
      },
      'jwt',
    )
    .addSecurityRequirements('jwt')
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);

  SwaggerModule.setup(swaggerPath, app, document, {
    swaggerOptions: {
      persistAuthorization: true,
      deepLinking: true,
      displayRequestDuration: true,
      tryItOutEnabled: true,
    },
    customCss: '.swagger-ui .topbar { display: none }',
  });

  const port = process.env.PORT ?? 3000;
  await app.listen(port);

  logger.log(LogColor.red(`Server running on port ${port}`));
  logger.log(LogColor.cyan(`Swagger: http://localhost:${port}/${swaggerPath}`));
}

void bootstrap();
