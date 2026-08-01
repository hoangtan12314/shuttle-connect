import { NestFactory } from '@nestjs/core';
import { ExpressAdapter } from '@nestjs/platform-express';
import { ValidationPipe } from '@nestjs/common';
import { Callback, Context, Handler } from 'aws-lambda';
import express from 'express';
import serverlessExpress from '@codegenie/serverless-express';
import { SessionModule } from '../../ioc';
import { GlobalExceptionFilter } from '../../../controller/filters';
import { ResponseTransformInterceptor } from '../../rest';

let cachedServer: Handler;

async function bootstrapServer(): Promise<Handler> {
  const expressApp = express();
  const adapter = new ExpressAdapter(expressApp);

  const nestApp = await NestFactory.create(SessionModule, adapter);

  nestApp.setGlobalPrefix('');
  nestApp.useGlobalPipes(
    new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }),
  );
  nestApp.useGlobalInterceptors(new ResponseTransformInterceptor());
  nestApp.useGlobalFilters(new GlobalExceptionFilter());

  await nestApp.init();

  return serverlessExpress({
    app: expressApp,
  });
}

export const handler: Handler = async (event: any, context: Context, callback: Callback) => {
  cachedServer = cachedServer ?? (await bootstrapServer());
  return cachedServer(event, context, callback);
};
