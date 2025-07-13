import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // register global exception filter
  app.useGlobalFilters(new AllExceptionsFilter());

  const configService = app.get(ConfigService);
  const port = configService.get<number>('PORT', 3000);

  // Swagger setup
  const config = new DocumentBuilder()
    .setTitle('Job Server API')
    .setDescription('Job Server API documentation')
    .setVersion('1.0')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  await app.listen(port);
}
void bootstrap();
