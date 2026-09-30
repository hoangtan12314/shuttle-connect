import { Module } from '@nestjs/common';
import { SessionModule, CourtModule, RequestModule } from './infrastructure/ioc';

@Module({
  imports: [SessionModule, CourtModule, RequestModule],
})
export class AppModule {}
