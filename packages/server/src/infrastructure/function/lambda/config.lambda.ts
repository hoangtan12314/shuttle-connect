import { NestFactory } from '@nestjs/core';
import { ExpressAdapter } from '@nestjs/platform-express';
import { Type, ValidationPipe, VersioningType } from '@nestjs/common';
import { GlobalExceptionFilter } from '../../../controller/filters';
import { ResponseTransformInterceptor } from '../../rest';

export async function bootstrapNestApp(module: Type<any>, adapter: ExpressAdapter) {
  const nestApp = await NestFactory.create(module, adapter);

  // Every route is served under /api/v1: the global 'api' prefix comes first, then the URI
  // version (defaultVersion '1'), then the controller path -- without touching any controller. A
  // future breaking change can ship as @Version('2') on just the routes that change (/api/v2/...),
  // which baking 'v1' into the global prefix couldn't express. infra/api.ts routes /api/v1/* to match.
  nestApp.setGlobalPrefix('api');
  nestApp.enableVersioning({ type: VersioningType.URI, defaultVersion: '1' });
  nestApp.useGlobalPipes(
    new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }),
  );
  nestApp.useGlobalInterceptors(new ResponseTransformInterceptor());
  nestApp.useGlobalFilters(new GlobalExceptionFilter());

  await nestApp.init();

  return nestApp;
}
