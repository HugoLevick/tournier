import { Logger, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const logger = new Logger('Bootstrap');

  const app = await NestFactory.create(AppModule);

  //Validacion global
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      forbidUnknownValues: true,
    }),
  );

  app.setGlobalPrefix('api');

  app.enableCors({
    origin: [
      'https://tournier.xyz',
      'https://www.tournier.xyz',
      'http://localhost:3000',
    ],
  });

  await app.listen(process.env.PORT);

  logger.log('App running on port ' + process.env.PORT);
}

bootstrap();
