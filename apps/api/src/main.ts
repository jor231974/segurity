import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { ConfigService } from '@nestjs/config';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import helmet from 'helmet';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { AuditInterceptor } from './common/interceptors/audit.interceptor';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { PrismaService } from './prisma/prisma.service';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    bodyParser: true,
    rawBody: true,
  });
  app.useBodyParser('json', { limit: '30mb' });
  app.useBodyParser('urlencoded', { limit: '30mb', extended: true });
  app.useBodyParser('raw', { type: 'application/octet-stream', limit: '30mb' });
  const config = app.get(ConfigService);

  app.use(helmet());
  app.enableCors({
    origin: config.get<string>('CORS_ORIGINS', 'http://localhost:3000').split(','),
    credentials: true,
  });

  app.setGlobalPrefix('api');

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  app.useGlobalInterceptors(new TransformInterceptor(), new AuditInterceptor(app.get(PrismaService)));
  app.useGlobalFilters(new AllExceptionsFilter());

  const swaggerConfig = new DocumentBuilder()
    .setTitle('Sistema Integral de Seguridad Privada')
    .setDescription('API REST para empresas de seguridad privada — Grupo Servicom')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('docs', app, document);

  const port = config.get<number>('API_PORT', 3001);
  await app.listen(port);
  console.log(`Servidor ejecutándose en http://localhost:${port}`);
  console.log(`Swagger docs: http://localhost:${port}/docs`);
}
bootstrap();