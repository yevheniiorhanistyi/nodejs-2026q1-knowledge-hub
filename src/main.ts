import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { AppLogger } from './common/logger/app-logger.service';
import { resolveLogLevels } from './common/logger/log-levels';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';

const PORT = parseInt(process.env.PORT) || 4000;
const logger = new Logger('Bootstrap');

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: new AppLogger({ logLevels: resolveLogLevels() }),
  });

  app.useGlobalFilters(new AllExceptionsFilter());

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  );

  app.useGlobalInterceptors(new LoggingInterceptor());

  const config = new DocumentBuilder()
    .setTitle('Knowledge Hub API')
    .setVersion('1.0')
    .build();
  SwaggerModule.setup('doc', app, SwaggerModule.createDocument(app, config));

  await app.listen(PORT);
  logger.log(`Application is running on port ${PORT}`);

  process.on('uncaughtException', async (err) => {
    logger.error('Uncaught Exception', err.stack);
    await app.close();
    process.exit(1);
  });

  process.on('unhandledRejection', async (reason) => {
    logger.error(
      'Unhandled Rejection',
      reason instanceof Error ? reason.stack : String(reason),
    );
    await app.close();
    process.exit(1);
  });
}
bootstrap();
