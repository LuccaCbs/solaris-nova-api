import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const configService = app.get(ConfigService);
  const port = configService.get<number>('PORT') || 3001;

  app.enableCors({
    origin: [
      'http://localhost:5173',
      'http://localhost:3000',
      'https://www.solarismanager.com',
      'https://solarismanager.com',
    ],
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    }),
  );

  const solarisApiUrl = configService.get<string>('SOLARIS_API_URL');

  await app.listen(port);

  console.log(`Nova Copilot API running on port ${port}`);
  console.log(`Solaris API URL: ${solarisApiUrl ?? '(not set)'}`);
}

bootstrap();
