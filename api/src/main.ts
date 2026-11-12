import 'reflect-metadata'; // decorator metadata: must come first
import { ValidationPipe, VersioningType } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/all-exceptions.filter';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('api'); // every URL starts with /api
  app.enableVersioning({ type: VersioningType.URI, defaultVersion: '1' }); // … then /v1
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));
  app.useGlobalFilters(new AllExceptionsFilter()); // one error shape for every route
  app.enableCors({ origin: process.env.CORS_ORIGIN ?? 'http://localhost:3001' });
  app.enableShutdownHooks();

  const port = Number(process.env.PORT ?? 3100);
  await app.listen(port);
  console.log(`CornerShop API on http://localhost:${port}/api/v1`);
}

bootstrap().catch((err: unknown) => {
  console.error(`Failed to start CornerShop API: ${err instanceof Error ? err.message : String(err)}`);
  process.exit(1);
});
