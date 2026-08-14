import { ExpressAdapter } from '@nestjs/platform-express';
import { Callback, Context, Handler } from 'aws-lambda';
import express from 'express';
import serverlessExpress from '@codegenie/serverless-express';
import { CourtModule } from '../../ioc';
import { bootstrapNestApp } from './config.lambda';

let cachedServer: Handler;

async function bootstrapServer(): Promise<Handler> {
  const expressApp = express();
  const adapter = new ExpressAdapter(expressApp);

  await bootstrapNestApp(CourtModule, adapter);

  return serverlessExpress({
    app: expressApp,
  });
}
 
export const handler: Handler = async (event: any, context: Context, callback: Callback) => {
  cachedServer = cachedServer ?? (await bootstrapServer());
  return cachedServer(event, context, callback);
};
