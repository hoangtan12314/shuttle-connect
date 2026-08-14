import { NestFactory } from '@nestjs/core';
import { ExpressAdapter } from '@nestjs/platform-express';
import { Type, ValidationPipe } from '@nestjs/common';
import { GlobalExceptionFilter } from '../../../controller/filters';
import { ResponseTransformInterceptor } from '../../rest';

export async function bootstrapNestApp(module: Type<any>, adapter: ExpressAdapter) {
  const nestApp = await NestFactory.create(module, adapter);

  nestApp.setGlobalPrefix('');
  nestApp.useGlobalPipes(
    new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }),
  );
  nestApp.useGlobalInterceptors(new ResponseTransformInterceptor());
  nestApp.useGlobalFilters(new GlobalExceptionFilter());

  await nestApp.init();

  return nestApp;
}
