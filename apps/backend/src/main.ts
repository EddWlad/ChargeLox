import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import { AppModule } from './app.module';

function ensureUploadsDirectories(): void {
  const dirs = [
    process.env.ACTIVITIES_UPLOAD_DIR ?? 'uploads/activities',
    process.env.AVATARS_UPLOAD_DIR ?? 'uploads/avatars',
    process.env.CHARGING_POINTS_UPLOAD_DIR ?? 'uploads/charging-points',
  ];

  dirs.forEach((dir) => {
    const fullPath = join(process.cwd(), dir);
    if (!existsSync(fullPath)) {
      mkdirSync(fullPath, { recursive: true });
    }
  });
}

async function bootstrap() {
  ensureUploadsDirectories();

  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  app.useStaticAssets(join(process.cwd(), 'uploads'), {
    prefix: '/uploads/',
  });

  const swaggerConfig = new DocumentBuilder()
    .setTitle('ChargeLox API')
    .setDescription(
      'API REST para monitoreo de puntos de carga y electrolineras (KIA/JAC).',
    )
    .setVersion('1.0.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Token JWT en encabezado Authorization: Bearer <token>',
      },
      'access-token',
    )
    .build();

  const swaggerDocument = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, swaggerDocument, {
    swaggerOptions: { persistAuthorization: true },
  });

  const port = Number(process.env.PORT ?? 3000);
  await app.listen(port);
}

void bootstrap();
